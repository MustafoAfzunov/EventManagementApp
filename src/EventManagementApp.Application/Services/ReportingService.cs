using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Reports;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class ReportingService : IReportingService
{
    private readonly IEventRepository _eventRepository;
    private readonly IRegistrationRepository _registrationRepository;
    private readonly ITicketRepository _ticketRepository;
    private readonly IAttendanceRepository _attendanceRepository;
    private readonly ISeatRepository _seatRepository;

    public ReportingService(
        IEventRepository eventRepository,
        IRegistrationRepository registrationRepository,
        ITicketRepository ticketRepository,
        IAttendanceRepository attendanceRepository,
        ISeatRepository seatRepository)
    {
        _eventRepository = eventRepository;
        _registrationRepository = registrationRepository;
        _ticketRepository = ticketRepository;
        _attendanceRepository = attendanceRepository;
        _seatRepository = seatRepository;
    }

    public async Task<RegistrationReportDto> GetRegistrationReportAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var events = await GetEventsAsync(fromDate, toDate, cancellationToken);
        var rows = new List<RegistrationReportRowDto>();

        foreach (var entity in events)
        {
            var counts = await GetStatusCountsAsync(entity.Id, cancellationToken);
            var total = counts.Values.Sum();
            rows.Add(new RegistrationReportRowDto(
                entity.Id,
                entity.Title,
                entity.StartDate,
                entity.Status.ToString(),
                entity.Capacity,
                counts[RegistrationStatus.Confirmed],
                counts[RegistrationStatus.Pending],
                counts[RegistrationStatus.Waitlisted],
                counts[RegistrationStatus.Cancelled],
                counts[RegistrationStatus.Rejected],
                total));
        }

        return new RegistrationReportDto(
            DateTime.UtcNow,
            rows.Count,
            rows.Sum(r => r.Total),
            rows);
    }

    public async Task<AttendanceReportDto> GetAttendanceReportAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var events = await GetEventsAsync(fromDate, toDate, cancellationToken);
        var rows = new List<AttendanceReportRowDto>();

        foreach (var entity in events)
        {
            var confirmed = await _registrationRepository.GetCountByStatusAsync(entity.Id, RegistrationStatus.Confirmed, cancellationToken);
            var issued = await _ticketRepository.GetIssuedCountByEventAsync(entity.Id, cancellationToken);
            var checkedIn = await _attendanceRepository.GetCountByEventAsync(entity.Id, cancellationToken);
            var noShows = Math.Max(0, issued - checkedIn);
            var rate = issued == 0 ? 0 : Math.Round((double)checkedIn / issued * 100, 1);

            rows.Add(new AttendanceReportRowDto(
                entity.Id,
                entity.Title,
                entity.StartDate,
                confirmed,
                issued,
                checkedIn,
                noShows,
                rate));
        }

        return new AttendanceReportDto(DateTime.UtcNow, rows.Count, rows);
    }

    public async Task<SeatOccupancyReportDto> GetSeatOccupancyReportAsync(CancellationToken cancellationToken = default)
    {
        var events = await _eventRepository.GetAllWithVenueAsync(cancellationToken);
        var rows = new List<SeatOccupancyReportRowDto>();

        foreach (var entity in events.Where(e => e.RequiresSeating))
        {
            var totalSeats = await _seatRepository.GetSeatCountByVenueAsync(entity.VenueId, cancellationToken);
            var assigned = await _seatRepository.GetAssignedSeatCountByEventAsync(entity.Id, cancellationToken);
            var available = Math.Max(0, totalSeats - assigned);
            var rate = totalSeats == 0 ? 0 : Math.Round((double)assigned / totalSeats * 100, 1);

            rows.Add(new SeatOccupancyReportRowDto(
                entity.Id,
                entity.Title,
                entity.VenueId,
                entity.Venue.Name,
                totalSeats,
                assigned,
                available,
                rate));
        }

        return new SeatOccupancyReportDto(DateTime.UtcNow, rows.Count, rows);
    }

    public async Task<EventAnalyticsDto> GetEventAnalyticsAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var events = await GetEventsAsync(fromDate, toDate, cancellationToken);
        var rows = new List<EventAnalyticsRowDto>();

        var totalConfirmed = 0;
        var totalWaitlisted = 0;
        var totalCheckedIn = 0;
        var totalRegistrations = 0;
        var utilizationSum = 0d;

        foreach (var entity in events)
        {
            var counts = await GetStatusCountsAsync(entity.Id, cancellationToken);
            var confirmed = counts[RegistrationStatus.Confirmed];
            var waitlisted = counts[RegistrationStatus.Waitlisted];
            var checkedIn = await _attendanceRepository.GetCountByEventAsync(entity.Id, cancellationToken);
            var issued = await _ticketRepository.GetIssuedCountByEventAsync(entity.Id, cancellationToken);

            var utilization = entity.Capacity == 0 ? 0 : Math.Round((double)confirmed / entity.Capacity * 100, 1);
            var noShowRate = issued == 0 ? 0 : Math.Round((double)(issued - checkedIn) / issued * 100, 1);

            totalConfirmed += confirmed;
            totalWaitlisted += waitlisted;
            totalCheckedIn += checkedIn;
            totalRegistrations += counts.Values.Sum();
            utilizationSum += utilization;

            rows.Add(new EventAnalyticsRowDto(
                entity.Id,
                entity.Title,
                entity.StartDate,
                entity.Status.ToString(),
                entity.Capacity,
                confirmed,
                checkedIn,
                utilization,
                noShowRate));
        }

        var averageUtilization = rows.Count == 0 ? 0 : Math.Round(utilizationSum / rows.Count, 1);
        var overallNoShow = totalConfirmed == 0 ? 0 : Math.Round((double)(totalConfirmed - totalCheckedIn) / totalConfirmed * 100, 1);

        return new EventAnalyticsDto(
            DateTime.UtcNow,
            events.Count,
            events.Count(e => e.Status == EventStatus.Published),
            events.Count(e => e.Status == EventStatus.Draft),
            events.Count(e => e.Status == EventStatus.Cancelled),
            events.Count(e => e.Status == EventStatus.Completed),
            totalRegistrations,
            totalConfirmed,
            totalWaitlisted,
            totalCheckedIn,
            averageUtilization,
            overallNoShow,
            rows);
    }

    public async Task<byte[]> ExportRegistrationReportCsvAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var report = await GetRegistrationReportAsync(fromDate, toDate, cancellationToken);
        var headers = new[] { "Event", "StartDate", "EventStatus", "Capacity", "Confirmed", "Pending", "Waitlisted", "Cancelled", "Rejected", "Total" };
        var rows = report.Rows.Select(r => (IReadOnlyList<object?>)new object?[]
        {
            r.EventTitle,
            r.StartDate.ToString("u"),
            r.Status,
            r.Capacity,
            r.Confirmed,
            r.Pending,
            r.Waitlisted,
            r.Cancelled,
            r.Rejected,
            r.Total
        });

        return CsvWriter.Build(headers, rows);
    }

    public async Task<byte[]> ExportAttendanceReportCsvAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var report = await GetAttendanceReportAsync(fromDate, toDate, cancellationToken);
        var headers = new[] { "Event", "StartDate", "Confirmed", "TicketsIssued", "CheckedIn", "NoShows", "AttendanceRate%" };
        var rows = report.Rows.Select(r => (IReadOnlyList<object?>)new object?[]
        {
            r.EventTitle,
            r.StartDate.ToString("u"),
            r.Confirmed,
            r.TicketsIssued,
            r.CheckedIn,
            r.NoShows,
            r.AttendanceRate
        });

        return CsvWriter.Build(headers, rows);
    }

    private async Task<IReadOnlyList<Event>> GetEventsAsync(
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var events = await _eventRepository.GetAllWithVenueAsync(cancellationToken);
        return events
            .Where(e => (!fromDate.HasValue || e.StartDate >= fromDate.Value)
                && (!toDate.HasValue || e.StartDate <= toDate.Value))
            .ToList();
    }

    private async Task<Dictionary<RegistrationStatus, int>> GetStatusCountsAsync(Guid eventId, CancellationToken cancellationToken)
    {
        return new Dictionary<RegistrationStatus, int>
        {
            [RegistrationStatus.Confirmed] = await _registrationRepository.GetCountByStatusAsync(eventId, RegistrationStatus.Confirmed, cancellationToken),
            [RegistrationStatus.Pending] = await _registrationRepository.GetCountByStatusAsync(eventId, RegistrationStatus.Pending, cancellationToken),
            [RegistrationStatus.Waitlisted] = await _registrationRepository.GetCountByStatusAsync(eventId, RegistrationStatus.Waitlisted, cancellationToken),
            [RegistrationStatus.Cancelled] = await _registrationRepository.GetCountByStatusAsync(eventId, RegistrationStatus.Cancelled, cancellationToken),
            [RegistrationStatus.Rejected] = await _registrationRepository.GetCountByStatusAsync(eventId, RegistrationStatus.Rejected, cancellationToken),
        };
    }
}
