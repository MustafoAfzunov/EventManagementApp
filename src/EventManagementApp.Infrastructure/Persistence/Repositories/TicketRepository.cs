using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly AppDbContext _context;

    public TicketRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Ticket?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _context.Tickets
            .Include(t => t.Registration)
                .ThenInclude(r => r.User)
            .Include(t => t.Registration)
                .ThenInclude(r => r.Event)
                    .ThenInclude(e => e.Venue)
            .Include(t => t.Registration)
                .ThenInclude(r => r.SeatAssignment!)
                    .ThenInclude(a => a.Seat)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public Task<Ticket?> GetByRegistrationIdAsync(Guid registrationId, CancellationToken cancellationToken = default)
    {
        return _context.Tickets
            .Include(t => t.Registration)
                .ThenInclude(r => r.User)
            .Include(t => t.Registration)
                .ThenInclude(r => r.Event)
                    .ThenInclude(e => e.Venue)
            .Include(t => t.Registration)
                .ThenInclude(r => r.SeatAssignment!)
                    .ThenInclude(a => a.Seat)
            .FirstOrDefaultAsync(t => t.RegistrationId == registrationId, cancellationToken);
    }

    public Task<Ticket?> GetByTicketCodeAsync(string ticketCode, CancellationToken cancellationToken = default)
    {
        return _context.Tickets
            .Include(t => t.Registration)
            .FirstOrDefaultAsync(t => t.TicketCode == ticketCode, cancellationToken);
    }

    public Task<Ticket?> GetByTicketCodeWithDetailsAsync(string ticketCode, CancellationToken cancellationToken = default)
    {
        return _context.Tickets
            .Include(t => t.Attendance)
            .Include(t => t.Registration)
                .ThenInclude(r => r.User)
            .Include(t => t.Registration)
                .ThenInclude(r => r.Event)
                    .ThenInclude(e => e.Venue)
            .Include(t => t.Registration)
                .ThenInclude(r => r.SeatAssignment!)
                    .ThenInclude(a => a.Seat)
            .FirstOrDefaultAsync(t => t.TicketCode == ticketCode, cancellationToken);
    }

    public Task<bool> TicketCodeExistsAsync(string ticketCode, CancellationToken cancellationToken = default)
    {
        return _context.Tickets.AnyAsync(t => t.TicketCode == ticketCode, cancellationToken);
    }

    public Task<int> GetIssuedCountByEventAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return _context.Tickets.CountAsync(
            t => t.Status == TicketStatus.Active && t.Registration.EventId == eventId,
            cancellationToken);
    }

    public void Add(Ticket ticket) => _context.Tickets.Add(ticket);

    public void Update(Ticket ticket) => _context.Tickets.Update(ticket);
}
