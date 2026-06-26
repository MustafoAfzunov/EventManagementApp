using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagementApp.Infrastructure.Persistence.Configurations;

public class SeatAssignmentConfiguration : IEntityTypeConfiguration<SeatAssignment>
{
    public void Configure(EntityTypeBuilder<SeatAssignment> builder)
    {
        builder.ToTable("SeatAssignments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.RegistrationId).IsUnique();
        builder.HasIndex(x => x.SeatId).IsUnique();
        builder.HasOne(x => x.Registration)
            .WithOne(x => x.SeatAssignment)
            .HasForeignKey<SeatAssignment>(x => x.RegistrationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Seat)
            .WithOne(x => x.Assignment)
            .HasForeignKey<SeatAssignment>(x => x.SeatId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
