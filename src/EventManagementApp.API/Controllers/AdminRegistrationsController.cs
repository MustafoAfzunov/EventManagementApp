using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminRegistrationsController : ControllerBase
{
    private readonly IAdminRegistrationService _adminRegistrationService;

    public AdminRegistrationsController(IAdminRegistrationService adminRegistrationService)
    {
        _adminRegistrationService = adminRegistrationService;
    }

    [HttpGet("events/{eventId:guid}/registrations")]
    public async Task<ActionResult<EventRegistrationsDto>> GetEventRegistrations(
        Guid eventId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var result = await _adminRegistrationService.GetEventRegistrationsAsync(eventId, status, cancellationToken);
        return Ok(result);
    }

    [HttpPost("registrations/{registrationId:guid}/approve")]
    public async Task<ActionResult<RegistrationResultDto>> Approve(
        Guid registrationId,
        CancellationToken cancellationToken)
    {
        var result = await _adminRegistrationService.ApproveAsync(registrationId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("registrations/{registrationId:guid}/reject")]
    public async Task<ActionResult> Reject(
        Guid registrationId,
        [FromBody] RejectRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        await _adminRegistrationService.RejectAsync(registrationId, request, cancellationToken);
        return NoContent();
    }

    [HttpGet("events/{eventId:guid}/registrations/export")]
    public async Task<IActionResult> Export(
        Guid eventId,
        [FromQuery] string format = "csv",
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            var pdf = await _adminRegistrationService.ExportAttendeesPdfAsync(eventId, cancellationToken);
            return File(pdf, "application/pdf", $"attendees-{eventId}.pdf");
        }

        var csv = await _adminRegistrationService.ExportAttendeesCsvAsync(eventId, cancellationToken);
        return File(csv, "text/csv", $"attendees-{eventId}.csv");
    }
}
