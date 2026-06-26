using EventManagementApp.Domain.Common;

namespace EventManagementApp.Domain.Entities;

public class VenueLayout : BaseEntity
{
    public Guid VenueId { get; set; }
    public Venue Venue { get; set; } = null!;

    public string SectionsJson { get; set; } = "[]";
}
