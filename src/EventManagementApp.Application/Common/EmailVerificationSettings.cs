namespace EventManagementApp.Application.Common;

public class EmailVerificationSettings
{
    public const string SectionName = "EmailVerification";

    public int DnsTimeoutSeconds { get; set; } = 5;

    public int TokenExpiryHours { get; set; } = 24;
}
