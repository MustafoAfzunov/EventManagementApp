using EventManagementApp.Application.Common;
using EventManagementApp.Application.Interfaces.Services;

namespace EventManagementApp.Infrastructure.EmailVerification;

public class EmailVerificationService : IEmailVerificationService
{
    private readonly IDnsMxRecordChecker _dnsMxRecordChecker;

    public EmailVerificationService(IDnsMxRecordChecker dnsMxRecordChecker)
    {
        _dnsMxRecordChecker = dnsMxRecordChecker;
    }

    public EmailVerificationResult VerifyFormat(string email)
    {
        var normalized = string.IsNullOrWhiteSpace(email) ? string.Empty : email.Trim().ToLowerInvariant();
        return EmailValidator.IsValid(normalized)
            ? EmailVerificationResult.Success()
            : EmailVerificationResult.Failure(EmailVerificationMessages.InvalidFormat);
    }

    public async Task<EmailVerificationResult> ValidateEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();

        var formatResult = VerifyFormat(normalized);
        if (!formatResult.IsValid)
        {
            return formatResult;
        }

        if (!EmailValidator.TryGetDomain(normalized, out var domain))
        {
            return EmailVerificationResult.Failure(EmailVerificationMessages.InvalidFormat);
        }

        if (!await _dnsMxRecordChecker.DomainAcceptsMailAsync(domain, cancellationToken))
        {
            return EmailVerificationResult.Failure(EmailVerificationMessages.DomainDoesNotExist);
        }

        return EmailVerificationResult.Success();
    }
}
