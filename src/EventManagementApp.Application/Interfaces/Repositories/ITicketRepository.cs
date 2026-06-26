using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface ITicketRepository
{
    Task<Ticket?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Ticket?> GetByRegistrationIdAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task<Ticket?> GetByTicketCodeAsync(string ticketCode, CancellationToken cancellationToken = default);
    Task<Ticket?> GetByTicketCodeWithDetailsAsync(string ticketCode, CancellationToken cancellationToken = default);
    Task<bool> TicketCodeExistsAsync(string ticketCode, CancellationToken cancellationToken = default);
    Task<int> GetIssuedCountByEventAsync(Guid eventId, CancellationToken cancellationToken = default);
    void Add(Ticket ticket);
    void Update(Ticket ticket);
}
