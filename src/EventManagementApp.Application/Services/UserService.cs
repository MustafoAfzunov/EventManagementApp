using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Users;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Application.Mappings;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;

    public UserService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
    }

    public async Task<UserProfileDto> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        return user.ToProfileDto();
    }

    public async Task<UserProfileDto> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);

        var firstName = UserInputNormalizer.NormalizeName(request.FirstName);
        var lastName = UserInputNormalizer.NormalizeName(request.LastName);

        if (await _userRepository.FullNameExistsAsync(firstName, lastName, user.Id, cancellationToken))
        {
            throw new ConflictException("An account with this full name already exists.");
        }

        user.FirstName = firstName;
        user.LastName = lastName;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return user.ToProfileDto();
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);

        if (!_passwordHasher.VerifyPassword(user, request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<UserListItemDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users.Select(u => u.ToListItemDto()).ToList();
    }

    public async Task<UserListItemDto> CreateUserAsAdminAsync(CreateAdminUserRequest request, CancellationToken cancellationToken = default)
    {
        var email = UserInputNormalizer.NormalizeEmail(request.Email);
        var firstName = UserInputNormalizer.NormalizeName(request.FirstName);
        var lastName = UserInputNormalizer.NormalizeName(request.LastName);

        if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var role))
        {
            throw new AppException("Role must be Attendee, EventStaff, or Admin.", 400);
        }

        if (await _userRepository.EmailExistsAsync(email, cancellationToken))
        {
            throw new ConflictException("An account with this email already exists.");
        }

        if (await _userRepository.FullNameExistsAsync(firstName, lastName, cancellationToken: cancellationToken))
        {
            throw new ConflictException("An account with this full name already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _userRepository.Add(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return user.ToListItemDto();
    }

    public async Task DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (_currentUserService.UserId == id)
        {
            throw new AppException("You cannot delete your own account.", 400);
        }

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        if (user.Role == UserRole.Admin)
        {
            var adminCount = await _userRepository.CountByRoleAsync(UserRole.Admin, cancellationToken);
            if (adminCount <= 1)
            {
                throw new AppException("Cannot delete the last admin account.", 400);
            }
        }

        _userRepository.Remove(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Domain.Entities.User> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is null)
        {
            throw new UnauthorizedException();
        }

        var user = await _userRepository.GetByIdAsync(_currentUserService.UserId.Value, cancellationToken);
        return user ?? throw new NotFoundException("User not found.");
    }
}
