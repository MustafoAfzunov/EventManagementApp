using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Application.Services;
using EventManagementApp.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace EventManagementApp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRegistrationService, RegistrationService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ISeatingService, SeatingService>();
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<ICheckInService, CheckInService>();
        services.AddScoped<IAdminEventService, AdminEventService>();
        services.AddScoped<IAdminVenueService, AdminVenueService>();
        services.AddScoped<IAdminRegistrationService, AdminRegistrationService>();
        services.AddScoped<IReportingService, ReportingService>();

        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        return services;
    }
}
