using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Registrations;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IAdminRegistrationService
{
    Task<EventRegistrationsDto> GetEventRegistrationsAsync(Guid eventId, string? status, CancellationToken cancellationToken = default);
    Task<RegistrationResultDto> ApproveAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task RejectAsync(Guid registrationId, RejectRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<byte[]> ExportAttendeesCsvAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<byte[]> ExportAttendeesPdfAsync(Guid eventId, CancellationToken cancellationToken = default);
}
