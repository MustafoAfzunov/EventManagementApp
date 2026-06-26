using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Infrastructure.Persistence.Repositories;

public class SpeakerRepository : ISpeakerRepository
{
    private readonly AppDbContext _context;

    public SpeakerRepository(AppDbContext context)
    {
        _context = context;
    }

    public void Add(Speaker speaker) => _context.Speakers.Add(speaker);

    public void RemoveRange(IEnumerable<Speaker> speakers) => _context.Speakers.RemoveRange(speakers);
}
