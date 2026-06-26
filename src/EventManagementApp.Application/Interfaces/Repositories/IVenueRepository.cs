using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface IVenueRepository
{
    Task<Venue?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Venue>> GetAllWithCountsAsync(CancellationToken cancellationToken = default);
    Task<bool> HasEventsAsync(Guid venueId, CancellationToken cancellationToken = default);
    void Add(Venue venue);
    void Update(Venue venue);
}
