using EventManagementApp.Application.DTOs.Seating;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminSeatingController : ControllerBase
{
    private readonly ISeatingService _seatingService;

    public AdminSeatingController(ISeatingService seatingService)
    {
        _seatingService = seatingService;
    }

    [HttpPost("venues/{venueId:guid}/seats")]
    public async Task<ActionResult<IReadOnlyList<VenueSeatDto>>> BulkCreateSeats(
        Guid venueId,
        [FromBody] BulkCreateSeatsRequest request,
        [FromServices] IValidator<BulkCreateSeatsRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var seats = await _seatingService.BulkCreateSeatsAsync(venueId, request, cancellationToken);
        return Ok(seats);
    }

    [HttpPut("events/{eventId:guid}/seating")]
    public async Task<ActionResult> ConfigureEventSeating(
        Guid eventId,
        [FromBody] ConfigureEventSeatingRequest request,
        [FromServices] IValidator<ConfigureEventSeatingRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        await _seatingService.ConfigureEventSeatingAsync(eventId, request, cancellationToken);
        return NoContent();
    }
}
