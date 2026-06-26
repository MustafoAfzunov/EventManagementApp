using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class AdminRegistrationService : IAdminRegistrationService
{
    private readonly IRegistrationRepository _registrationRepository;
    private readonly IEventRepository _eventRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITicketService _ticketService;
    private readonly ISeatingService _seatingService;
    private readonly IReportPdfGenerator _reportPdfGenerator;

    public AdminRegistrationService(
        IRegistrationRepository registrationRepository,
        IEventRepository eventRepository,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        ITicketService ticketService,
        ISeatingService seatingService,
        IReportPdfGenerator reportPdfGenerator)
    {
        _registrationRepository = registrationRepository;
        _eventRepository = eventRepository;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _ticketService = ticketService;
        _seatingService = seatingService;
        _reportPdfGenerator = reportPdfGenerator;
    }

    public async Task<EventRegistrationsDto> GetEventRegistrationsAsync(
        Guid eventId,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId, includeDetails: false, cancellationToken)
            ?? throw new NotFoundException("Event not found.");

        var registrations = await _registrationRepository.GetByEventIdWithDetailsAsync(eventId, cancellationToken);

        RegistrationStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RegistrationStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var filtered = statusFilter is null
            ? registrations
            : registrations.Where(r => r.Status == statusFilter.Value).ToList();

        var items = filtered.Select(MapRegistration).ToList();

        return new EventRegistrationsDto(
            eventEntity.Id,
            eventEntity.Title,
            eventEntity.Capacity,
            registrations.Count(r => r.Status == RegistrationStatus.Confirmed),
            registrations.Count(r => r.Status == RegistrationStatus.Pending),
            registrations.Count(r => r.Status == RegistrationStatus.Waitlisted),
            items);
    }

    public async Task<RegistrationResultDto> ApproveAsync(Guid registrationId, CancellationToken cancellationToken = default)
    {
        var approverId = _currentUserService.UserId ?? throw new UnauthorizedException();
        var registration = await _registrationRepository.GetByIdWithDetailsAsync(registrationId, cancellationToken)
            ?? throw new NotFoundException("Registration not found.");

        if (registration.Status != RegistrationStatus.Pending)
        {
            throw new AppException("Only pending registrations can be approved.", 400);
        }

        var eventEntity = registration.Event;
        var confirmedCount = await _eventRepository.GetConfirmedRegistrationCountAsync(eventEntity.Id, cancellationToken);

        registration.ApprovedByUserId = approverId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.RejectionReason = null;
        registration.UpdatedAt = DateTime.UtcNow;

        if (confirmedCount >= eventEntity.Capacity)
        {
            var waitlistCount = await _registrationRepository.GetWaitlistCountAsync(eventEntity.Id, cancellationToken);
            registration.Status = RegistrationStatus.Waitlisted;
            registration.WaitlistPosition = waitlistCount + 1;
            _registrationRepository.Update(registration);

            _notificationRepository.Add(CreateNotification(
                registration.UserId,
                "Added to waitlist",
                $"Your registration for '{eventEntity.Title}' was approved but the event is full. You are on the waitlist at position {registration.WaitlistPosition}.",
                NotificationType.Waitlisted));

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new RegistrationResultDto(
                registration.Id,
                eventEntity.Id,
                eventEntity.Title,
                registration.Status.ToString(),
                registration.WaitlistPosition,
                $"Approved and waitlisted at position {registration.WaitlistPosition}.",
                false,
                null);
        }

        registration.Status = RegistrationStatus.Confirmed;
        registration.WaitlistPosition = null;
        _registrationRepository.Update(registration);

        _notificationRepository.Add(CreateNotification(
            registration.UserId,
            "Registration approved",
            $"Your registration for '{eventEntity.Title}' has been approved and confirmed.",
            NotificationType.RegistrationApproved));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var (message, ticketId, requiresSeat) = await CompleteConfirmedRegistrationAsync(registration, eventEntity, cancellationToken);

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

    public async Task RejectAsync(Guid registrationId, RejectRegistrationRequest request, CancellationToken cancellationToken = default)
    {
        var approverId = _currentUserService.UserId ?? throw new UnauthorizedException();
        var registration = await _registrationRepository.GetByIdWithDetailsAsync(registrationId, cancellationToken)
            ?? throw new NotFoundException("Registration not found.");

        if (registration.Status is RegistrationStatus.Cancelled or RegistrationStatus.Rejected)
        {
            throw new ConflictException("This registration is already closed.");
        }

        var wasConfirmed = registration.Status == RegistrationStatus.Confirmed;
        var eventEntity = registration.Event;

        await _seatingService.ReleaseSeatForRegistrationAsync(registrationId, cancellationToken);
        await _ticketService.CancelTicketForRegistrationAsync(registrationId, cancellationToken);

        registration.Status = RegistrationStatus.Rejected;
        registration.WaitlistPosition = null;
        registration.RejectionReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        registration.ApprovedByUserId = approverId;
        registration.UpdatedAt = DateTime.UtcNow;
        _registrationRepository.Update(registration);

        var reasonSuffix = registration.RejectionReason is null ? string.Empty : $" Reason: {registration.RejectionReason}";
        _notificationRepository.Add(CreateNotification(
            registration.UserId,
            "Registration rejected",
            $"Your registration for '{eventEntity.Title}' was not approved.{reasonSuffix}",
            NotificationType.RegistrationRejected));

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (wasConfirmed)
        {
            await PromoteNextWaitlistedUserAsync(eventEntity.Id, eventEntity.Title, cancellationToken);
        }
    }

    public async Task<byte[]> ExportAttendeesCsvAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var (_, registrations) = await GetEventWithRegistrationsAsync(eventId, cancellationToken);

        var headers = new[] { "Name", "Email", "Status", "Seat", "CheckedIn", "CheckedInAt", "RegisteredAt" };
        var rows = registrations.Select(r =>
        {
            var item = MapRegistration(r);
            return (IReadOnlyList<object?>)new object?[]
            {
                item.AttendeeName,
                item.AttendeeEmail,
                item.Status,
                item.SeatLabel ?? string.Empty,
                item.IsCheckedIn ? "Yes" : "No",
                item.CheckedInAt?.ToString("u") ?? string.Empty,
                item.CreatedAt.ToString("u")
            };
        });

        return CsvWriter.Build(headers, rows);
    }

    public async Task<byte[]> ExportAttendeesPdfAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var (eventEntity, registrations) = await GetEventWithRegistrationsAsync(eventId, cancellationToken);

        var rows = registrations
            .Select(MapRegistration)
            .Select(item => new AttendeeListPdfRow(
                item.AttendeeName,
                item.AttendeeEmail,
                item.Status,
                item.SeatLabel,
                item.IsCheckedIn))
            .ToList();

        var model = new AttendeeListPdfModel(
            eventEntity.Title,
            eventEntity.StartDate,
            eventEntity.Venue?.Name ?? string.Empty,
            DateTime.UtcNow,
            rows);

        return _reportPdfGenerator.GenerateAttendeeList(model);
    }

    private async Task<(Event Event, IReadOnlyList<Registration> Registrations)> GetEventWithRegistrationsAsync(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId, includeDetails: true, cancellationToken)
            ?? throw new NotFoundException("Event not found.");
        var registrations = await _registrationRepository.GetByEventIdWithDetailsAsync(eventId, cancellationToken);
        return (eventEntity, registrations);
    }

    private async Task<(string Message, Guid? TicketId, bool RequiresSeatAssignment)> CompleteConfirmedRegistrationAsync(
        Registration registration,
        Event eventEntity,
        CancellationToken cancellationToken)
    {
        if (!eventEntity.RequiresSeating)
        {
            var ticket = await _ticketService.IssueTicketForRegistrationAsync(registration.Id, cancellationToken);
            return ("Registration approved and ticket issued.", ticket.Id, false);
        }

        if (eventEntity.SeatAssignmentMode == SeatAssignmentMode.Automatic)
        {
            var assignment = await _seatingService.AutoAssignSeatAsync(registration.Id, cancellationToken);
            return ("Registration approved, a seat was assigned automatically and the ticket has been issued.", assignment.TicketId, false);
        }

        return ("Registration approved. The attendee must select a seat to receive their ticket.", null, true);
    }

    private async Task PromoteNextWaitlistedUserAsync(Guid eventId, string eventTitle, CancellationToken cancellationToken)
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
        await _unitOfWork.SaveChangesAsync(cancellationToken);
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

    private static AdminRegistrationItemDto MapRegistration(Registration registration)
    {
        string? seatLabel = null;
        if (registration.SeatAssignment?.Seat is not null)
        {
            var seat = registration.SeatAssignment.Seat;
            seatLabel = $"{seat.Section}-{seat.Row}-{seat.Number}";
        }

        var hasActiveTicket = registration.Ticket is { Status: TicketStatus.Active };
        var attendance = registration.Ticket?.Attendance;

        return new AdminRegistrationItemDto(
            registration.Id,
            registration.UserId,
            $"{registration.User.FirstName} {registration.User.LastName}",
            registration.User.Email,
            registration.Status.ToString(),
            registration.WaitlistPosition,
            hasActiveTicket,
            seatLabel,
            attendance is not null,
            attendance?.CheckedInAt,
            registration.RejectionReason,
            registration.CreatedAt);
    }

    private static Notification CreateNotification(Guid userId, string title, string message, NotificationType type)
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
