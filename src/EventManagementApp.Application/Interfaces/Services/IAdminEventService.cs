using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Events;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IAdminEventService
{
    Task<PagedResult<AdminEventListItemDto>> GetEventsAsync(AdminEventQueryParameters parameters, CancellationToken cancellationToken = default);
    Task<EventDetailDto> GetEventAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EventDetailDto> CreateEventAsync(CreateEventRequest request, CancellationToken cancellationToken = default);
    Task<EventDetailDto> UpdateEventAsync(Guid id, UpdateEventRequest request, CancellationToken cancellationToken = default);
    Task PublishEventAsync(Guid id, CancellationToken cancellationToken = default);
    Task UnpublishEventAsync(Guid id, CancellationToken cancellationToken = default);
    Task CancelEventAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeleteEventAsync(Guid id, CancellationToken cancellationToken = default);
}
