using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Mappings;

public static class EventMappings
{
    public static EventListItemDto ToListItemDto(this Event entity, int confirmedCount)
    {
        return new EventListItemDto(
            entity.Id,
            entity.Title,
            entity.Description,
            entity.Category,
            entity.StartDate,
            entity.EndDate,
            entity.Capacity,
            confirmedCount,
            Math.Max(0, entity.Capacity - confirmedCount),
            entity.IsFeatured,
            entity.Venue.Name,
            entity.Venue.City,
            entity.ImageUrl);
    }

    public static EventDetailDto ToDetailDto(this Event entity, int confirmedCount)
    {
        return new EventDetailDto(
            entity.Id,
            entity.Title,
            entity.Description,
            entity.Category,
            entity.Status.ToString(),
            entity.StartDate,
            entity.EndDate,
            entity.Capacity,
            confirmedCount,
            Math.Max(0, entity.Capacity - confirmedCount),
            entity.IsFeatured,
            entity.RegistrationOpensAt,
            entity.RegistrationClosesAt,
            entity.RequiresSeating,
            entity.SeatAssignmentMode.ToString(),
            entity.RequiresApproval,
            entity.PublishedAt,
            new VenueDto(
                entity.Venue.Id,
                entity.Venue.Name,
                entity.Venue.Address,
                entity.Venue.City,
                entity.Venue.Country),
            entity.Speakers
                .OrderBy(s => s.Name)
                .Select(s => new SpeakerDto(s.Id, s.Name, s.Bio, s.Title, s.ImageUrl))
                .ToList(),
            entity.ImageUrl);
    }
}
