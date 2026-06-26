using EventManagementApp.Application.Interfaces.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EventManagementApp.Infrastructure.Tickets;

public class TicketPdfGeneratorService : ITicketPdfGenerator
{
    public TicketPdfGeneratorService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Generate(TicketPdfModel model)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A5);
                page.Header().Text("Event Ticket").FontSize(22).SemiBold();
                page.Content().Column(column =>
                {
                    column.Spacing(10);
                    column.Item().Text($"Ticket: {model.TicketCode}").FontSize(14).SemiBold();
                    column.Item().Text($"Event: {model.EventTitle}");
                    column.Item().Text($"Date: {model.EventStartDate:dddd, MMM d yyyy 'at' HH:mm} UTC");
                    column.Item().Text($"Venue: {model.VenueName}");
                    column.Item().Text($"Attendee: {model.AttendeeName}");

                    if (!string.IsNullOrWhiteSpace(model.SeatLabel))
                    {
                        column.Item().Text($"Seat: {model.SeatLabel}");
                    }

                    column.Item().PaddingTop(10).Width(140).Image(model.QrCodePng);
                    column.Item().Text("Present this QR code at check-in.").FontSize(10).Italic();
                });
                page.Footer().AlignCenter().Text("Event Management App").FontSize(9);
            });
        });

        return document.GeneratePdf();
    }
}
