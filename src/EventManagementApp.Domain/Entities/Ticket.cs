using EventManagementApp.Domain.Common;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Domain.Entities;

public class Ticket : BaseEntity
{
    public Guid RegistrationId { get; set; }
    public Registration Registration { get; set; } = null!;

    public string TicketCode { get; set; } = string.Empty;
    public string QrPayload { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Active;

    public Attendance? Attendance { get; set; }
}
