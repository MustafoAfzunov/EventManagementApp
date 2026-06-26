using EventManagementApp.Application.DTOs.Seating;

namespace EventManagementApp.Application.Interfaces.Services;

public interface ISeatingService
{
    Task<EventSeatMapDto> GetEventSeatMapAsync(Guid eventId, Guid? registrationId, CancellationToken cancellationToken = default);
    Task<SeatAssignmentResultDto> AutoAssignSeatAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task<SeatAssignmentResultDto> SelectSeatAsync(Guid registrationId, Guid seatId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VenueSeatDto>> BulkCreateSeatsAsync(Guid venueId, BulkCreateSeatsRequest request, CancellationToken cancellationToken = default);
    Task ConfigureEventSeatingAsync(Guid eventId, ConfigureEventSeatingRequest request, CancellationToken cancellationToken = default);
    Task ReleaseSeatForRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default);
}
