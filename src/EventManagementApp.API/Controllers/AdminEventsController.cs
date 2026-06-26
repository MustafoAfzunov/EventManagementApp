using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/admin/events")]
[Authorize(Roles = "Admin")]
public class AdminEventsController : ControllerBase
{
    private readonly IAdminEventService _adminEventService;

    public AdminEventsController(IAdminEventService adminEventService)
    {
        _adminEventService = adminEventService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminEventListItemDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var parameters = new AdminEventQueryParameters(search, status, page, pageSize);
        var result = await _adminEventService.GetEventsAsync(parameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminEventService.GetEventAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EventDetailDto>> Create(
        [FromBody] CreateEventRequest request,
        [FromServices] IValidator<CreateEventRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _adminEventService.CreateEventAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDetailDto>> Update(
        Guid id,
        [FromBody] UpdateEventRequest request,
        [FromServices] IValidator<UpdateEventRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var result = await _adminEventService.UpdateEventAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult> Publish(Guid id, CancellationToken cancellationToken)
    {
        await _adminEventService.PublishEventAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/unpublish")]
    public async Task<ActionResult> Unpublish(Guid id, CancellationToken cancellationToken)
    {
        await _adminEventService.UnpublishEventAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await _adminEventService.CancelEventAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _adminEventService.DeleteEventAsync(id, cancellationToken);
        return NoContent();
    }
}
