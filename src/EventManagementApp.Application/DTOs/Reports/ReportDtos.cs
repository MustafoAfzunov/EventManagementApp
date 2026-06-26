namespace EventManagementApp.Application.DTOs.Reports;

public record RegistrationReportRowDto(
    Guid EventId,
    string EventTitle,
    DateTime StartDate,
    string Status,
    int Capacity,
    int Confirmed,
    int Pending,
    int Waitlisted,
    int Cancelled,
    int Rejected,
    int Total);

public record RegistrationReportDto(
    DateTime GeneratedAt,
    int EventCount,
    int TotalRegistrations,
    IReadOnlyList<RegistrationReportRowDto> Rows);

public record AttendanceReportRowDto(
    Guid EventId,
    string EventTitle,
    DateTime StartDate,
    int Confirmed,
    int TicketsIssued,
    int CheckedIn,
    int NoShows,
    double AttendanceRate);

public record AttendanceReportDto(
    DateTime GeneratedAt,
    int EventCount,
    IReadOnlyList<AttendanceReportRowDto> Rows);

public record SeatOccupancyReportRowDto(
    Guid EventId,
    string EventTitle,
    Guid VenueId,
    string VenueName,
    int TotalSeats,
    int AssignedSeats,
    int AvailableSeats,
    double OccupancyRate);

public record SeatOccupancyReportDto(
    DateTime GeneratedAt,
    int EventCount,
    IReadOnlyList<SeatOccupancyReportRowDto> Rows);

public record EventAnalyticsDto(
    DateTime GeneratedAt,
    int TotalEvents,
    int PublishedEvents,
    int DraftEvents,
    int CancelledEvents,
    int CompletedEvents,
    int TotalRegistrations,
    int TotalConfirmed,
    int TotalWaitlisted,
    int TotalCheckedIn,
    double AverageCapacityUtilization,
    double OverallNoShowRate,
    IReadOnlyList<EventAnalyticsRowDto> Events);

public record EventAnalyticsRowDto(
    Guid EventId,
    string EventTitle,
    DateTime StartDate,
    string Status,
    int Capacity,
    int Confirmed,
    int CheckedIn,
    double CapacityUtilization,
    double NoShowRate);
