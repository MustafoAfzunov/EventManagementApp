namespace EventManagementApp.Application.DTOs.Registrations;

public record CreateRegistrationRequest(Guid EventId);

public record RegistrationDto(
    Guid Id,
    Guid EventId,
    string EventTitle,
    DateTime EventStartDate,
    string Status,
    int? WaitlistPosition,
    DateTime CreatedAt,
    bool RequiresSeating,
    bool HasSeatAssignment,
    string? SeatLabel,
    Guid? TicketId,
    DateTime EventEndDate = default,
    string EventCategory = "",
    string SeatAssignmentMode = "None",
    string VenueName = "",
    string? EventImageUrl = null);

public record RegistrationResultDto(
    Guid Id,
    Guid EventId,
    string EventTitle,
    string Status,
    int? WaitlistPosition,
    string Message,
    bool RequiresSeatAssignment,
    Guid? TicketId);
