using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface IAttendanceRepository
{
    Task<Attendance?> GetByTicketIdAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Attendance>> GetByEventIdWithDetailsAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<int> GetCountByEventAsync(Guid eventId, CancellationToken cancellationToken = default);
    void Add(Attendance attendance);
}
