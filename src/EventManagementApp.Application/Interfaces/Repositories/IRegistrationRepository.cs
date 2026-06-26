using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface IRegistrationRepository
{
    Task<Registration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Registration?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Registration?> GetActiveByUserAndEventAsync(Guid userId, Guid eventId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Registration>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Registration>> GetByUserIdWithDetailsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetWaitlistCountAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<Registration?> GetNextWaitlistedAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Registration>> GetWaitlistedByEventAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Registration>> GetByEventIdWithDetailsAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<int> GetCountByStatusAsync(Guid eventId, RegistrationStatus status, CancellationToken cancellationToken = default);
    void Add(Registration registration);
    void Update(Registration registration);
}
