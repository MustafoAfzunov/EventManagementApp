namespace EventManagementApp.Application.Interfaces.Services;

public interface IQrCodeGenerator
{
    byte[] GeneratePng(string payload, int pixelsPerModule = 8);
}
