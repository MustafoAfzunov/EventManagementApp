using EventManagementApp.Application.DTOs.Registrations;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IRegistrationService
{
    Task<RegistrationResultDto> RegisterForEventAsync(CreateRegistrationRequest request, CancellationToken cancellationToken = default);
    Task CancelRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RegistrationDto>> GetMyRegistrationsAsync(CancellationToken cancellationToken = default);
}
