using EventManagementApp.Application.DTOs.Admin;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IAdminVenueService
{
    Task<IReadOnlyList<VenueListItemDto>> GetVenuesAsync(CancellationToken cancellationToken = default);
    Task<VenueListItemDto> CreateVenueAsync(CreateVenueRequest request, CancellationToken cancellationToken = default);
    Task<VenueListItemDto> UpdateVenueAsync(Guid id, UpdateVenueRequest request, CancellationToken cancellationToken = default);
}
