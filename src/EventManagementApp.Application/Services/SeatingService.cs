using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Seating;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.Extensions.Options;

namespace EventManagementApp.Application.Services;

public class SeatingService : ISeatingService
{
    private readonly IEventRepository _eventRepository;
    private readonly IRegistrationRepository _registrationRepository;
    private readonly ISeatRepository _seatRepository;
    private readonly IVenueRepository _venueRepository;
    private readonly ITicketService _ticketService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly SeatingSettings _settings;

    public SeatingService(
        IEventRepository eventRepository,
        IRegistrationRepository registrationRepository,
        ISeatRepository seatRepository,
        IVenueRepository venueRepository,
        ITicketService ticketService,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IOptions<SeatingSettings> settings)
    {
        _eventRepository = eventRepository;
        _registrationRepository = registrationRepository;
        _seatRepository = seatRepository;
        _venueRepository = venueRepository;
        _ticketService = ticketService;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _settings = settings.Value;
    }

    public async Task<EventSeatMapDto> GetEventSeatMapAsync(
        Guid eventId,
        Guid? registrationId,
        CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId, includeDetails: true, cancellationToken);
        if (eventEntity is null || eventEntity.Status != EventStatus.Published)
        {
            throw new NotFoundException("Event not found.");
        }

        if (!eventEntity.RequiresSeating)
        {
            throw new AppException("This event does not use assigned seating.", 400);
        }

        await _seatRepository.ReleaseExpiredHoldsAsync(cancellationToken);

        var seats = await _seatRepository.GetByVenueIdAsync(eventEntity.VenueId, cancellationToken);
        var sections = seats
            .GroupBy(s => s.Section)
            .OrderBy(g => g.Key)
            .Select(section => new SeatMapSectionDto(
                section.Key,
                section.GroupBy(s => s.Row)
                    .OrderBy(g => g.Key)
                    .Select(row => new SeatMapRowDto(
                        row.Key,
                        row.OrderBy(s => s.Number)
                            .Select(s => MapSeat(s, registrationId))
                            .ToList()))
                    .ToList()))
            .ToList();

        return new EventSeatMapDto(
            eventEntity.Id,
            eventEntity.VenueId,
            eventEntity.RequiresSeating,
            eventEntity.SeatAssignmentMode.ToString(),
            sections);
    }

    public async Task<SeatAssignmentResultDto> AutoAssignSeatAsync(
        Guid registrationId,
        CancellationToken cancellationToken = default)
    {
        var registration = await GetOwnedConfirmedRegistrationAsync(registrationId, cancellationToken);
        var eventEntity = registration.Event;

        if (!eventEntity.RequiresSeating)
        {
            throw new AppException("This event does not require seat assignment.", 400);
        }

        var existing = await _seatRepository.GetAssignmentByRegistrationIdAsync(registrationId, cancellationToken);
        if (existing is not null)
        {
            throw new ConflictException("A seat has already been assigned for this registration.");
        }

        await _seatRepository.ReleaseExpiredHoldsAsync(cancellationToken);

        var seat = await _seatRepository.GetAvailableSeatForVenueAsync(eventEntity.VenueId, cancellationToken);
        if (seat is null)
        {
            throw new AppException("No seats are currently available for this event.", 409);
        }

        return await AssignSeatAndIssueTicketAsync(
            registration,
            seat,
            SeatAssignmentMode.Automatic,
            cancellationToken);
    }

    public async Task<SeatAssignmentResultDto> SelectSeatAsync(
        Guid registrationId,
        Guid seatId,
        CancellationToken cancellationToken = default)
    {
        var registration = await GetOwnedConfirmedRegistrationAsync(registrationId, cancellationToken);
        var eventEntity = registration.Event;

        if (!eventEntity.RequiresSeating)
        {
            throw new AppException("This event does not require seat assignment.", 400);
        }

        if (eventEntity.SeatAssignmentMode != SeatAssignmentMode.Manual)
        {
            throw new AppException("Manual seat selection is not enabled for this event.", 400);
        }

        var existing = await _seatRepository.GetAssignmentByRegistrationIdAsync(registrationId, cancellationToken);
        if (existing is not null)
        {
            throw new ConflictException("A seat has already been assigned for this registration.");
        }

        await _seatRepository.ReleaseExpiredHoldsAsync(cancellationToken);

        var seat = await _seatRepository.GetByIdAsync(seatId, cancellationToken);
        if (seat is null || seat.VenueId != eventEntity.VenueId)
        {
            throw new NotFoundException("Seat not found.");
        }

        if (!IsSeatSelectable(seat, registrationId))
        {
            throw new ConflictException("The selected seat is not available.");
        }

        return await AssignSeatAndIssueTicketAsync(
            registration,
            seat,
            SeatAssignmentMode.Manual,
            cancellationToken);
    }

    public async Task<IReadOnlyList<VenueSeatDto>> BulkCreateSeatsAsync(
        Guid venueId,
        BulkCreateSeatsRequest request,
        CancellationToken cancellationToken = default)
    {
        var venue = await _venueRepository.GetByIdAsync(venueId, cancellationToken);
        if (venue is null)
        {
            throw new NotFoundException("Venue not found.");
        }

        var seats = new List<Seat>();
        for (var i = 1; i <= request.SeatCount; i++)
        {
            seats.Add(new Seat
            {
                Id = Guid.NewGuid(),
                VenueId = venueId,
                Section = request.Section.Trim(),
                Row = request.Row.Trim(),
                Number = $"{request.SeatNumberPrefix}{i}",
                Status = SeatStatus.Available,
                CreatedAt = DateTime.UtcNow
            });
        }

        _seatRepository.AddRange(seats);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return seats
            .Select(s => new VenueSeatDto(s.Id, s.Section, s.Row, s.Number, s.Status.ToString()))
            .ToList();
    }

    public async Task ConfigureEventSeatingAsync(
        Guid eventId,
        ConfigureEventSeatingRequest request,
        CancellationToken cancellationToken = default)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId, includeDetails: false, cancellationToken);
        if (eventEntity is null)
        {
            throw new NotFoundException("Event not found.");
        }

        if (!Enum.TryParse<SeatAssignmentMode>(request.SeatAssignmentMode, true, out var mode))
        {
            throw new AppException("Invalid seat assignment mode.", 400);
        }

        if (!request.RequiresSeating)
        {
            mode = SeatAssignmentMode.None;
        }
        else if (mode == SeatAssignmentMode.None)
        {
            throw new AppException("Seat assignment mode is required when seating is enabled.", 400);
        }

        eventEntity.RequiresSeating = request.RequiresSeating;
        eventEntity.SeatAssignmentMode = mode;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        _eventRepository.Update(eventEntity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task ReleaseSeatForRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default)
    {
        var assignment = await _seatRepository.GetAssignmentByRegistrationIdAsync(registrationId, cancellationToken);
        if (assignment is null)
        {
            return;
        }

        var seat = assignment.Seat;
        seat.Status = SeatStatus.Available;
        seat.HeldUntil = null;
        seat.HeldByRegistrationId = null;
        seat.UpdatedAt = DateTime.UtcNow;
        _seatRepository.Update(seat);
        _seatRepository.RemoveAssignment(assignment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<SeatAssignmentResultDto> AssignSeatAndIssueTicketAsync(
        Registration registration,
        Seat seat,
        SeatAssignmentMode mode,
        CancellationToken cancellationToken)
    {
        seat.Status = SeatStatus.Assigned;
        seat.HeldUntil = null;
        seat.HeldByRegistrationId = null;
        seat.UpdatedAt = DateTime.UtcNow;
        _seatRepository.Update(seat);

        var assignment = new SeatAssignment
        {
            Id = Guid.NewGuid(),
            RegistrationId = registration.Id,
            SeatId = seat.Id,
            Mode = mode,
            AssignedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _seatRepository.AddAssignment(assignment);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var ticket = await _ticketService.IssueTicketForRegistrationAsync(registration.Id, cancellationToken);

        return new SeatAssignmentResultDto(
            registration.Id,
            seat.Id,
            seat.Section,
            seat.Row,
            seat.Number,
            mode.ToString(),
            "Seat assigned and ticket issued.",
            ticket.Id);
    }

    private async Task<Registration> GetOwnedConfirmedRegistrationAsync(
        Guid registrationId,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException();
        var registration = await _registrationRepository.GetByIdAsync(registrationId, cancellationToken);

        if (registration is null || registration.UserId != userId)
        {
            throw new NotFoundException("Registration not found.");
        }

        if (registration.Status != RegistrationStatus.Confirmed)
        {
            throw new AppException("Seat assignment is only available for confirmed registrations.", 400);
        }

        return registration;
    }

    private static SeatMapSeatDto MapSeat(Seat seat, Guid? registrationId)
    {
        var status = seat.Status;
        if (status == SeatStatus.Held && seat.HeldUntil.HasValue && seat.HeldUntil.Value < DateTime.UtcNow)
        {
            status = SeatStatus.Available;
        }

        var isHeldByCurrentUser = registrationId.HasValue &&
                                  seat.HeldByRegistrationId == registrationId.Value &&
                                  status == SeatStatus.Held;

        return new SeatMapSeatDto(
            seat.Id,
            seat.Section,
            seat.Row,
            seat.Number,
            status.ToString(),
            seat.HeldUntil,
            isHeldByCurrentUser);
    }

    private static bool IsSeatSelectable(Seat seat, Guid registrationId)
    {
        if (seat.Status == SeatStatus.Blocked || seat.Status == SeatStatus.Assigned)
        {
            return false;
        }

        if (seat.Status == SeatStatus.Held)
        {
            if (seat.HeldUntil.HasValue && seat.HeldUntil.Value < DateTime.UtcNow)
            {
                return true;
            }

            return seat.HeldByRegistrationId == registrationId;
        }

        return seat.Status == SeatStatus.Available;
    }
}
