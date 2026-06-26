using EventManagementApp.Application.Interfaces.Services;
using QRCoder;

namespace EventManagementApp.Infrastructure.Tickets;

public class QrCodeGeneratorService : IQrCodeGenerator
{
    public byte[] GeneratePng(string payload, int pixelsPerModule = 8)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(data);
        return qrCode.GetGraphic(pixelsPerModule);
    }
}
