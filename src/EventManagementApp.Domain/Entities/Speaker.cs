using EventManagementApp.Domain.Common;

namespace EventManagementApp.Domain.Entities;

public class Speaker : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }

    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;
}
