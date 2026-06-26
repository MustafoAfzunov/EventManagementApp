namespace EventManagementApp.Application.Common;

public static class UserInputNormalizer
{
    public static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    public static string NormalizeName(string name)
    {
        return name.Trim();
    }
}
