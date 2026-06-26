using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class RegistrationRepository : IRegistrationRepository
{
    private readonly AppDbContext _context;

    public RegistrationRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Registration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _context.Registrations
            .Include(r => r.Event)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public Task<Registration?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _context.Registrations
            .Include(r => r.User)
            .Include(r => r.Event)
                .ThenInclude(e => e.Venue)
            .Include(r => r.SeatAssignment!)
                .ThenInclude(a => a.Seat)
            .Include(r => r.Ticket)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public Task<Registration?> GetActiveByUserAndEventAsync(
        Guid userId,
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return _context.Registrations.FirstOrDefaultAsync(
            r => r.UserId == userId &&
                 r.EventId == eventId &&
                 r.Status != RegistrationStatus.Cancelled &&
                 r.Status != RegistrationStatus.Rejected,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Registration>> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Registrations
            .Include(r => r.Event)
            .Where(r => r.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Registration>> GetByUserIdWithDetailsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Registrations
            .Include(r => r.Event)
                .ThenInclude(e => e.Venue)
            .Include(r => r.SeatAssignment!)
                .ThenInclude(a => a.Seat)
            .Include(r => r.Ticket)
            .Where(r => r.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetWaitlistCountAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return _context.Registrations.CountAsync(
            r => r.EventId == eventId && r.Status == RegistrationStatus.Waitlisted,
            cancellationToken);
    }

    public Task<Registration?> GetNextWaitlistedAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return _context.Registrations
            .Where(r => r.EventId == eventId && r.Status == RegistrationStatus.Waitlisted)
            .OrderBy(r => r.WaitlistPosition)
            .ThenBy(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Registration>> GetWaitlistedByEventAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Registrations
            .Where(r => r.EventId == eventId && r.Status == RegistrationStatus.Waitlisted)
            .OrderBy(r => r.WaitlistPosition)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Registration>> GetByEventIdWithDetailsAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Registrations
            .Include(r => r.User)
            .Include(r => r.SeatAssignment!)
                .ThenInclude(a => a.Seat)
            .Include(r => r.Ticket!)
                .ThenInclude(t => t.Attendance)
            .Where(r => r.EventId == eventId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetCountByStatusAsync(
        Guid eventId,
        RegistrationStatus status,
        CancellationToken cancellationToken = default)
    {
        return _context.Registrations.CountAsync(
            r => r.EventId == eventId && r.Status == status,
            cancellationToken);
    }

    public void Add(Registration registration) => _context.Registrations.Add(registration);

    public void Update(Registration registration) => _context.Registrations.Update(registration);
}
