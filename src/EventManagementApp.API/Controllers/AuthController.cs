using EventManagementApp.Application.DTOs.Auth;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.API.Helpers;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request,
        [FromServices] IValidator<RegisterRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        [FromServices] IValidator<LoginRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<MessageResponse>> VerifyEmail(
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyEmailAsync(token, cancellationToken);
        return Ok(response);
    }

    [HttpPost("resend-verification")]
    [AllowAnonymous]
    public async Task<ActionResult<MessageResponse>> ResendVerification(
        [FromBody] ResendVerificationRequest request,
        [FromServices] IValidator<ResendVerificationRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await _authService.ResendVerificationEmailAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<MessageResponse>> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] IValidator<ForgotPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("reset-password")]
    [AllowAnonymous]
    [Produces("text/html")]
    public async Task<ContentResult> ResetPasswordPage(
        [FromQuery] string? token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Content(PasswordResetPageRenderer.RenderInvalid("Missing reset token."), "text/html");
        }

        var isValid = await _authService.IsPasswordResetTokenValidAsync(token, cancellationToken);
        var html = isValid
            ? PasswordResetPageRenderer.RenderValid(token)
            : PasswordResetPageRenderer.RenderInvalid("This password reset link is invalid or has expired.");

        return Content(html, "text/html");
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<MessageResponse>> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        [FromServices] IValidator<ResetPasswordRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var response = await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(response);
    }
}
