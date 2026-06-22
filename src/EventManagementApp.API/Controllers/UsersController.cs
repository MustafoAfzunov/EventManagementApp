using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.DTOs.Users;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/users/me")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IRegistrationService _registrationService;

    public UsersController(IUserService userService, IRegistrationService registrationService)
    {
        _userService = userService;
        _registrationService = registrationService;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfileDto>> GetProfile(CancellationToken cancellationToken)
    {
        var profile = await _userService.GetCurrentUserProfileAsync(cancellationToken);
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromServices] IValidator<UpdateProfileRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var profile = await _userService.UpdateProfileAsync(request, cancellationToken);
        return Ok(profile);
    }

    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] IValidator<ChangePasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        await _userService.ChangePasswordAsync(request, cancellationToken);
        return NoContent();
    }

    [HttpGet("registrations")]
    public async Task<ActionResult<IReadOnlyList<RegistrationDto>>> GetMyRegistrations(
        CancellationToken cancellationToken)
    {
        var registrations = await _registrationService.GetMyRegistrationsAsync(cancellationToken);
        return Ok(registrations);
    }
}
