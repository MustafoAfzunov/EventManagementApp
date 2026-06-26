using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Auth;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using FluentValidation;

namespace EventManagementApp.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator(
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

        RuleFor(x => x)
            .MustAsync(async (request, cancellationToken) =>
                !await userRepository.FullNameExistsAsync(
                    request.FirstName,
                    request.LastName,
                    cancellationToken: cancellationToken))
            .WithMessage("An account with this full name already exists.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator(IEmailVerificationService emailVerificationService)
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .Must(email => emailVerificationService.VerifyFormat(email).IsValid)
            .WithMessage(EmailVerificationMessages.InvalidFormat);
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator(IEmailVerificationService emailVerificationService)
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .Must(email => emailVerificationService.VerifyFormat(email).IsValid)
            .WithMessage(EmailVerificationMessages.InvalidFormat);
    }
}

public class ResendVerificationRequestValidator : AbstractValidator<ResendVerificationRequest>
{
    public ResendVerificationRequestValidator(IEmailVerificationService emailVerificationService)
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .Must(email => emailVerificationService.VerifyFormat(email).IsValid)
            .WithMessage(EmailVerificationMessages.InvalidFormat);
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(100);
    }
}
