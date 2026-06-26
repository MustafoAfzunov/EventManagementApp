using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Notification?> GetByIdForUserAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    void Add(Notification notification);
    void Update(Notification notification);
}
