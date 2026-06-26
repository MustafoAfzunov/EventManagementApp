namespace EventManagementApp.Application.DTOs.Admin;

public record AdminRegistrationItemDto(
    Guid Id,
    Guid UserId,
    string AttendeeName,
    string AttendeeEmail,
    string Status,
    int? WaitlistPosition,
    bool HasTicket,
    string? SeatLabel,
    bool IsCheckedIn,
    DateTime? CheckedInAt,
    string? RejectionReason,
    DateTime CreatedAt);

public record EventRegistrationsDto(
    Guid EventId,
    string EventTitle,
    int Capacity,
    int ConfirmedRegistrations,
    int PendingRegistrations,
    int WaitlistedRegistrations,
    IReadOnlyList<AdminRegistrationItemDto> Registrations);

public record RejectRegistrationRequest(string? Reason);
