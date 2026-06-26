using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Events;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IEventService
{
    Task<PagedResult<EventListItemDto>> GetPublishedEventsAsync(EventQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<EventDetailDto> GetEventByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EventListItemDto>> GetFeaturedEventsAsync(int limit = 5, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EventListItemDto>> GetUpcomingEventsAsync(int limit = 10, CancellationToken cancellationToken = default);
}
