using EventManagementApp.Application.DTOs.Admin;
using EventManagementApp.Application.DTOs.CheckIn;
using EventManagementApp.Domain.Enums;
using FluentValidation;

namespace EventManagementApp.Application.Validators;

public class CreateEventRequestValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.VenueId).NotEmpty();
        RuleFor(x => x.Capacity).GreaterThan(0).LessThanOrEqualTo(1_000_000);
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("End date must be after the start date.");
        RuleFor(x => x.SeatAssignmentMode)
            .Must(mode => Enum.TryParse<SeatAssignmentMode>(mode, true, out _))
            .WithMessage("Seat assignment mode must be None, Automatic, or Manual.");
        RuleFor(x => x.RegistrationClosesAt)
            .GreaterThanOrEqualTo(x => x.RegistrationOpensAt!.Value)
            .When(x => x.RegistrationOpensAt.HasValue && x.RegistrationClosesAt.HasValue)
            .WithMessage("Registration close date must be after the open date.");
    }
}

public class UpdateEventRequestValidator : AbstractValidator<UpdateEventRequest>
{
    public UpdateEventRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.VenueId).NotEmpty();
        RuleFor(x => x.Capacity).GreaterThan(0).LessThanOrEqualTo(1_000_000);
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("End date must be after the start date.");
        RuleFor(x => x.SeatAssignmentMode)
            .Must(mode => Enum.TryParse<SeatAssignmentMode>(mode, true, out _))
            .WithMessage("Seat assignment mode must be None, Automatic, or Manual.");
        RuleFor(x => x.RegistrationClosesAt)
            .GreaterThanOrEqualTo(x => x.RegistrationOpensAt!.Value)
            .When(x => x.RegistrationOpensAt.HasValue && x.RegistrationClosesAt.HasValue)
            .WithMessage("Registration close date must be after the open date.");
    }
}

public class CreateVenueRequestValidator : AbstractValidator<CreateVenueRequest>
{
    public CreateVenueRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
    }
}

public class UpdateVenueRequestValidator : AbstractValidator<UpdateVenueRequest>
{
    public UpdateVenueRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
    }
}

public class ScanTicketRequestValidator : AbstractValidator<ScanTicketRequest>
{
    public ScanTicketRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(1000);
    }
}
