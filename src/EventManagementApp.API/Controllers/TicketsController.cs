using EventManagementApp.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var ticket = await _ticketService.GetTicketAsync(id, cancellationToken);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        return Ok(ticket);
    }

    [HttpGet("by-registration/{registrationId:guid}")]
    public async Task<ActionResult> GetByRegistration(Guid registrationId, CancellationToken cancellationToken)
    {
        var ticket = await _ticketService.GetTicketByRegistrationAsync(registrationId, cancellationToken);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        return Ok(ticket);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id, CancellationToken cancellationToken)
    {
        var pdf = await _ticketService.GenerateTicketPdfAsync(id, cancellationToken);
        return File(pdf, "application/pdf", $"ticket-{id}.pdf");
    }

    [HttpPost("{id:guid}/email")]
    public async Task<ActionResult> EmailTicket(Guid id, CancellationToken cancellationToken)
    {
        await _ticketService.SendTicketEmailAsync(id, cancellationToken);
        return Ok(new { message = "Ticket email sent." });
    }
}
