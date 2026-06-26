using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface ISeatRepository
{
    Task<IReadOnlyList<Seat>> GetByVenueIdAsync(Guid venueId, CancellationToken cancellationToken = default);
    Task<Seat?> GetByIdAsync(Guid seatId, CancellationToken cancellationToken = default);
    Task<Seat?> GetAvailableSeatForVenueAsync(Guid venueId, CancellationToken cancellationToken = default);
    Task<SeatAssignment?> GetAssignmentByRegistrationIdAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task<int> GetSeatCountByVenueAsync(Guid venueId, CancellationToken cancellationToken = default);
    Task<int> GetAssignedSeatCountByEventAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task ReleaseExpiredHoldsAsync(CancellationToken cancellationToken = default);
    void AddRange(IEnumerable<Seat> seats);
    void Update(Seat seat);
    void AddAssignment(SeatAssignment assignment);
    void UpdateAssignment(SeatAssignment assignment);
    void RemoveAssignment(SeatAssignment assignment);
}
