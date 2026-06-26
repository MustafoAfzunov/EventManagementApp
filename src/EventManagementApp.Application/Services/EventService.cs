using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Application.Mappings;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;

    public EventService(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<PagedResult<EventListItemDto>> GetPublishedEventsAsync(
        EventQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var result = await _eventRepository.GetPublishedEventsAsync(parameters, cancellationToken);
        var items = new List<EventListItemDto>();

        foreach (var entity in result.Items)
        {
            var confirmed = await _eventRepository.GetConfirmedRegistrationCountAsync(entity.Id, cancellationToken);
            items.Add(entity.ToListItemDto(confirmed));
        }

        return new PagedResult<EventListItemDto>
        {
            Items = items,
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public async Task<EventDetailDto> GetEventByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepository.GetByIdAsync(id, includeDetails: true, cancellationToken);

        if (entity is null || entity.Status != EventStatus.Published)
        {
            throw new NotFoundException("Event not found.");
        }

        var confirmed = await _eventRepository.GetConfirmedRegistrationCountAsync(entity.Id, cancellationToken);
        return entity.ToDetailDto(confirmed);
    }

    public async Task<IReadOnlyList<EventListItemDto>> GetFeaturedEventsAsync(
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var events = await _eventRepository.GetFeaturedEventsAsync(limit, cancellationToken);
        return await MapEventListAsync(events, cancellationToken);
    }

    public async Task<IReadOnlyList<EventListItemDto>> GetUpcomingEventsAsync(
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var events = await _eventRepository.GetUpcomingEventsAsync(limit, cancellationToken);
        return await MapEventListAsync(events, cancellationToken);
    }

    private async Task<IReadOnlyList<EventListItemDto>> MapEventListAsync(
        IReadOnlyList<Domain.Entities.Event> events,
        CancellationToken cancellationToken)
    {
        var items = new List<EventListItemDto>();

        foreach (var entity in events)
        {
            var confirmed = await _eventRepository.GetConfirmedRegistrationCountAsync(entity.Id, cancellationToken);
            items.Add(entity.ToListItemDto(confirmed));
        }

        return items;
    }
}
