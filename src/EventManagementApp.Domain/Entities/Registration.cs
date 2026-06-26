using EventManagementApp.Domain.Common;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Domain.Entities;

public class Registration : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;

    public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;
    public int? WaitlistPosition { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }

    public SeatAssignment? SeatAssignment { get; set; }
    public Ticket? Ticket { get; set; }
}
