using System.Text.Json;
using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.CheckIn;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class CheckInService : ICheckInService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IAttendanceRepository _attendanceRepository;
    private readonly IEventRepository _eventRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CheckInService(
        ITicketRepository ticketRepository,
        IAttendanceRepository attendanceRepository,
        IEventRepository eventRepository,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _ticketRepository = ticketRepository;
        _attendanceRepository = attendanceRepository;
        _eventRepository = eventRepository;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<CheckInResultDto> ScanAsync(ScanTicketRequest request, CancellationToken cancellationToken = default)
    {
        var staffuserId = _currentUserService.UserId ?? throw new UnauthorizedException();

        var ticketCode = ExtractTicketCode(request.Code);
        if (string.IsNullOrWhiteSpace(ticketCode))
        {
            return Denied("InvalidCode", "The scanned code is not a valid ticket.");
        }

        var ticket = await _ticketRepository.GetByTicketCodeWithDetailsAsync(ticketCode, cancellationToken);
        if (ticket is null)
        {
            return Denied("NotFound", "Ticket not found.");
        }

        var registration = ticket.Registration;

        if (request.EventId.HasValue && registration.EventId != request.EventId.Value)
        {
            return Denied("WrongEvent", "This ticket is for a different event.", ticket);
        }

        if (ticket.Status != TicketStatus.Active)
        {
            return Denied("Cancelled", "This ticket has been cancelled.", ticket);
        }

        if (registration.Status != RegistrationStatus.Confirmed)
        {
            return Denied("InvalidRegistration", "The registration for this ticket is not active.", ticket);
        }

        if (ticket.Attendance is not null)
        {
            return new CheckInResultDto(
                false,
                "AlreadyCheckedIn",
                $"Already checked in at {ticket.Attendance.CheckedInAt:HH:mm} UTC.",
                ticket.Id,
                ticket.TicketCode,
                AttendeeName(registration),
                registration.EventId,
                registration.Event.Title,
                SeatLabel(registration),
                ticket.Attendance.CheckedInAt);
        }

        var checkedInAt = DateTime.UtcNow;
        _attendanceRepository.Add(new Attendance
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            EventId = registration.EventId,
            CheckedInAt = checkedInAt,
            CheckedInByUserId = staffuserId,
            CreatedAt = checkedInAt
        });

        _notificationRepository.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = registration.UserId,
            Title = "Checked in",
            Message = $"You have been checked in to '{registration.Event.Title}'. Enjoy the event!",
            Type = NotificationType.CheckedIn,
            IsRead = false,
            CreatedAt = checkedInAt
        });

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CheckInResultDto(
            true,
            "CheckedIn",
            "Check-in successful.",
            ticket.Id,
            ticket.TicketCode,
            AttendeeName(registration),
            registration.EventId,
            registration.Event.Title,
            SeatLabel(registration),
            checkedInAt);
    }

    public async Task<IReadOnlyList<AttendanceItemDto>> GetEventAttendanceAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        await EnsureEventExistsAsync(eventId, cancellationToken);

        var attendances = await _attendanceRepository.GetByEventIdWithDetailsAsync(eventId, cancellationToken);

        return attendances.Select(a =>
        {
            var registration = a.Ticket.Registration;
            return new AttendanceItemDto(
                a.Id,
                a.TicketId,
                a.Ticket.TicketCode,
                registration.Id,
                registration.UserId,
                AttendeeName(registration),
                registration.User.Email,
                SeatLabel(registration),
                a.CheckedInAt);
        }).ToList();
    }

    public async Task<CheckInStatsDto> GetEventStatsAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var eventEntity = await EnsureEventExistsAsync(eventId, cancellationToken);

        var confirmed = await _eventRepository.GetConfirmedRegistrationCountAsync(eventId, cancellationToken);
        var issued = await _ticketRepository.GetIssuedCountByEventAsync(eventId, cancellationToken);
        var checkedIn = await _attendanceRepository.GetCountByEventAsync(eventId, cancellationToken);
        var notCheckedIn = Math.Max(0, issued - checkedIn);
        var rate = issued == 0 ? 0 : Math.Round((double)checkedIn / issued * 100, 1);

        return new CheckInStatsDto(
            eventEntity.Id,
            eventEntity.Title,
            confirmed,
            issued,
            checkedIn,
            notCheckedIn,
            rate);
    }

    private async Task<Event> EnsureEventExistsAsync(Guid eventId, CancellationToken cancellationToken)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(eventId, includeDetails: false, cancellationToken);
        return eventEntity ?? throw new NotFoundException("Event not found.");
    }

    private static CheckInResultDto Denied(string status, string message, Ticket? ticket = null)
    {
        var registration = ticket?.Registration;
        return new CheckInResultDto(
            false,
            status,
            message,
            ticket?.Id,
            ticket?.TicketCode,
            registration is null ? null : AttendeeName(registration),
            registration?.EventId,
            registration?.Event.Title,
            registration is null ? null : SeatLabel(registration),
            null);
    }

    private static string ExtractTicketCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return string.Empty;
        }

        var trimmed = code.Trim();
        if (trimmed.StartsWith('{'))
        {
            try
            {
                using var document = JsonDocument.Parse(trimmed);
                if (document.RootElement.TryGetProperty("ticketCode", out var element))
                {
                    return element.GetString()?.Trim() ?? string.Empty;
                }
            }
            catch (JsonException)
            {
                return trimmed;
            }
        }

        return trimmed;
    }

    private static string AttendeeName(Registration registration)
        => $"{registration.User.FirstName} {registration.User.LastName}";

    private static string? SeatLabel(Registration registration)
    {
        if (registration.SeatAssignment?.Seat is null)
        {
            return null;
        }

        var seat = registration.SeatAssignment.Seat;
        return $"{seat.Section}-{seat.Row}-{seat.Number}";
    }
}
