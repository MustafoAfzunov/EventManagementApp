using EventManagementApp.Application.DTOs.Reports;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IReportingService
{
    Task<RegistrationReportDto> GetRegistrationReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    Task<AttendanceReportDto> GetAttendanceReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    Task<SeatOccupancyReportDto> GetSeatOccupancyReportAsync(CancellationToken cancellationToken = default);
    Task<EventAnalyticsDto> GetEventAnalyticsAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    Task<byte[]> ExportRegistrationReportCsvAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    Task<byte[]> ExportAttendanceReportCsvAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
}
