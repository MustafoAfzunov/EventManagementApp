namespace EventManagementApp.Application.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalRegistrations,
    int ConfirmedRegistrations,
    int WaitlistedRegistrations,
    int UnreadNotifications);
