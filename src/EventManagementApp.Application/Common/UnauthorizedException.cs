namespace EventManagementApp.Application.Common;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized.") : base(message, 401)
    {
    }
}
