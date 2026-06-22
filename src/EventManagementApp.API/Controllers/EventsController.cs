using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/events")]
[AllowAnonymous]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<ActionResult> GetEvents(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] Guid? venueId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var parameters = new EventQueryParameters(search, category, venueId, fromDate, toDate, page, pageSize);
        var result = await _eventService.GetPublishedEventsAsync(parameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("featured")]
    public async Task<ActionResult<IReadOnlyList<EventListItemDto>>> GetFeatured(
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _eventService.GetFeaturedEventsAsync(limit, cancellationToken);
        return Ok(result);
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IReadOnlyList<EventListItemDto>>> GetUpcoming(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _eventService.GetUpcomingEventsAsync(limit, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _eventService.GetEventByIdAsync(id, cancellationToken);
        return Ok(result);
    }
}
