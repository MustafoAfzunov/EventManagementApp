using System.Security.Cryptography;
using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Auth;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace EventManagementApp.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly IEmailVerificationService _emailVerificationService;
    private readonly IConfiguration _configuration;
    private readonly EmailVerificationSettings _emailVerificationSettings;

    public AuthService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IEmailService emailService,
        IEmailVerificationService emailVerificationService,
        IConfiguration configuration,
        IOptions<EmailVerificationSettings> emailVerificationSettings)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _emailService = emailService;
        _emailVerificationService = emailVerificationService;
        _configuration = configuration;
        _emailVerificationSettings = emailVerificationSettings.Value;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = UserInputNormalizer.NormalizeEmail(request.Email);
        var firstName = UserInputNormalizer.NormalizeName(request.FirstName);
        var lastName = UserInputNormalizer.NormalizeName(request.LastName);

        var emailValidation = await _emailVerificationService.ValidateEmailAsync(email, cancellationToken);
        if (!emailValidation.IsValid)
        {
            throw new AppException(emailValidation.ErrorMessage ?? EmailVerificationMessages.InvalidFormat, 400);
        }

        if (await _userRepository.EmailExistsAsync(email, cancellationToken))
        {
            throw new ConflictException("An account with this email already exists.");
        }

        if (await _userRepository.FullNameExistsAsync(firstName, lastName, cancellationToken: cancellationToken))
        {
            throw new ConflictException("An account with this full name already exists.");
        }

        var verificationToken = GenerateSecureToken();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Role = UserRole.Attendee,
            IsEmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(_emailVerificationSettings.TokenExpiryHours),
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var verificationLink = BuildVerificationLink(verificationToken);
        await _emailService.SendEmailVerificationAsync(email, verificationLink, cancellationToken);

        return new RegisterResponse(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            false,
            EmailVerificationMessages.VerificationSent);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var formatCheck = _emailVerificationService.VerifyFormat(request.Email);
        if (!formatCheck.IsValid)
        {
            throw new AppException(EmailVerificationMessages.InvalidFormat, 400);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user is null || !_passwordHasher.VerifyPassword(user, request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.IsEmailVerified)
        {
            throw new AppException(EmailVerificationMessages.VerificationRequired, 403);
        }

        return CreateAuthResponse(user);
    }

    public async Task<MessageResponse> VerifyEmailAsync(string token, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailVerificationTokenAsync(token, cancellationToken);

        if (user is null ||
            user.EmailVerificationTokenExpiresAt is null ||
            user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
        {
            throw new AppException(EmailVerificationMessages.InvalidVerificationToken, 400);
        }

        if (user.IsEmailVerified)
        {
            return new MessageResponse(EmailVerificationMessages.AlreadyVerified);
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MessageResponse(EmailVerificationMessages.EmailVerified);
    }

    public async Task<MessageResponse> ResendVerificationEmailAsync(
        ResendVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var formatCheck = _emailVerificationService.VerifyFormat(request.Email);
        if (!formatCheck.IsValid)
        {
            throw new AppException(EmailVerificationMessages.InvalidFormat, 400);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user is null)
        {
            return new MessageResponse("If an account exists for that email, a verification link has been sent.");
        }

        if (user.IsEmailVerified)
        {
            return new MessageResponse(EmailVerificationMessages.AlreadyVerified);
        }

        user.EmailVerificationToken = GenerateSecureToken();
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(_emailVerificationSettings.TokenExpiryHours);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var verificationLink = BuildVerificationLink(user.EmailVerificationToken);
        await _emailService.SendEmailVerificationAsync(user.Email, verificationLink, cancellationToken);

        return new MessageResponse("If an account exists for that email, a verification link has been sent.");
    }

    public async Task<MessageResponse> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var formatCheck = _emailVerificationService.VerifyFormat(request.Email);
        if (!formatCheck.IsValid)
        {
            throw new AppException(EmailVerificationMessages.InvalidFormat, 400);
        }

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user is not null)
        {
            user.PasswordResetToken = GenerateSecureToken();
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(
                _configuration.GetValue("PasswordReset:TokenExpiryHours", 1));
            user.UpdatedAt = DateTime.UtcNow;
            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var resetLink = BuildPasswordResetLink(user.PasswordResetToken);
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink, cancellationToken);
        }

        return new MessageResponse("If an account exists for that email, a password reset link has been sent.");
    }

    public async Task<bool> IsPasswordResetTokenValidAsync(string token, CancellationToken cancellationToken = default) =>
        await GetValidPasswordResetUserAsync(token, cancellationToken) is not null;

    public async Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetValidPasswordResetUserAsync(request.Token, cancellationToken);

        if (user is null)
        {
            throw new AppException("Invalid or expired password reset token.", 400);
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MessageResponse("Password has been reset successfully.");
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var expiryMinutes = _configuration.GetValue("Jwt:ExpiryMinutes", 60);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);
        var token = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Role.ToString());

        return new AuthResponse(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role.ToString(),
            user.IsEmailVerified,
            token,
            expiresAt);
    }

    private async Task<User?> GetValidPasswordResetUserAsync(string token, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByPasswordResetTokenAsync(token, cancellationToken);

        if (user is null || user.PasswordResetTokenExpiresAt is null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
        {
            return null;
        }

        return user;
    }

    private string BuildVerificationLink(string token)
    {
        var frontendUrl = _configuration.GetValue("App:FrontendUrl", "http://localhost:5173")!.TrimEnd('/');
        return $"{frontendUrl}/verify-email?token={Uri.EscapeDataString(token)}";
    }

    private string BuildPasswordResetLink(string token)
    {
        var frontendUrl = _configuration.GetValue("App:FrontendUrl", "http://localhost:5173")!.TrimEnd('/');
        return $"{frontendUrl}/forgot-password?token={Uri.EscapeDataString(token)}";
    }

    private static string GenerateSecureToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
}
