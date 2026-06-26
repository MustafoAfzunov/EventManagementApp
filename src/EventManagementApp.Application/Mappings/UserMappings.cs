using EventManagementApp.Application.DTOs.Notifications;
using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.DTOs.Users;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Mappings;

public static class UserMappings
{
    public static UserProfileDto ToProfileDto(this User user)
    {
        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role.ToString(),
            user.IsEmailVerified,
            user.CreatedAt);
    }

    public static UserListItemDto ToListItemDto(this User user)
    {
        return new UserListItemDto(
            user.Id,
            $"{user.FirstName} {user.LastName}",
            user.Email,
            user.Role.ToString(),
            user.CreatedAt);
    }
}

public static class RegistrationMappings
{
    public static RegistrationDto ToDto(this Registration registration)
    {
        string? seatLabel = null;
        if (registration.SeatAssignment?.Seat is not null)
        {
            var seat = registration.SeatAssignment.Seat;
            seatLabel = $"{seat.Section}-{seat.Row}-{seat.Number}";
        }

        return new RegistrationDto(
            registration.Id,
            registration.EventId,
            registration.Event.Title,
            registration.Event.StartDate,
            registration.Status.ToString(),
            registration.WaitlistPosition,
            registration.CreatedAt,
            registration.Event.RequiresSeating,
            registration.SeatAssignment is not null,
            seatLabel,
            registration.Ticket?.Status == TicketStatus.Active ? registration.Ticket.Id : null,
            registration.Event.EndDate,
            registration.Event.Category,
            registration.Event.SeatAssignmentMode.ToString(),
            registration.Event.Venue?.Name ?? string.Empty,
            registration.Event.ImageUrl);
    }
}

public static class NotificationMappings
{
    public static NotificationDto ToDto(this Notification notification)
    {
        return new NotificationDto(
            notification.Id,
            notification.Title,
            notification.Message,
            notification.Type.ToString(),
            notification.IsRead,
            notification.CreatedAt);
    }
}
