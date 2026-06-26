using EventManagementApp.Domain.Common;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Domain.Entities;

public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Capacity { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public bool IsFeatured { get; set; }
    public DateTime? RegistrationOpensAt { get; set; }
    public DateTime? RegistrationClosesAt { get; set; }
    public bool RequiresSeating { get; set; }
    public SeatAssignmentMode SeatAssignmentMode { get; set; } = SeatAssignmentMode.None;
    public bool RequiresApproval { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }

    public Guid VenueId { get; set; }
    public Venue Venue { get; set; } = null!;

    public ICollection<Speaker> Speakers { get; set; } = [];
    public ICollection<Registration> Registrations { get; set; } = [];
}
