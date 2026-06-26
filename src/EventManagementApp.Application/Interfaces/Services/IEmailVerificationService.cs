using EventManagementApp.Application.Common;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IEmailVerificationService
{
    /// <summary>
    /// Validates RFC format and DNS MX records (registration pre-check).
    /// </summary>
    Task<EmailVerificationResult> ValidateEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates RFC email format only (login and password reset).
    /// </summary>
    EmailVerificationResult VerifyFormat(string email);
}
