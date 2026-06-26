namespace EventManagementApp.Application.Interfaces.Services;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string verificationLink, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string email, string resetLink, CancellationToken cancellationToken = default);
    Task SendTicketEmailAsync(string email, string eventTitle, byte[] pdfAttachment, string ticketCode, CancellationToken cancellationToken = default);
}
