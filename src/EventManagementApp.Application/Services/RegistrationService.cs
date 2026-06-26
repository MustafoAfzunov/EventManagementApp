using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Application.Mappings;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class RegistrationService : IRegistrationService
{
    private readonly IRegistrationRepository _registrationRepository;
    private readonly IEventRepository _eventRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITicketService _ticketService;
    private readonly ISeatingService _seatingService;

    public RegistrationService(
        IRegistrationRepository registrationRepository,
        IEventRepository eventRepository,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        ITicketService ticketService,
        ISeatingService seatingService)
    {
        _registrationRepository = registrationRepository;
        _eventRepository = eventRepository;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _ticketService = ticketService;
        _seatingService = seatingService;
    }

    public async Task<RegistrationResultDto> RegisterForEventAsync(
        CreateRegistrationRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();

        var eventEntity = await _eventRepository.GetByIdAsync(request.EventId, includeDetails: false, cancellationToken);
        if (eventEntity is null || eventEntity.Status != EventStatus.Published)
        {
            throw new NotFoundException("Event not found.");
        }

        ValidateEligibility(eventEntity);

        var existing = await _registrationRepository.GetActiveByUserAndEventAsync(userId, request.EventId, cancellationToken);
        if (existing is not null)
        {
            throw new ConflictException("You are already registered for this event.");
        }

        var registration = new Registration
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EventId = request.EventId,
            CreatedAt = DateTime.UtcNow
        };

        if (eventEntity.RequiresApproval)
        {
            registration.Status = RegistrationStatus.Pending;
            registration.WaitlistPosition = null;

            _registrationRepository.Add(registration);
            _notificationRepository.Add(CreateNotification(
                userId,
                "Registration pending approval",
                $"Your registration for '{eventEntity.Title}' has been received and is awaiting organizer approval.",
                NotificationType.General));

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new RegistrationResultDto(
                registration.Id,
                eventEntity.Id,
                eventEntity.Title,
                registration.Status.ToString(),
                null,
                "Your registration is pending organizer approval. You will be notified once it is reviewed.",
                false,
                null);
        }

        var confirmedCount = await _eventRepository.GetConfirmedRegistrationCountAsync(request.EventId, cancellationToken);
        var hasCapacity = confirmedCount < eventEntity.Capacity;

        if (hasCapacity)
        {
            registration.Status = RegistrationStatus.Confirmed;
            registration.WaitlistPosition = null;

            _registrationRepository.Add(registration);
            _notificationRepository.Add(CreateNotification(
                userId,
                "Registration confirmed",
                $"Your registration for '{eventEntity.Title}' has been confirmed.",
                NotificationType.RegistrationConfirmed));

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return await BuildConfirmedRegistrationResultAsync(registration, eventEntity, cancellationToken);
        }

        var waitlistCount = await _registrationRepository.GetWaitlistCountAsync(request.EventId, cancellationToken);
        registration.Status = RegistrationStatus.Waitlisted;
        registration.WaitlistPosition = waitlistCount + 1;

        _registrationRepository.Add(registration);
        _notificationRepository.Add(CreateNotification(
            userId,
            "Added to waitlist",
            $"You have been added to the waitlist for '{eventEntity.Title}' at position {registration.WaitlistPosition}.",
            NotificationType.Waitlisted));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new RegistrationResultDto(
            registration.Id,
            eventEntity.Id,
            eventEntity.Title,
            registration.Status.ToString(),
            registration.WaitlistPosition,
            $"Added to waitlist at position {registration.WaitlistPosition}.",
            false,
            null);
    }

    public async Task CancelRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var registration = await _registrationRepository.GetByIdAsync(registrationId, cancellationToken);

        if (registration is null || registration.UserId != userId)
        {
            throw new NotFoundException("Registration not found.");
        }

        if (registration.Status is RegistrationStatus.Cancelled or RegistrationStatus.Rejected)
        {
            throw new ConflictException("Registration is already cancelled.");
        }

        var wasConfirmed = registration.Status == RegistrationStatus.Confirmed;
        var eventId = registration.EventId;
        var eventTitle = registration.Event.Title;

        await _seatingService.ReleaseSeatForRegistrationAsync(registrationId, cancellationToken);
        await _ticketService.CancelTicketForRegistrationAsync(registrationId, cancellationToken);

        registration.Status = RegistrationStatus.Cancelled;
        registration.WaitlistPosition = null;
        registration.UpdatedAt = DateTime.UtcNow;
        _registrationRepository.Update(registration);

        _notificationRepository.Add(CreateNotification(
            userId,
            "Registration cancelled",
            $"Your registration for '{eventTitle}' has been cancelled.",
            NotificationType.RegistrationCancelled));

        if (wasConfirmed)
        {
            await PromoteNextWaitlistedUserAsync(eventId, eventTitle, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RegistrationDto>> GetMyRegistrationsAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var registrations = await _registrationRepository.GetByUserIdWithDetailsAsync(userId, cancellationToken);

        return registrations
            .Where(r => r.Status is not RegistrationStatus.Cancelled and not RegistrationStatus.Rejected)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => r.ToDto())
            .ToList();
    }

    private async Task PromoteNextWaitlistedUserAsync(
        Guid eventId,
        string eventTitle,
        CancellationToken cancellationToken)
    {
        var next = await _registrationRepository.GetNextWaitlistedAsync(eventId, cancellationToken);
        if (next is null)
        {
            return;
        }

        next.Status = RegistrationStatus.Confirmed;
        next.WaitlistPosition = null;
        next.UpdatedAt = DateTime.UtcNow;
        _registrationRepository.Update(next);

        _notificationRepository.Add(CreateNotification(
            next.UserId,
            "Promoted from waitlist",
            $"A seat opened up! Your registration for '{eventTitle}' is now confirmed.",
            NotificationType.WaitlistPromoted));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var eventEntity = await _eventRepository.GetByIdAsync(eventId, includeDetails: false, cancellationToken);
        if (eventEntity is not null)
        {
            await CompleteConfirmedRegistrationAsync(next, eventEntity, cancellationToken);
        }

        await ReorderWaitlistAsync(eventId, cancellationToken);
    }

    private async Task<RegistrationResultDto> BuildConfirmedRegistrationResultAsync(
        Registration registration,
        Event eventEntity,
        CancellationToken cancellationToken)
    {
        var (message, ticketId, requiresSeat) = await CompleteConfirmedRegistrationAsync(
            registration,
            eventEntity,
            cancellationToken);

        return new RegistrationResultDto(
            registration.Id,
            eventEntity.Id,
            eventEntity.Title,
            registration.Status.ToString(),
            null,
            message,
            requiresSeat,
            ticketId);
    }

    private async Task<(string Message, Guid? TicketId, bool RequiresSeatAssignment)> CompleteConfirmedRegistrationAsync(
        Registration registration,
        Event eventEntity,
        CancellationToken cancellationToken)
    {
        if (!eventEntity.RequiresSeating)
        {
            var ticket = await _ticketService.IssueTicketForRegistrationAsync(registration.Id, cancellationToken);
            return ("Registration confirmed. Your ticket has been issued.", ticket.Id, false);
        }

        if (eventEntity.SeatAssignmentMode == SeatAssignmentMode.Automatic)
        {
            var assignment = await _seatingService.AutoAssignSeatAsync(registration.Id, cancellationToken);
            return ("Registration confirmed. A seat was assigned automatically and your ticket has been issued.", assignment.TicketId, false);
        }

        return ("Registration confirmed. Please select a seat to receive your ticket.", null, true);
    }

    private async Task ReorderWaitlistAsync(Guid eventId, CancellationToken cancellationToken)
    {
        var waitlisted = await _registrationRepository.GetWaitlistedByEventAsync(eventId, cancellationToken);

        for (var i = 0; i < waitlisted.Count; i++)
        {
            var registration = waitlisted[i];
            var newPosition = i + 1;

            if (registration.WaitlistPosition != newPosition)
            {
                registration.WaitlistPosition = newPosition;
                registration.UpdatedAt = DateTime.UtcNow;
                _registrationRepository.Update(registration);
            }
        }
    }

    private static void ValidateEligibility(Event eventEntity)
    {
        var now = DateTime.UtcNow;

        if (eventEntity.StartDate <= now)
        {
            throw new AppException("Registration is closed because the event has already started.");
        }

        if (eventEntity.RegistrationOpensAt.HasValue && now < eventEntity.RegistrationOpensAt.Value)
        {
            throw new AppException("Registration has not opened yet for this event.");
        }

        if (eventEntity.RegistrationClosesAt.HasValue && now > eventEntity.RegistrationClosesAt.Value)
        {
            throw new AppException("Registration has closed for this event.");
        }
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new UnauthorizedException();
    }

    private static Notification CreateNotification(
        Guid userId,
        string title,
        string message,
        NotificationType type)
    {
        return new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
    }
}
