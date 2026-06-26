using EventManagementApp.Application.DTOs.Tickets;

namespace EventManagementApp.Application.Interfaces.Services;

public interface ITicketService
{
    Task<TicketDto> IssueTicketForRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task<TicketDto?> GetTicketAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task<TicketDto?> GetTicketByRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateTicketPdfAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task SendTicketEmailAsync(Guid ticketId, CancellationToken cancellationToken = default);
    Task CancelTicketForRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default);
}
