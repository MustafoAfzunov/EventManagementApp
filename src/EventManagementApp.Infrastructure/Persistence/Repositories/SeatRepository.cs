using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class SeatRepository : ISeatRepository
{
    private readonly AppDbContext _context;

    public SeatRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Seat>> GetByVenueIdAsync(Guid venueId, CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .AsNoTracking()
            .Where(s => s.VenueId == venueId)
            .OrderBy(s => s.Section)
            .ThenBy(s => s.Row)
            .ThenBy(s => s.Number)
            .ToListAsync(cancellationToken);
    }

    public Task<Seat?> GetByIdAsync(Guid seatId, CancellationToken cancellationToken = default)
    {
        return _context.Seats.FirstOrDefaultAsync(s => s.Id == seatId, cancellationToken);
    }

    public Task<Seat?> GetAvailableSeatForVenueAsync(Guid venueId, CancellationToken cancellationToken = default)
    {
        return _context.Seats
            .Where(s => s.VenueId == venueId && s.Status == SeatStatus.Available)
            .OrderBy(s => s.Section)
            .ThenBy(s => s.Row)
            .ThenBy(s => s.Number)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<SeatAssignment?> GetAssignmentByRegistrationIdAsync(
        Guid registrationId,
        CancellationToken cancellationToken = default)
    {
        return _context.SeatAssignments
            .Include(a => a.Seat)
            .FirstOrDefaultAsync(a => a.RegistrationId == registrationId, cancellationToken);
    }

    public Task<int> GetSeatCountByVenueAsync(Guid venueId, CancellationToken cancellationToken = default)
    {
        return _context.Seats.CountAsync(s => s.VenueId == venueId, cancellationToken);
    }

    public Task<int> GetAssignedSeatCountByEventAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return _context.SeatAssignments.CountAsync(
            a => a.Registration.EventId == eventId,
            cancellationToken);
    }

    public async Task ReleaseExpiredHoldsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var expired = await _context.Seats
            .Where(s => s.Status == SeatStatus.Held && s.HeldUntil != null && s.HeldUntil < now)
            .ToListAsync(cancellationToken);

        foreach (var seat in expired)
        {
            seat.Status = SeatStatus.Available;
            seat.HeldUntil = null;
            seat.HeldByRegistrationId = null;
            seat.UpdatedAt = now;
        }
    }

    public void AddRange(IEnumerable<Seat> seats) => _context.Seats.AddRange(seats);

    public void Update(Seat seat) => _context.Seats.Update(seat);

    public void AddAssignment(SeatAssignment assignment) => _context.SeatAssignments.Add(assignment);

    public void UpdateAssignment(SeatAssignment assignment) => _context.SeatAssignments.Update(assignment);

    public void RemoveAssignment(SeatAssignment assignment) => _context.SeatAssignments.Remove(assignment);
}
