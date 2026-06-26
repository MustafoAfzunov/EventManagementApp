namespace EventManagementApp.Application.DTOs.Auth;

public record RegisterRequest(string Email, string Password, string FirstName, string LastName);

public record LoginRequest(string Email, string Password);

public record RegisterResponse(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    bool IsEmailVerified,
    string Message);

public record AuthResponse(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    bool IsEmailVerified,
    string AccessToken,
    DateTime ExpiresAt);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword);

public record ResendVerificationRequest(string Email);

public record MessageResponse(string Message);
