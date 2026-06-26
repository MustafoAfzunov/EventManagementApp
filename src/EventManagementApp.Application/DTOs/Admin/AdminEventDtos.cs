namespace EventManagementApp.Application.DTOs.Admin;

public record SpeakerInputDto(
    string Name,
    string Bio,
    string Title,
    string? ImageUrl = null);

public record CreateEventRequest(
    string Title,
    string Description,
    string Category,
    DateTime StartDate,
    DateTime EndDate,
    int Capacity,
    Guid VenueId,
    bool IsFeatured,
    DateTime? RegistrationOpensAt,
    DateTime? RegistrationClosesAt,
    bool RequiresSeating,
    string SeatAssignmentMode,
    bool RequiresApproval,
    IReadOnlyList<SpeakerInputDto>? Speakers,
    string? ImageUrl = null);

public record UpdateEventRequest(
    string Title,
    string Description,
    string Category,
    DateTime StartDate,
    DateTime EndDate,
    int Capacity,
    Guid VenueId,
    bool IsFeatured,
    DateTime? RegistrationOpensAt,
    DateTime? RegistrationClosesAt,
    bool RequiresSeating,
    string SeatAssignmentMode,
    bool RequiresApproval,
    IReadOnlyList<SpeakerInputDto>? Speakers,
    string? ImageUrl = null);

public record AdminEventListItemDto(
    Guid Id,
    string Title,
    string Category,
    string Status,
    DateTime StartDate,
    DateTime EndDate,
    int Capacity,
    int ConfirmedRegistrations,
    int PendingRegistrations,
    int WaitlistedRegistrations,
    bool IsFeatured,
    bool RequiresApproval,
    bool RequiresSeating,
    string VenueName,
    DateTime? PublishedAt,
    DateTime CreatedAt);

public record AdminEventQueryParameters(
    string? Search = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 10);

public record CreateVenueRequest(
    string Name,
    string Address,
    string City,
    string Country);

public record UpdateVenueRequest(
    string Name,
    string Address,
    string City,
    string Country);

public record VenueListItemDto(
    Guid Id,
    string Name,
    string Address,
    string City,
    string Country,
    int SeatCount,
    int EventCount);
