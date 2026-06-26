using EventManagementApp.Domain.Common;

namespace EventManagementApp.Domain.Entities;

public class Venue : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

    public ICollection<Event> Events { get; set; } = [];
    public ICollection<Seat> Seats { get; set; } = [];
    public VenueLayout? Layout { get; set; }
}
