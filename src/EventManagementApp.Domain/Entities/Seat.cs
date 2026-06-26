using EventManagementApp.Domain.Common;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Domain.Entities;

public class Seat : BaseEntity
{
    public Guid VenueId { get; set; }
    public Venue Venue { get; set; } = null!;

    public string Section { get; set; } = string.Empty;
    public string Row { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;

    public SeatStatus Status { get; set; } = SeatStatus.Available;
    public DateTime? HeldUntil { get; set; }
    public Guid? HeldByRegistrationId { get; set; }

    public SeatAssignment? Assignment { get; set; }
}
