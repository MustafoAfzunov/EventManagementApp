using EventManagementApp.Domain.Common;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Domain.Entities;

public class SeatAssignment : BaseEntity
{
    public Guid RegistrationId { get; set; }
    public Registration Registration { get; set; } = null!;

    public Guid SeatId { get; set; }
    public Seat Seat { get; set; } = null!;

    public SeatAssignmentMode Mode { get; set; }
    public DateTime AssignedAt { get; set; }
}
