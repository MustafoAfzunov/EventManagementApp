using EventManagementApp.Application.DTOs.CheckIn;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/check-in")]
[Authorize(Roles = "EventStaff,Admin")]
public class CheckInController : ControllerBase
{
    private readonly ICheckInService _checkInService;

    public CheckInController(ICheckInService checkInService)
    {
        _checkInService = checkInService;
    }

    [HttpPost("scan")]
    public async Task<ActionResult<CheckInResultDto>> Scan(
        [FromBody] ScanTicketRequest request,
        [FromServices] IValidator<ScanTicketRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _checkInService.ScanAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("events/{eventId:guid}/attendance")]
    public async Task<ActionResult<IReadOnlyList<AttendanceItemDto>>> GetAttendance(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        var attendance = await _checkInService.GetEventAttendanceAsync(eventId, cancellationToken);
        return Ok(attendance);
    }

    [HttpGet("events/{eventId:guid}/stats")]
    public async Task<ActionResult<CheckInStatsDto>> GetStats(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        var stats = await _checkInService.GetEventStatsAsync(eventId, cancellationToken);
        return Ok(stats);
    }
}
