using EventManagementApp.Application.DTOs.Registrations;
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

    public RegistrationsController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
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
}
