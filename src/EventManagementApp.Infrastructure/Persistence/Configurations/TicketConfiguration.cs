using EventManagementApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagementApp.Infrastructure.Persistence.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("Tickets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TicketCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.QrPayload).HasMaxLength(1000).IsRequired();
        builder.HasIndex(x => x.TicketCode).IsUnique();
        builder.HasIndex(x => x.RegistrationId).IsUnique();
        builder.HasOne(x => x.Registration)
            .WithOne(x => x.Ticket)
            .HasForeignKey<Ticket>(x => x.RegistrationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
