using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.DTOs.Seating;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/registrations")]
[Authorize]
public class RegistrationsController : ControllerBase
{
    private readonly IRegistrationService _registrationService;
    private readonly ISeatingService _seatingService;

    public RegistrationsController(
        IRegistrationService registrationService,
        ISeatingService seatingService)
    {
        _registrationService = registrationService;
        _seatingService = seatingService;
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationResultDto>> Register(
        [FromBody] CreateRegistrationRequest request,
        [FromServices] IValidator<CreateRegistrationRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _registrationService.RegisterForEventAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await _registrationService.CancelRegistrationAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/seat/auto")]
    public async Task<ActionResult<SeatAssignmentResultDto>> AutoAssignSeat(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _seatingService.AutoAssignSeatAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/seat/select")]
    public async Task<ActionResult<SeatAssignmentResultDto>> SelectSeat(
        Guid id,
        [FromBody] SelectSeatRequest request,
        [FromServices] IValidator<SelectSeatRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _seatingService.SelectSeatAsync(id, request.SeatId, cancellationToken);
        return Ok(result);
    }
}
