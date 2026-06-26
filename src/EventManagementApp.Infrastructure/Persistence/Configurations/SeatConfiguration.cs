using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagementApp.Infrastructure.Persistence.Configurations;

public class SeatConfiguration : IEntityTypeConfiguration<Seat>
{
    public void Configure(EntityTypeBuilder<Seat> builder)
    {
        builder.ToTable("Seats");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Section).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Row).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Number).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => new { x.VenueId, x.Section, x.Row, x.Number }).IsUnique();
        builder.HasIndex(x => new { x.VenueId, x.Status });
        builder.HasOne(x => x.Venue)
            .WithMany(x => x.Seats)
            .HasForeignKey(x => x.VenueId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
