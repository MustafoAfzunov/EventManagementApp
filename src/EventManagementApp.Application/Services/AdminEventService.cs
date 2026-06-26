using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Application.Mappings;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class AdminEventService : IAdminEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IVenueRepository _venueRepository;
    private readonly ISpeakerRepository _speakerRepository;
    private readonly IRegistrationRepository _registrationRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public AdminEventService(
        IEventRepository eventRepository,
        IVenueRepository venueRepository,
        ISpeakerRepository speakerRepository,
        IRegistrationRepository registrationRepository,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _eventRepository = eventRepository;
        _venueRepository = venueRepository;
        _speakerRepository = speakerRepository;
        _registrationRepository = registrationRepository;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<AdminEventListItemDto>> GetEventsAsync(
        AdminEventQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var result = await _eventRepository.GetAllAsync(parameters, cancellationToken);
        var items = new List<AdminEventListItemDto>();

        foreach (var entity in result.Items)
        {
            var confirmed = await _registrationRepository.GetCountByStatusAsync(entity.Id, RegistrationStatus.Confirmed, cancellationToken);
            var pending = await _registrationRepository.GetCountByStatusAsync(entity.Id, RegistrationStatus.Pending, cancellationToken);
            var waitlisted = await _registrationRepository.GetCountByStatusAsync(entity.Id, RegistrationStatus.Waitlisted, cancellationToken);

            items.Add(new AdminEventListItemDto(
                entity.Id,
                entity.Title,
                entity.Category,
                entity.Status.ToString(),
                entity.StartDate,
                entity.EndDate,
                entity.Capacity,
                confirmed,
                pending,
                waitlisted,
                entity.IsFeatured,
                entity.RequiresApproval,
                entity.RequiresSeating,
                entity.Venue.Name,
                entity.PublishedAt,
                entity.CreatedAt));
        }

        return new PagedResult<AdminEventListItemDto>
        {
            Items = items,
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public async Task<EventDetailDto> GetEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepository.GetByIdAsync(id, includeDetails: true, cancellationToken)
            ?? throw new NotFoundException("Event not found.");
        var confirmed = await _eventRepository.GetConfirmedRegistrationCountAsync(id, cancellationToken);
        return entity.ToDetailDto(confirmed);
    }

    public async Task<EventDetailDto> CreateEventAsync(CreateEventRequest request, CancellationToken cancellationToken = default)
    {
        var venue = await _venueRepository.GetByIdAsync(request.VenueId, cancellationToken)
            ?? throw new NotFoundException("Venue not found.");

        var mode = ResolveSeatAssignmentMode(request.RequiresSeating, request.SeatAssignmentMode);

        var eventId = Guid.NewGuid();
        var eventEntity = new Event
        {
            Id = eventId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category.Trim(),
            ImageUrl = NormalizeUrl(request.ImageUrl),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Capacity = request.Capacity,
            Status = EventStatus.Draft,
            IsFeatured = request.IsFeatured,
            RegistrationOpensAt = request.RegistrationOpensAt,
            RegistrationClosesAt = request.RegistrationClosesAt,
            RequiresSeating = request.RequiresSeating,
            SeatAssignmentMode = mode,
            RequiresApproval = request.RequiresApproval,
            VenueId = venue.Id,
            CreatedByUserId = _currentUserService.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _eventRepository.Add(eventEntity);
        AddSpeakers(eventId, request.Speakers);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetEventAsync(eventId, cancellationToken);
    }

    public async Task<EventDetailDto> UpdateEventAsync(Guid id, UpdateEventRequest request, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeDetails: true, cancellationToken)
            ?? throw new NotFoundException("Event not found.");

        if (eventEntity.VenueId != request.VenueId)
        {
            _ = await _venueRepository.GetByIdAsync(request.VenueId, cancellationToken)
                ?? throw new NotFoundException("Venue not found.");
        }

        var mode = ResolveSeatAssignmentMode(request.RequiresSeating, request.SeatAssignmentMode);

        eventEntity.Title = request.Title.Trim();
        eventEntity.Description = request.Description.Trim();
        eventEntity.Category = request.Category.Trim();
        eventEntity.ImageUrl = NormalizeUrl(request.ImageUrl);
        eventEntity.StartDate = request.StartDate;
        eventEntity.EndDate = request.EndDate;
        eventEntity.Capacity = request.Capacity;
        eventEntity.IsFeatured = request.IsFeatured;
        eventEntity.RegistrationOpensAt = request.RegistrationOpensAt;
        eventEntity.RegistrationClosesAt = request.RegistrationClosesAt;
        eventEntity.RequiresSeating = request.RequiresSeating;
        eventEntity.SeatAssignmentMode = mode;
        eventEntity.RequiresApproval = request.RequiresApproval;
        eventEntity.VenueId = request.VenueId;
        eventEntity.UpdatedAt = DateTime.UtcNow;
        _eventRepository.Update(eventEntity);

        if (eventEntity.Speakers.Count > 0)
        {
            _speakerRepository.RemoveRange(eventEntity.Speakers.ToList());
        }

        AddSpeakers(eventEntity.Id, request.Speakers);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetEventAsync(eventEntity.Id, cancellationToken);
    }

    public async Task PublishEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeDetails: false, cancellationToken)
            ?? throw new NotFoundException("Event not found.");

        if (eventEntity.Status == EventStatus.Cancelled)
        {
            throw new AppException("A cancelled event cannot be published.", 400);
        }

        if (eventEntity.Status == EventStatus.Published)
        {
            return;
        }

        eventEntity.Status = EventStatus.Published;
        eventEntity.PublishedAt = DateTime.UtcNow;
        eventEntity.UpdatedAt = DateTime.UtcNow;
        _eventRepository.Update(eventEntity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UnpublishEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeDetails: false, cancellationToken)
            ?? throw new NotFoundException("Event not found.");

        if (eventEntity.Status != EventStatus.Published)
        {
            throw new AppException("Only published events can be unpublished.", 400);
        }

        eventEntity.Status = EventStatus.Draft;
        eventEntity.PublishedAt = null;
        eventEntity.UpdatedAt = DateTime.UtcNow;
        _eventRepository.Update(eventEntity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeDetails: false, cancellationToken)
            ?? throw new NotFoundException("Event not found.");

        if (eventEntity.Status == EventStatus.Cancelled)
        {
            return;
        }

        eventEntity.Status = EventStatus.Cancelled;
        eventEntity.UpdatedAt = DateTime.UtcNow;
        _eventRepository.Update(eventEntity);

        var registrations = await _registrationRepository.GetByEventIdWithDetailsAsync(id, cancellationToken);
        foreach (var registration in registrations)
        {
            if (registration.Status is RegistrationStatus.Cancelled or RegistrationStatus.Rejected)
            {
                continue;
            }

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = registration.UserId,
                Title = "Event cancelled",
                Message = $"Unfortunately, '{eventEntity.Title}' has been cancelled.",
                Type = NotificationType.EventCancelled,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id, includeDetails: true, cancellationToken)
            ?? throw new NotFoundException("Event not found.");

        var registrations = await _registrationRepository.GetByEventIdWithDetailsAsync(id, cancellationToken);
        if (registrations.Count > 0)
        {
            throw new ConflictException("This event has registrations and cannot be deleted. Cancel it instead.");
        }

        if (eventEntity.Speakers.Count > 0)
        {
            _speakerRepository.RemoveRange(eventEntity.Speakers.ToList());
        }

        _eventRepository.Remove(eventEntity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private void AddSpeakers(Guid eventId, IReadOnlyList<SpeakerInputDto>? speakers)
    {
        if (speakers is null)
        {
            return;
        }

        foreach (var speaker in speakers)
        {
            if (string.IsNullOrWhiteSpace(speaker.Name))
            {
                continue;
            }

            _speakerRepository.Add(new Speaker
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                Name = speaker.Name.Trim(),
                Bio = speaker.Bio?.Trim() ?? string.Empty,
                Title = speaker.Title?.Trim() ?? string.Empty,
                ImageUrl = NormalizeUrl(speaker.ImageUrl),
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    private static string? NormalizeUrl(string? url)
    {
        return string.IsNullOrWhiteSpace(url) ? null : url.Trim();
    }

    private static SeatAssignmentMode ResolveSeatAssignmentMode(bool requiresSeating, string seatAssignmentMode)
    {
        if (!requiresSeating)
        {
            return SeatAssignmentMode.None;
        }

        if (!Enum.TryParse<SeatAssignmentMode>(seatAssignmentMode, true, out var mode) || mode == SeatAssignmentMode.None)
        {
            throw new AppException("A valid seat assignment mode (Automatic or Manual) is required when seating is enabled.", 400);
        }

        return mode;
    }
}
