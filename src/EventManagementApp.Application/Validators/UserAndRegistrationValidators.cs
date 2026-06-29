using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Registrations;
using EventManagementApp.Application.DTOs.Users;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;

namespace EventManagementApp.Application.Validators;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(100);
    }
}

public class CreateAdminUserRequestValidator : AbstractValidator<CreateAdminUserRequest>
{
    private static readonly string[] AllowedRoles = ["Attendee", "EventStaff", "Admin"];

    public CreateAdminUserRequestValidator(
        IUserRepository userRepository,
        IEmailVerificationService emailVerificationService)
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(256)
            .CustomAsync(async (email, context, cancellationToken) =>
            {
                var validation = await emailVerificationService.ValidateEmailAsync(email, cancellationToken);
                if (!validation.IsValid)
                {
                    context.AddFailure(validation.ErrorMessage ?? EmailVerificationMessages.InvalidFormat);
                    return;
                }

                if (await userRepository.EmailExistsAsync(email, cancellationToken))
                {
                    context.AddFailure("An account with this email already exists.");
                }
            });

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(100).WithMessage("Password must not exceed 100 characters.");

        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required.").MaximumLength(100);

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(role => AllowedRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Role must be Attendee, EventStaff, or Admin.");

        RuleFor(x => x)
            .MustAsync(async (request, cancellationToken) =>
                !await userRepository.FullNameExistsAsync(
                    request.FirstName,
                    request.LastName,
                    cancellationToken: cancellationToken))
            .WithMessage("An account with this full name already exists.");
    }
}

public class CreateRegistrationRequestValidator : AbstractValidator<CreateRegistrationRequest>
{
    public CreateRegistrationRequestValidator()
    {
        RuleFor(x => x.EventId).NotEmpty();
    }
}
