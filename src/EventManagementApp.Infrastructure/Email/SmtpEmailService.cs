using EventManagementApp.Application.Common;
using EventManagementApp.Application.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace EventManagementApp.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public Task SendEmailVerificationAsync(string email, string verificationLink, CancellationToken cancellationToken = default)
    {
        const string subject = "Verify your email address";
        var body = $"""
            <p>Hello,</p>
            <p>Thank you for registering with Event Management App.</p>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="{verificationLink}">Verify my email</a></p>
            <p>Or copy this link into your browser:</p>
            <p>{verificationLink}</p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not create an account, you can ignore this email.</p>
            """;

        return SendAsync(email, subject, body, cancellationToken);
    }

    public Task SendPasswordResetEmailAsync(string email, string resetLink, CancellationToken cancellationToken = default)
    {
        const string subject = "Reset your password";
        var body = $"""
            <p>Hello,</p>
            <p>We received a request to reset your password.</p>
            <p><a href="{resetLink}">Reset my password</a></p>
            <p>Or copy this link into your browser:</p>
            <p>{resetLink}</p>
            <p>If you did not request a password reset, you can ignore this email.</p>
            """;

        return SendAsync(email, subject, body, cancellationToken);
    }

    public Task SendTicketEmailAsync(
        string email,
        string eventTitle,
        byte[] pdfAttachment,
        string ticketCode,
        CancellationToken cancellationToken = default)
    {
        const string subjectPrefix = "Your event ticket";
        var subject = $"{subjectPrefix} — {eventTitle}";
        var body = $"""
            <p>Hello,</p>
            <p>Your ticket for <strong>{eventTitle}</strong> is attached.</p>
            <p>Ticket code: <strong>{ticketCode}</strong></p>
            <p>Please bring this ticket (or the QR code inside the PDF) to the event check-in.</p>
            """;

        return SendWithAttachmentAsync(email, subject, body, pdfAttachment, $"ticket-{ticketCode}.pdf", cancellationToken);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        await SendWithAttachmentAsync(toEmail, subject, htmlBody, null, null, cancellationToken);
    }

    private async Task SendWithAttachmentAsync(
        string toEmail,
        string subject,
        string htmlBody,
        byte[]? attachment,
        string? attachmentFileName,
        CancellationToken cancellationToken)
    {
        if (!_settings.IsConfigured)
        {
            _logger.LogWarning(
                "SMTP is not configured. Email to {Email} was NOT sent. Subject: {Subject}. " +
                "Configure Smtp section in appsettings (Host, Username, Password, FromEmail).",
                toEmail,
                subject);
            _logger.LogInformation("Email body preview for {Email}: {Body}", toEmail, htmlBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        if (attachment is not null && !string.IsNullOrWhiteSpace(attachmentFileName))
        {
            builder.Attachments.Add(attachmentFileName, attachment);
        }

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_settings.Host, _settings.Port, GetSecureSocketOptions(), cancellationToken);
            await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent to {Email}. Subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}. Subject: {Subject}", toEmail, subject);
            throw new InvalidOperationException($"Failed to send email to {toEmail}. Check SMTP settings.", ex);
        }
    }

    private SecureSocketOptions GetSecureSocketOptions()
    {
        if (_settings.Port == 465)
        {
            return SecureSocketOptions.SslOnConnect;
        }

        return _settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
    }
}
