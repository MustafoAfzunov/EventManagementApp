using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagementApp.Infrastructure.Persistence.Configurations;

public class VenueLayoutConfiguration : IEntityTypeConfiguration<VenueLayout>
{
    public void Configure(EntityTypeBuilder<VenueLayout> builder)
    {
        builder.ToTable("VenueLayouts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SectionsJson).HasMaxLength(4000).IsRequired();
        builder.HasIndex(x => x.VenueId).IsUnique();
        builder.HasOne(x => x.Venue)
            .WithOne(x => x.Layout)
            .HasForeignKey<VenueLayout>(x => x.VenueId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
