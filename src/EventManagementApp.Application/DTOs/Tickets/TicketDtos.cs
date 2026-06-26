namespace EventManagementApp.Application.DTOs.Tickets;

public record TicketDto(
    Guid Id,
    Guid RegistrationId,
    Guid EventId,
    string EventTitle,
    DateTime EventStartDate,
    string AttendeeName,
    string TicketCode,
    string QrPayload,
    string? SeatLabel,
    DateTime IssuedAt,
    string Status);

public record TicketSummaryDto(
    Guid Id,
    string TicketCode,
    DateTime IssuedAt);
