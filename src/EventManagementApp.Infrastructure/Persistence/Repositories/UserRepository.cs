using EventManagementApp.Application.Common;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = UserInputNormalizer.NormalizeEmail(email);
        return _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
    }

    public Task<User?> GetByPasswordResetTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return _context.Users.FirstOrDefaultAsync(
            u => u.PasswordResetToken == token && u.PasswordResetTokenExpiresAt != null,
            cancellationToken);
    }

    public Task<User?> GetByEmailVerificationTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return _context.Users.FirstOrDefaultAsync(
            u => u.EmailVerificationToken == token && u.EmailVerificationTokenExpiresAt != null,
            cancellationToken);
    }

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = UserInputNormalizer.NormalizeEmail(email);
        return _context.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
    }

    public Task<bool> FullNameExistsAsync(
        string firstName,
        string lastName,
        Guid? excludeUserId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedFirstName = UserInputNormalizer.NormalizeName(firstName).ToLower();
        var normalizedLastName = UserInputNormalizer.NormalizeName(lastName).ToLower();

        var query = _context.Users.Where(u =>
            u.FirstName.ToLower() == normalizedFirstName &&
            u.LastName.ToLower() == normalizedLastName);

        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountByRoleAsync(UserRole role, CancellationToken cancellationToken = default)
    {
        return _context.Users.CountAsync(u => u.Role == role, cancellationToken);
    }

    public void Add(User user) => _context.Users.Add(user);

    public void Update(User user) => _context.Users.Update(user);

    public void Remove(User user) => _context.Users.Remove(user);
}
