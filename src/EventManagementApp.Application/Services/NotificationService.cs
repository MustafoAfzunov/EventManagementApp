using EventManagementApp.Application.DTOs.Dashboard;
using EventManagementApp.Application.DTOs.Notifications;
using EventManagementApp.Application.Interfaces;
using EventManagementApp.Application.Interfaces.Repositories;
using EventManagementApp.Application.Interfaces.Services;
using EventManagementApp.Application.Mappings;
using EventManagementApp.Domain.Enums;

namespace EventManagementApp.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IRegistrationRepository _registrationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public NotificationService(
        INotificationRepository notificationRepository,
        IRegistrationRepository registrationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _notificationRepository = notificationRepository;
        _registrationRepository = registrationRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var notifications = await _notificationRepository.GetByUserIdAsync(userId, cancellationToken);

        return notifications
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => n.ToDto())
            .ToList();
    }

    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var notification = await _notificationRepository.GetByIdForUserAsync(notificationId, userId, cancellationToken);

        if (notification is null)
        {
            throw new Common.NotFoundException("Notification not found.");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            _notificationRepository.Update(notification);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var registrations = await _registrationRepository.GetByUserIdAsync(userId, cancellationToken);
        var notifications = await _notificationRepository.GetByUserIdAsync(userId, cancellationToken);

        var active = registrations
            .Where(r => r.Status is not RegistrationStatus.Cancelled and not RegistrationStatus.Rejected)
            .ToList();

        return new DashboardSummaryDto(
            active.Count,
            active.Count(r => r.Status == RegistrationStatus.Confirmed),
            active.Count(r => r.Status == RegistrationStatus.Waitlisted),
            notifications.Count(n => !n.IsRead));
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new Common.UnauthorizedException();
    }
}
