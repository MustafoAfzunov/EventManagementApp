using EventManagementApp.Application.DTOs.CheckIn;

namespace EventManagementApp.Application.Interfaces.Services;

public interface ICheckInService
{
    Task<CheckInResultDto> ScanAsync(ScanTicketRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AttendanceItemDto>> GetEventAttendanceAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<CheckInStatsDto> GetEventStatsAsync(Guid eventId, CancellationToken cancellationToken = default);
}
