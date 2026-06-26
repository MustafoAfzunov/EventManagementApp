using EventManagementApp.Application.DTOs.Users;

namespace EventManagementApp.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserProfileDto> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserListItemDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);
}
