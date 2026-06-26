namespace EventManagementApp.Application.DTOs.Events;

public record EventQueryParameters(
    string? Search = null,
    string? Category = null,
    Guid? VenueId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 10);

public record EventListItemDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    DateTime StartDate,
    DateTime EndDate,
    int Capacity,
    int ConfirmedRegistrations,
    int AvailableSeats,
    bool IsFeatured,
    string VenueName,
    string VenueCity,
    string? ImageUrl = null);

public record SpeakerDto(Guid Id, string Name, string Bio, string Title, string? ImageUrl = null);

public record VenueDto(Guid Id, string Name, string Address, string City, string Country);

public record EventDetailDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    string Status,
    DateTime StartDate,
    DateTime EndDate,
    int Capacity,
    int ConfirmedRegistrations,
    int AvailableSeats,
    bool IsFeatured,
    DateTime? RegistrationOpensAt,
    DateTime? RegistrationClosesAt,
    bool RequiresSeating,
    string SeatAssignmentMode,
    bool RequiresApproval,
    DateTime? PublishedAt,
    VenueDto Venue,
    IReadOnlyList<SpeakerDto> Speakers,
    string? ImageUrl = null);
