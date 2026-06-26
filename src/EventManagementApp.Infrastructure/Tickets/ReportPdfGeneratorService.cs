using EventManagementApp.Application.Interfaces.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EventManagementApp.Infrastructure.Tickets;

public class ReportPdfGeneratorService : IReportPdfGenerator
{
    public ReportPdfGeneratorService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateAttendeeList(AttendeeListPdfModel model)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);

                page.Header().Column(column =>
                {
                    column.Item().Text("Attendee List").FontSize(20).SemiBold();
                    column.Item().Text(model.EventTitle).FontSize(14);
                    column.Item().Text($"{model.EventStartDate:dddd, MMM d yyyy 'at' HH:mm} UTC  -  {model.VenueName}")
                        .FontSize(10).FontColor(Colors.Grey.Darken1);
                    column.Item().Text($"Total attendees: {model.Rows.Count}").FontSize(10);
                });

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(4);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderCellStyle).Text("Name").SemiBold();
                        header.Cell().Element(HeaderCellStyle).Text("Email").SemiBold();
                        header.Cell().Element(HeaderCellStyle).Text("Status").SemiBold();
                        header.Cell().Element(HeaderCellStyle).Text("Seat").SemiBold();
                        header.Cell().Element(HeaderCellStyle).Text("Checked In").SemiBold();
                    });

                    foreach (var row in model.Rows)
                    {
                        table.Cell().Element(BodyCellStyle).Text(row.AttendeeName).FontSize(10);
                        table.Cell().Element(BodyCellStyle).Text(row.AttendeeEmail).FontSize(10);
                        table.Cell().Element(BodyCellStyle).Text(row.Status).FontSize(10);
                        table.Cell().Element(BodyCellStyle).Text(string.IsNullOrWhiteSpace(row.SeatLabel) ? "-" : row.SeatLabel!).FontSize(10);
                        table.Cell().Element(BodyCellStyle).Text(row.CheckedIn ? "Yes" : "No").FontSize(10);
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Generated ");
                    text.Span($"{model.GeneratedAt:u}").SemiBold();
                    text.Span("  -  Event Management App");
                });
            });
        });

        return document.GeneratePdf();
    }

    private static IContainer HeaderCellStyle(IContainer container)
        => container.BorderBottom(1).BorderColor(Colors.Grey.Medium).PaddingVertical(4);

    private static IContainer BodyCellStyle(IContainer container)
        => container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(3);
}
