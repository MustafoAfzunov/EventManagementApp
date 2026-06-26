using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Repositories;

public interface ISpeakerRepository
{
    void Add(Speaker speaker);
    void RemoveRange(IEnumerable<Speaker> speakers);
}
