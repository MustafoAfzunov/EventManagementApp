using System.Text;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Infrastructure.Auth;
using EventManagementApp.Infrastructure.Email;
using EventManagementApp.Application.Common;
using EventManagementApp.Infrastructure.EmailVerification;
using EventManagementApp.Infrastructure.Identity;
using EventManagementApp.Infrastructure.Tickets;
using EventManagementApp.Infrastructure.Persistence;
using EventManagementApp.Infrastructure.Persistence.Repositories;
using EventManagementApp.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace EventManagementApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<EmailVerificationSettings>(configuration.GetSection(EmailVerificationSettings.SectionName));
        services.Configure<SeatingSettings>(configuration.GetSection(SeatingSettings.SectionName));

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<IRegistrationRepository, RegistrationRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ISeatRepository, SeatRepository>();
        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<IVenueRepository, VenueRepository>();
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<ISpeakerRepository, SpeakerRepository>();

        services.AddScoped<IPasswordHasher, PasswordHasherService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IEmailVerificationService, EmailVerificationService>();
        services.AddScoped<IDnsMxRecordChecker, DnsMxRecordChecker>();
        services.AddScoped<IQrCodeGenerator, QrCodeGeneratorService>();
        services.AddScoped<ITicketPdfGenerator, TicketPdfGeneratorService>();
        services.AddScoped<IReportPdfGenerator, ReportPdfGeneratorService>();
        services.AddHttpContextAccessor();

        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException("JWT settings are not configured.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorization();

        return services;
    }
}
