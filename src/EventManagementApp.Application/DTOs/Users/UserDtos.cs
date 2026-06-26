namespace EventManagementApp.Application.DTOs.Users;

public record UserProfileDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    bool IsEmailVerified,
    DateTime CreatedAt);

public record UserListItemDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    DateTime CreatedAt);

public record UpdateProfileRequest(string FirstName, string LastName);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
