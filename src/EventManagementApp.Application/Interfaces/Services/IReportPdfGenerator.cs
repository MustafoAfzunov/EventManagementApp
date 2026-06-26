namespace EventManagementApp.Application.Interfaces.Services;

public interface IReportPdfGenerator
{
    byte[] GenerateAttendeeList(AttendeeListPdfModel model);
}

public record AttendeeListPdfModel(
    string EventTitle,
    DateTime EventStartDate,
    string VenueName,
    DateTime GeneratedAt,
    IReadOnlyList<AttendeeListPdfRow> Rows);

public record AttendeeListPdfRow(
    string AttendeeName,
    string AttendeeEmail,
    string Status,
    string? SeatLabel,
    bool CheckedIn);
