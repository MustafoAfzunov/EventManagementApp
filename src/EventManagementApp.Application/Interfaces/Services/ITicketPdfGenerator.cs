using EventManagementApp.Application.DTOs.Tickets;

namespace EventManagementApp.Application.Interfaces.Services;

public interface ITicketPdfGenerator
{
    byte[] Generate(TicketPdfModel model);
}

public record TicketPdfModel(
    string TicketCode,
    string EventTitle,
    DateTime EventStartDate,
    string VenueName,
    string AttendeeName,
    string? SeatLabel,
    byte[] QrCodePng);
