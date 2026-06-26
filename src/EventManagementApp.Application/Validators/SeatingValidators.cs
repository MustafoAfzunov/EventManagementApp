using EventManagementApp.Application.DTOs.Seating;
using EventManagementApp.Domain.Enums;
using FluentValidation;

namespace EventManagementApp.Application.Validators;

public class SelectSeatRequestValidator : AbstractValidator<SelectSeatRequest>
{
    public SelectSeatRequestValidator()
    {
        RuleFor(x => x.SeatId).NotEmpty();
    }
}

public class BulkCreateSeatsRequestValidator : AbstractValidator<BulkCreateSeatsRequest>
{
    public BulkCreateSeatsRequestValidator()
    {
        RuleFor(x => x.Section).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Row).NotEmpty().MaximumLength(50);
        RuleFor(x => x.SeatCount).InclusiveBetween(1, 500);
        RuleFor(x => x.SeatNumberPrefix).MaximumLength(10);
    }
}

public class ConfigureEventSeatingRequestValidator : AbstractValidator<ConfigureEventSeatingRequest>
{
    public ConfigureEventSeatingRequestValidator()
    {
        RuleFor(x => x.SeatAssignmentMode)
            .Must(mode => Enum.TryParse<SeatAssignmentMode>(mode, true, out _))
            .WithMessage("Seat assignment mode must be None, Automatic, or Manual.");
    }
}
