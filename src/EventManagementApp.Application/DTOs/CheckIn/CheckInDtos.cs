namespace EventManagementApp.Application.DTOs.CheckIn;

public record ScanTicketRequest(string Code, Guid? EventId = null);

public record CheckInResultDto(
    bool Success,
    string Status,
    string Message,
    Guid? TicketId,
    string? TicketCode,
    string? AttendeeName,
    Guid? EventId,
    string? EventTitle,
    string? SeatLabel,
    DateTime? CheckedInAt);

public record AttendanceItemDto(
    Guid AttendanceId,
    Guid TicketId,
    string TicketCode,
    Guid RegistrationId,
    Guid UserId,
    string AttendeeName,
    string AttendeeEmail,
    string? SeatLabel,
    DateTime CheckedInAt);

public record CheckInStatsDto(
    Guid EventId,
    string EventTitle,
    int ConfirmedRegistrations,
    int TicketsIssued,
    int CheckedIn,
    int NotCheckedIn,
    double CheckInRate);
