using System.Net.Mail;
using System.Text.RegularExpressions;

namespace EventManagementApp.Application.Common;

/// <summary>
/// RFC 5322-oriented email format validation.
/// </summary>
public static partial class EmailValidator
{
    private static readonly Regex EmailPattern = MyRegex();

    public static bool IsValid(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        var trimmed = email.Trim();

        if (trimmed.Length > 254 || trimmed.Length < 3)
        {
            return false;
        }

        if (!EmailPattern.IsMatch(trimmed) || trimmed.Contains("..", StringComparison.Ordinal))
        {
            return false;
        }

        try
        {
            var address = new MailAddress(trimmed);
            if (!string.Equals(address.Address, trimmed, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }
        catch
        {
            return false;
        }

        var atIndex = trimmed.LastIndexOf('@');
        if (atIndex < 1 || atIndex == trimmed.Length - 1)
        {
            return false;
        }

        var localPart = trimmed[..atIndex];
        var domain = trimmed[(atIndex + 1)..];

        if (localPart.Length > 64 || domain.Length > 253)
        {
            return false;
        }

        var domainParts = domain.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (domainParts.Length < 2)
        {
            return false;
        }

        var tld = domainParts[^1];
        return tld.Length >= 2 && tld.All(char.IsLetter);
    }

    public static bool TryGetDomain(string email, out string domain)
    {
        domain = string.Empty;
        var atIndex = email.LastIndexOf('@');
        if (atIndex < 1 || atIndex >= email.Length - 1)
        {
            return false;
        }

        domain = email[(atIndex + 1)..].ToLowerInvariant();
        return true;
    }

    [GeneratedRegex(
        @"^[a-zA-Z0-9](?:[a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)+$",
        RegexOptions.CultureInvariant)]
    private static partial Regex MyRegex();
}
