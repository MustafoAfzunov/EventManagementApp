using EventManagementApp.Application.Common;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByPasswordResetTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailVerificationTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> FullNameExistsAsync(string firstName, string lastName, Guid? excludeUserId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<int> CountByRoleAsync(UserRole role, CancellationToken cancellationToken = default);
    void Add(User user);
    void Update(User user);
    void Remove(User user);
}
