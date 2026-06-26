using EventManagementApp.Domain.Entities;

namespace EventManagementApp.Application.Interfaces.Services;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}
