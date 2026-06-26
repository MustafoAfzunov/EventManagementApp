namespace EventManagementApp.Application.Common;

public static class EmailVerificationMessages
{
    public const string InvalidFormat = "Enter a valid email address (e.g. name@uca.edu.kg).";
    public const string DomainDoesNotExist = "Email domain does not exist.";
    public const string VerificationRequired = "Please verify your email address before logging in.";
    public const string VerificationSent = "Registration successful. A verification link has been sent to your email.";
    public const string EmailVerified = "Email verified successfully. You can now log in.";
    public const string InvalidVerificationToken = "Invalid or expired verification link.";
    public const string AlreadyVerified = "Email address is already verified.";
}
