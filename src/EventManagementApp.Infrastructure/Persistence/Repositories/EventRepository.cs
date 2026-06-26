using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.Events;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class EventRepository : IEventRepository
{
    private readonly AppDbContext _context;

    public EventRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Event?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Events.AsQueryable();

        if (includeDetails)
        {
            query = query
                .Include(e => e.Venue)
                .Include(e => e.Speakers);
        }

        return query.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Event>> GetPublishedEventsAsync(
        EventQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Events
            .AsNoTracking()
            .Include(e => e.Venue)
            .Where(e => e.Status == EventStatus.Published);

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(search) ||
                e.Description.ToLower().Contains(search) ||
                e.Category.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(parameters.Category))
        {
            query = query.Where(e => e.Category == parameters.Category);
        }

        if (parameters.VenueId.HasValue)
        {
            query = query.Where(e => e.VenueId == parameters.VenueId.Value);
        }

        if (parameters.FromDate.HasValue)
        {
            query = query.Where(e => e.StartDate >= parameters.FromDate.Value);
        }

        if (parameters.ToDate.HasValue)
        {
            query = query.Where(e => e.StartDate <= parameters.ToDate.Value);
        }

        query = query.OrderBy(e => e.StartDate);

        var page = Math.Max(1, parameters.Page);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 50);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Event>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<IReadOnlyList<Event>> GetFeaturedEventsAsync(int limit, CancellationToken cancellationToken = default)
    {
        return await _context.Events
            .AsNoTracking()
            .Include(e => e.Venue)
            .Where(e => e.Status == EventStatus.Published && e.IsFeatured && e.StartDate >= DateTime.UtcNow)
            .OrderBy(e => e.StartDate)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Event>> GetUpcomingEventsAsync(int limit, CancellationToken cancellationToken = default)
    {
        return await _context.Events
            .AsNoTracking()
            .Include(e => e.Venue)
            .Where(e => e.Status == EventStatus.Published && e.StartDate >= DateTime.UtcNow)
            .OrderBy(e => e.StartDate)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetConfirmedRegistrationCountAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return _context.Registrations.CountAsync(
            r => r.EventId == eventId && r.Status == RegistrationStatus.Confirmed,
            cancellationToken);
    }

    public async Task<PagedResult<Event>> GetAllAsync(
        AdminEventQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Events
            .AsNoTracking()
            .Include(e => e.Venue)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(search) ||
                e.Category.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(parameters.Status)
            && Enum.TryParse<EventStatus>(parameters.Status, true, out var status))
        {
            query = query.Where(e => e.Status == status);
        }

        query = query.OrderByDescending(e => e.CreatedAt);

        var page = Math.Max(1, parameters.Page);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 50);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Event>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<IReadOnlyList<Event>> GetAllWithVenueAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Events
            .AsNoTracking()
            .Include(e => e.Venue)
            .OrderBy(e => e.StartDate)
            .ToListAsync(cancellationToken);
    }

    public void Add(Event eventEntity) => _context.Events.Add(eventEntity);

    public void Update(Event eventEntity) => _context.Events.Update(eventEntity);

    public void Remove(Event eventEntity) => _context.Events.Remove(eventEntity);
}
