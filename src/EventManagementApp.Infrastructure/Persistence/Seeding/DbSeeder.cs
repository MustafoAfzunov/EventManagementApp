using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;
using EventManagementApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EventManagementApp.Infrastructure.Persistence.Seeding;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await context.Database.MigrateAsync();

        var seedEnabled = configuration.GetValue("Seed:Enabled", true);
        if (!seedEnabled)
        {
            logger.LogInformation("Seeding is disabled (Seed:Enabled = false).");
            return;
        }

        if (await context.Users.AnyAsync())
        {
            logger.LogInformation("Database already contains data. Skipping seed.");
            return;
        }

        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var now = DateTime.UtcNow;

        var admin = CreateUser(passwordHasher, "admin@uca.test", "Site", "Administrator", UserRole.Admin, "Admin@12345", now);
        var staff = CreateUser(passwordHasher, "staff@uca.test", "Event", "Staff", UserRole.EventStaff, "Staff@12345", now);
        var attendee = CreateUser(passwordHasher, "attendee@uca.test", "Alex", "Attendee", UserRole.Attendee, "Attendee@12345", now);
        context.Users.AddRange(admin, staff, attendee);

        // ── Venues across the three UCA campuses ────────────────────────────────
        var khorogAuditorium = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "UCA Khorog Campus Grand Hall",
            Address = "Administrative Building, Grand Hall",
            City = "Khorog",
            Country = "Tajikistan",
            CreatedAt = now
        };

        var narynAuditorium = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "Main Auditorium",
            Address = "Academic Building, Level 2",
            City = "Naryn",
            Country = "Kyrgyzstan",
            CreatedAt = now
        };

        var bishkekPlaza = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "Central Square Plaza",
            Address = "Central Campus Square",
            City = "Bishkek",
            Country = "Kyrgyzstan",
            CreatedAt = now
        };

        var senateHall = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "Senate Research Hall",
            Address = "Research Wing, Block C",
            City = "Khorog",
            Country = "Tajikistan",
            CreatedAt = now
        };

        var athleticCenter = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "Campus Athletic Center",
            Address = "Sports Complex",
            City = "Naryn",
            Country = "Kyrgyzstan",
            CreatedAt = now
        };

        var libraryLab = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "Library Learning Lab",
            Address = "Central Library, Ground Floor",
            City = "Bishkek",
            Country = "Kyrgyzstan",
            CreatedAt = now
        };

        var careerHub = new Venue
        {
            Id = Guid.NewGuid(),
            Name = "Career Center Hub",
            Address = "Student Services Building",
            City = "Naryn",
            Country = "Kyrgyzstan",
            CreatedAt = now
        };

        context.Venues.AddRange(
            khorogAuditorium, narynAuditorium, bishkekPlaza,
            senateHall, athleticCenter, libraryLab, careerHub);

        // ── Seats for venues that use assigned seating ──────────────────────────
        var seats = new List<Seat>();
        foreach (var venueId in new[] { narynAuditorium.Id, khorogAuditorium.Id, senateHall.Id })
        {
            foreach (var row in new[] { "A", "B", "C", "D", "E", "F" })
            {
                for (var number = 1; number <= 12; number++)
                {
                    seats.Add(new Seat
                    {
                        Id = Guid.NewGuid(),
                        VenueId = venueId,
                        Section = "Main",
                        Row = row,
                        Number = number.ToString(),
                        Status = SeatStatus.Available,
                        CreatedAt = now
                    });
                }
            }
        }
        context.Seats.AddRange(seats);

        const string imgSummit = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";
        const string imgTech = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
        const string imgCulture = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";
        const string imgResearch = "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80";
        const string imgSports = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80";
        const string imgWorkshop = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80";
        const string imgCareer = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80";

        const string face1 = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80";
        const string face2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";
        const string face3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80";

        var events = new List<Event>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Regional Sustainable Development Summit",
                Description = "A three-day summit bringing together global thought leaders, regional policy makers, and innovative researchers to discuss sustainable growth in Central Asia's mountainous territories. Sessions span economic resilience, environmental preservation, and social equity.",
                Category = "Academic",
                ImageUrl = imgSummit,
                StartDate = now.AddDays(18),
                EndDate = now.AddDays(20).AddHours(8),
                Capacity = 72,
                Status = EventStatus.Published,
                IsFeatured = true,
                RequiresSeating = true,
                SeatAssignmentMode = SeatAssignmentMode.Manual,
                RequiresApproval = false,
                VenueId = khorogAuditorium.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now,
                Speakers =
                [
                    new Speaker { Id = Guid.NewGuid(), Name = "Dr. Elena Volkov", Title = "Director of Environmental Research", Bio = "Leading expert in mountain ecology and sustainable land use.", ImageUrl = face3, CreatedAt = now },
                    new Speaker { Id = Guid.NewGuid(), Name = "Markus Thier", Title = "UN Regional Coordinator", Bio = "Diplomat with 20 years of experience across Central Asia.", ImageUrl = face2, CreatedAt = now }
                ]
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Global Tech Symposium",
                Description = "Annual technology symposium covering AI, cloud, and the future of computing in higher education.",
                Category = "Technology",
                ImageUrl = imgTech,
                StartDate = now.AddDays(24),
                EndDate = now.AddDays(24).AddHours(8),
                Capacity = 72,
                Status = EventStatus.Published,
                IsFeatured = true,
                RequiresSeating = true,
                SeatAssignmentMode = SeatAssignmentMode.Automatic,
                RequiresApproval = false,
                VenueId = narynAuditorium.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now,
                Speakers =
                [
                    new Speaker { Id = Guid.NewGuid(), Name = "Dr. Mira Khan", Title = "AI Researcher", Bio = "Leads applied AI research at the Innovation Lab.", ImageUrl = face1, CreatedAt = now }
                ]
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Annual Cultural Integration Fair",
                Description = "A celebration of the cultures across Central Asia with food, music, and performances.",
                Category = "Cultural",
                ImageUrl = imgCulture,
                StartDate = now.AddDays(26),
                EndDate = now.AddDays(26).AddHours(6),
                Capacity = 1000,
                Status = EventStatus.Published,
                IsFeatured = true,
                RequiresSeating = false,
                SeatAssignmentMode = SeatAssignmentMode.None,
                RequiresApproval = false,
                VenueId = bishkekPlaza.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Bio-Tech Innovation Symposium",
                Description = "Researchers present breakthroughs in biotechnology and life sciences.",
                Category = "Research",
                ImageUrl = imgResearch,
                StartDate = now.AddDays(28),
                EndDate = now.AddDays(28).AddHours(8),
                Capacity = 72,
                Status = EventStatus.Published,
                IsFeatured = false,
                RequiresSeating = true,
                SeatAssignmentMode = SeatAssignmentMode.Automatic,
                RequiresApproval = false,
                VenueId = senateHall.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Inter-Departmental Basketball Finals",
                Description = "The championship game of the inter-departmental basketball league.",
                Category = "Sports",
                ImageUrl = imgSports,
                StartDate = now.AddDays(32),
                EndDate = now.AddDays(32).AddHours(3),
                Capacity = 500,
                Status = EventStatus.Published,
                IsFeatured = false,
                RequiresSeating = false,
                SeatAssignmentMode = SeatAssignmentMode.None,
                RequiresApproval = false,
                VenueId = athleticCenter.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Research Paper Writing Workshop",
                Description = "A hands-on workshop on academic writing and publishing. Seats are limited and require organizer approval.",
                Category = "Workshop",
                ImageUrl = imgWorkshop,
                StartDate = now.AddDays(12),
                EndDate = now.AddDays(12).AddHours(3),
                Capacity = 30,
                Status = EventStatus.Published,
                IsFeatured = false,
                RequiresSeating = false,
                SeatAssignmentMode = SeatAssignmentMode.None,
                RequiresApproval = true,
                VenueId = libraryLab.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Tech Career Networking Evening",
                Description = "Meet recruiters and alumni from leading technology companies.",
                Category = "Career",
                ImageUrl = imgCareer,
                StartDate = now.AddDays(34),
                EndDate = now.AddDays(34).AddHours(3),
                Capacity = 150,
                Status = EventStatus.Published,
                IsFeatured = false,
                RequiresSeating = false,
                SeatAssignmentMode = SeatAssignmentMode.None,
                RequiresApproval = false,
                VenueId = careerHub.Id,
                PublishedAt = now,
                CreatedByUserId = admin.Id,
                CreatedAt = now
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Career Fair (Draft)",
                Description = "A draft event not yet visible to the public.",
                Category = "Career",
                ImageUrl = imgCareer,
                StartDate = now.AddDays(45),
                EndDate = now.AddDays(45).AddHours(6),
                Capacity = 200,
                Status = EventStatus.Draft,
                IsFeatured = false,
                RequiresSeating = false,
                SeatAssignmentMode = SeatAssignmentMode.None,
                RequiresApproval = false,
                VenueId = careerHub.Id,
                CreatedByUserId = admin.Id,
                CreatedAt = now
            }
        };

        context.Events.AddRange(events);

        await context.SaveChangesAsync();

        logger.LogInformation(
            "Seeded sample data. Logins -> admin@uca.test / Admin@12345 (Admin), " +
            "staff@uca.test / Staff@12345 (EventStaff), attendee@uca.test / Attendee@12345 (Attendee).");
    }

    private static User CreateUser(
        IPasswordHasher passwordHasher,
        string email,
        string firstName,
        string lastName,
        UserRole role,
        string password,
        DateTime now)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            IsEmailVerified = true,
            CreatedAt = now
        };

        user.PasswordHash = passwordHasher.HashPassword(user, password);
        return user;
    }
}
