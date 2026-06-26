using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace EventManagementApp.Infrastructure.Identity;

public class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string HashPassword(User user, string password)
    {
        return _hasher.HashPassword(user, password);
    }

    public bool VerifyPassword(User user, string password, string passwordHash)
    {
        return _hasher.VerifyHashedPassword(user, passwordHash, password) != PasswordVerificationResult.Failed;
    }
}
