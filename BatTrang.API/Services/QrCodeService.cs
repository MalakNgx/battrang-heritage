using QRCoder;

namespace BatTrang.API.Services;

public class QrCodeService : IQrCodeService
{
    public string GenerateBase64QrCode(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;

        byte[] qrBytes = GenerateByteArrayQrCode(content);
        return $"data:image/png;base64,{Convert.ToBase64String(qrBytes)}";
    }

    public byte[] GenerateByteArrayQrCode(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return Array.Empty<byte>();

        // Sử dụng PngByteQRCode để chạy mượt mà trên cross-platform (macOS / Linux / Docker)
        using QRCodeGenerator qrGenerator = new QRCodeGenerator();
        using QRCodeData qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using PngByteQRCode qrCode = new PngByteQRCode(qrCodeData);
        
        // pixelsPerModule: 20 -> Kích thước hình ảnh sắc nét
        return qrCode.GetGraphic(20);
    }
}