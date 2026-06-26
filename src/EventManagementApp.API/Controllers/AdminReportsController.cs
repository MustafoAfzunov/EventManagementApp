using EventManagementApp.Application.DTOs.Reports;
using EventManagementApp.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "Admin")]
public class AdminReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public AdminReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("registrations")]
    public async Task<ActionResult<RegistrationReportDto>> Registrations(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var report = await _reportingService.GetRegistrationReportAsync(fromDate, toDate, cancellationToken);
        return Ok(report);
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<AttendanceReportDto>> Attendance(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var report = await _reportingService.GetAttendanceReportAsync(fromDate, toDate, cancellationToken);
        return Ok(report);
    }

    [HttpGet("seat-occupancy")]
    public async Task<ActionResult<SeatOccupancyReportDto>> SeatOccupancy(CancellationToken cancellationToken)
    {
        var report = await _reportingService.GetSeatOccupancyReportAsync(cancellationToken);
        return Ok(report);
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<EventAnalyticsDto>> Analytics(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var report = await _reportingService.GetEventAnalyticsAsync(fromDate, toDate, cancellationToken);
        return Ok(report);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string type = "registrations",
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(type, "attendance", StringComparison.OrdinalIgnoreCase))
        {
            var attendanceCsv = await _reportingService.ExportAttendanceReportCsvAsync(fromDate, toDate, cancellationToken);
            return File(attendanceCsv, "text/csv", "attendance-report.csv");
        }

        var csv = await _reportingService.ExportRegistrationReportCsvAsync(fromDate, toDate, cancellationToken);
        return File(csv, "text/csv", "registration-report.csv");
    }
}
