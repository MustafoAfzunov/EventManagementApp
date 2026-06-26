using EventManagementApp.Domain.Common;

namespace EventManagementApp.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;

    public DateTime CheckedInAt { get; set; }
    public Guid CheckedInByUserId { get; set; }
}
