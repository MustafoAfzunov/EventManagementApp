using EventManagementApp.Application.DTOs.Dashboard;
using EventManagementApp.Application.DTOs.Notifications;
using EventManagementApp.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementApp.API.Controllers;

[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public DashboardController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("api/dashboard/summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await _notificationService.GetDashboardSummaryAsync(cancellationToken);
        return Ok(summary);
    }

    [HttpGet("api/users/me/notifications")]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetNotifications(
        CancellationToken cancellationToken)
    {
        var notifications = await _notificationService.GetMyNotificationsAsync(cancellationToken);
        return Ok(notifications);
    }

    [HttpPatch("api/users/me/notifications/{id:guid}/read")]
    public async Task<ActionResult> MarkNotificationAsRead(Guid id, CancellationToken cancellationToken)
    {
        await _notificationService.MarkAsReadAsync(id, cancellationToken);
        return NoContent();
    }
}
