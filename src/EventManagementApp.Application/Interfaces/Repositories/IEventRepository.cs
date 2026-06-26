using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default);
    Task<PagedResult<Event>> GetPublishedEventsAsync(EventQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Event>> GetFeaturedEventsAsync(int limit, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Event>> GetUpcomingEventsAsync(int limit, CancellationToken cancellationToken = default);
    Task<int> GetConfirmedRegistrationCountAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<PagedResult<Event>> GetAllAsync(AdminEventQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Event>> GetAllWithVenueAsync(CancellationToken cancellationToken = default);
    void Add(Event eventEntity);
    void Update(Event eventEntity);
    void Remove(Event eventEntity);
}
