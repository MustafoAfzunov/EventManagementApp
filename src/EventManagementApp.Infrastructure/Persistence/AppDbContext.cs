using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventManagementApp.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Speaker> Speakers => Set<Speaker>();
    public DbSet<Registration> Registrations => Set<Registration>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<SeatAssignment> SeatAssignments => Set<SeatAssignment>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<VenueLayout> VenueLayouts => Set<VenueLayout>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
