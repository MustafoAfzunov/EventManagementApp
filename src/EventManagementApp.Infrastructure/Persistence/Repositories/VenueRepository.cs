using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class VenueRepository : IVenueRepository
{
    private readonly AppDbContext _context;

    public VenueRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Venue?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _context.Venues.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Venue>> GetAllWithCountsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Venues
            .AsNoTracking()
            .Include(v => v.Seats)
            .Include(v => v.Events)
            .OrderBy(v => v.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasEventsAsync(Guid venueId, CancellationToken cancellationToken = default)
    {
        return _context.Events.AnyAsync(e => e.VenueId == venueId, cancellationToken);
    }

    public void Add(Venue venue) => _context.Venues.Add(venue);

    public void Update(Venue venue) => _context.Venues.Update(venue);
}
