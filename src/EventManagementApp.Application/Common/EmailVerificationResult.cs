namespace EventManagementApp.Application.Common;

public class EmailVerificationResult
{
    public bool IsValid { get; init; }
    public string? ErrorMessage { get; init; }

    public static EmailVerificationResult Success() => new() { IsValid = true };

    public static EmailVerificationResult Failure(string errorMessage) =>
        new() { IsValid = false, ErrorMessage = errorMessage };
}
