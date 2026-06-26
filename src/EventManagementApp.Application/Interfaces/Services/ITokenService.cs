namespace EventManagementApp.Application.Interfaces.Services;

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, string email, string role);
}
