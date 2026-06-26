using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly AppDbContext _context;

    public AttendanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Attendance?> GetByTicketIdAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        return _context.Attendances.FirstOrDefaultAsync(a => a.TicketId == ticketId, cancellationToken);
    }

    public async Task<IReadOnlyList<Attendance>> GetByEventIdWithDetailsAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Attendances
            .AsNoTracking()
            .Include(a => a.Ticket)
                .ThenInclude(t => t.Registration)
                    .ThenInclude(r => r.User)
            .Include(a => a.Ticket)
                .ThenInclude(t => t.Registration)
                    .ThenInclude(r => r.SeatAssignment!)
                        .ThenInclude(sa => sa.Seat)
            .Where(a => a.EventId == eventId)
            .OrderBy(a => a.CheckedInAt)
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetCountByEventAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return _context.Attendances.CountAsync(a => a.EventId == eventId, cancellationToken);
    }

    public void Add(Attendance attendance) => _context.Attendances.Add(attendance);
}
