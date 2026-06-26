namespace EventManagementApp.Application.DTOs.Seating;

public record SeatMapSeatDto(
    Guid Id,
    string Section,
    string Row,
    string Number,
    string Status,
    DateTime? HeldUntil,
    bool IsHeldByCurrentUser);

public record SeatMapSectionDto(
    string Name,
    IReadOnlyList<SeatMapRowDto> Rows);

public record SeatMapRowDto(
    string Name,
    IReadOnlyList<SeatMapSeatDto> Seats);

public record EventSeatMapDto(
    Guid EventId,
    Guid VenueId,
    bool RequiresSeating,
    string SeatAssignmentMode,
    IReadOnlyList<SeatMapSectionDto> Sections);

public record SelectSeatRequest(Guid SeatId);

public record SeatAssignmentResultDto(
    Guid RegistrationId,
    Guid SeatId,
    string Section,
    string Row,
    string Number,
    string Mode,
    string Message,
    Guid? TicketId);

public record BulkCreateSeatsRequest(
    string Section,
    string Row,
    int SeatCount,
    string? SeatNumberPrefix);

public record ConfigureEventSeatingRequest(
    bool RequiresSeating,
    string SeatAssignmentMode);

public record VenueSeatDto(
    Guid Id,
    string Section,
    string Row,
    string Number,
    string Status);
