using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/admin/venues")]
[Authorize(Roles = "Admin")]
public class AdminVenuesController : ControllerBase
{
    private readonly IAdminVenueService _adminVenueService;

    public AdminVenuesController(IAdminVenueService adminVenueService)
    {
        _adminVenueService = adminVenueService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VenueListItemDto>>> GetAll(CancellationToken cancellationToken)
    {
        var venues = await _adminVenueService.GetVenuesAsync(cancellationToken);
        return Ok(venues);
    }

    [HttpPost]
    public async Task<ActionResult<VenueListItemDto>> Create(
        [FromBody] CreateVenueRequest request,
        [FromServices] IValidator<CreateVenueRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var venue = await _adminVenueService.CreateVenueAsync(request, cancellationToken);
        return Ok(venue);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VenueListItemDto>> Update(
        Guid id,
        [FromBody] UpdateVenueRequest request,
        [FromServices] IValidator<UpdateVenueRequest> validator,
        CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);
        var venue = await _adminVenueService.UpdateVenueAsync(id, request, cancellationToken);
        return Ok(venue);
    }
}
