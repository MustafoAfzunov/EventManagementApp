using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Services;

public class AdminVenueService : IAdminVenueService
{
    private readonly IVenueRepository _venueRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdminVenueService(IVenueRepository venueRepository, IUnitOfWork unitOfWork)
    {
        _venueRepository = venueRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<VenueListItemDto>> GetVenuesAsync(CancellationToken cancellationToken = default)
    {
        var venues = await _venueRepository.GetAllWithCountsAsync(cancellationToken);
        return venues
            .Select(v => new VenueListItemDto(
                v.Id,
                v.Name,
                v.Address,
                v.City,
                v.Country,
                v.Seats.Count,
                v.Events.Count))
            .ToList();
    }

    public async Task<VenueListItemDto> CreateVenueAsync(CreateVenueRequest request, CancellationToken cancellationToken = default)
    {
        var venue = new Venue
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Country = request.Country.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _venueRepository.Add(venue);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new VenueListItemDto(venue.Id, venue.Name, venue.Address, venue.City, venue.Country, 0, 0);
    }

    public async Task<VenueListItemDto> UpdateVenueAsync(Guid id, UpdateVenueRequest request, CancellationToken cancellationToken = default)
    {
        var venue = await _venueRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Venue not found.");

        venue.Name = request.Name.Trim();
        venue.Address = request.Address.Trim();
        venue.City = request.City.Trim();
        venue.Country = request.Country.Trim();
        venue.UpdatedAt = DateTime.UtcNow;

        _venueRepository.Update(venue);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new VenueListItemDto(venue.Id, venue.Name, venue.Address, venue.City, venue.Country, 0, 0);
    }
}
