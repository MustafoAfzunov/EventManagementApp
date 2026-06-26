using System.Security.Cryptography;
using System.Text.Json;
using EventManagementApp.Application.Common;
using EventManagementApp.Application.DTOs.Tickets;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Domain.Entities;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class TicketService : ITicketService
{
    private readonly ITicketRepository _ticketRepository;
    private readonly IRegistrationRepository _registrationRepository;
    private readonly ISeatRepository _seatRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly IQrCodeGenerator _qrCodeGenerator;
    private readonly ITicketPdfGenerator _ticketPdfGenerator;

    public TicketService(
        ITicketRepository ticketRepository,
        IRegistrationRepository registrationRepository,
        ISeatRepository seatRepository,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IEmailService emailService,
        IQrCodeGenerator qrCodeGenerator,
        ITicketPdfGenerator ticketPdfGenerator)
    {
        _ticketRepository = ticketRepository;
        _registrationRepository = registrationRepository;
        _seatRepository = seatRepository;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _emailService = emailService;
        _qrCodeGenerator = qrCodeGenerator;
        _ticketPdfGenerator = ticketPdfGenerator;
    }

    public async Task<TicketDto> IssueTicketForRegistrationAsync(
        Guid registrationId,
        CancellationToken cancellationToken = default)
    {
        var registration = await _registrationRepository.GetByIdWithDetailsAsync(registrationId, cancellationToken);
        if (registration is null)
        {
            throw new NotFoundException("Registration not found.");
        }

        if (registration.Status != RegistrationStatus.Confirmed)
        {
            throw new AppException("Tickets can only be issued for confirmed registrations.", 400);
        }

        var existing = await _ticketRepository.GetByRegistrationIdAsync(registrationId, cancellationToken);
        if (existing is not null && existing.Status == TicketStatus.Active)
        {
            return MapTicket(existing, registration);
        }

        if (registration.Event.RequiresSeating)
        {
            var assignment = await _seatRepository.GetAssignmentByRegistrationIdAsync(registrationId, cancellationToken);
            if (assignment is null)
            {
                throw new AppException("A seat must be assigned before a ticket can be issued.", 400);
            }
        }

        var ticketCode = await GenerateUniqueTicketCodeAsync(cancellationToken);
        var ticketId = Guid.NewGuid();
        var qrPayload = JsonSerializer.Serialize(new
        {
            ticketId,
            ticketCode,
            registrationId = registration.Id,
            eventId = registration.EventId
        });

        var ticket = new Ticket
        {
            Id = ticketId,
            RegistrationId = registration.Id,
            TicketCode = ticketCode,
            QrPayload = qrPayload,
            IssuedAt = DateTime.UtcNow,
            Status = TicketStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _ticketRepository.Add(ticket);
        _notificationRepository.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = registration.UserId,
            Title = "Ticket issued",
            Message = $"Your ticket for '{registration.Event.Title}' is ready.",
            Type = NotificationType.TicketIssued,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        registration = await _registrationRepository.GetByIdWithDetailsAsync(registrationId, cancellationToken)
            ?? registration;

        return MapTicket(ticket, registration);
    }

    public async Task<TicketDto?> GetTicketAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null || ticket.Status != TicketStatus.Active)
        {
            return null;
        }

        EnsureTicketOwner(ticket.Registration.UserId);
        return MapTicket(ticket, ticket.Registration);
    }

    public async Task<TicketDto?> GetTicketByRegistrationAsync(
        Guid registrationId,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException();
        var registration = await _registrationRepository.GetByIdAsync(registrationId, cancellationToken);
        if (registration is null || registration.UserId != userId)
        {
            throw new NotFoundException("Registration not found.");
        }

        var ticket = await _ticketRepository.GetByRegistrationIdAsync(registrationId, cancellationToken);
        if (ticket is null || ticket.Status != TicketStatus.Active)
        {
            return null;
        }

        registration = await _registrationRepository.GetByIdWithDetailsAsync(registrationId, cancellationToken)
            ?? registration;

        return MapTicket(ticket, registration);
    }

    public async Task<byte[]> GenerateTicketPdfAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketForOwnerAsync(ticketId, cancellationToken);
        var registration = ticket.Registration;
        var seatLabel = await GetSeatLabelAsync(registration.Id, cancellationToken);
        var qrPng = _qrCodeGenerator.GeneratePng(ticket.QrPayload);

        return _ticketPdfGenerator.Generate(new TicketPdfModel(
            ticket.TicketCode,
            registration.Event.Title,
            registration.Event.StartDate,
            registration.Event.Venue.Name,
            $"{registration.User.FirstName} {registration.User.LastName}",
            seatLabel,
            qrPng));
    }

    public async Task SendTicketEmailAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketForOwnerAsync(ticketId, cancellationToken);
        var pdf = await GenerateTicketPdfAsync(ticketId, cancellationToken);
        await _emailService.SendTicketEmailAsync(
            ticket.Registration.User.Email,
            ticket.Registration.Event.Title,
            pdf,
            ticket.TicketCode,
            cancellationToken);
    }

    public async Task CancelTicketForRegistrationAsync(Guid registrationId, CancellationToken cancellationToken = default)
    {
        var ticket = await _ticketRepository.GetByRegistrationIdAsync(registrationId, cancellationToken);
        if (ticket is null || ticket.Status == TicketStatus.Cancelled)
        {
            return;
        }

        ticket.Status = TicketStatus.Cancelled;
        ticket.UpdatedAt = DateTime.UtcNow;
        _ticketRepository.Update(ticket);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Ticket> GetTicketForOwnerAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        var ticket = await _ticketRepository.GetByIdAsync(ticketId, cancellationToken);
        if (ticket is null || ticket.Status != TicketStatus.Active)
        {
            throw new NotFoundException("Ticket not found.");
        }

        EnsureTicketOwner(ticket.Registration.UserId);
        return ticket;
    }

    private void EnsureTicketOwner(Guid ownerUserId)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException();
        if (userId != ownerUserId)
        {
            throw new NotFoundException("Ticket not found.");
        }
    }

    private async Task<string?> GetSeatLabelAsync(Guid registrationId, CancellationToken cancellationToken)
    {
        var assignment = await _seatRepository.GetAssignmentByRegistrationIdAsync(registrationId, cancellationToken);
        if (assignment is null)
        {
            return null;
        }

        return $"{assignment.Seat.Section}-{assignment.Seat.Row}-{assignment.Seat.Number}";
    }

    private async Task<string> GenerateUniqueTicketCodeAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var code = $"EVT-{RandomNumberGenerator.GetInt32(100000, 999999)}-{Convert.ToHexString(RandomNumberGenerator.GetBytes(3))}";
            if (!await _ticketRepository.TicketCodeExistsAsync(code, cancellationToken))
            {
                return code;
            }
        }

        return $"EVT-{Guid.NewGuid():N}"[..20].ToUpperInvariant();
    }

    private static TicketDto MapTicket(Ticket ticket, Registration registration)
    {
        string? seatLabel = null;
        if (registration.SeatAssignment?.Seat is not null)
        {
            var seat = registration.SeatAssignment.Seat;
            seatLabel = $"{seat.Section}-{seat.Row}-{seat.Number}";
        }

        return new TicketDto(
            ticket.Id,
            registration.Id,
            registration.EventId,
            registration.Event.Title,
            registration.Event.StartDate,
            $"{registration.User.FirstName} {registration.User.LastName}",
            ticket.TicketCode,
            ticket.QrPayload,
            seatLabel,
            ticket.IssuedAt,
            ticket.Status.ToString());
    }
}
