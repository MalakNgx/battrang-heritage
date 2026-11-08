namespace BatTrang.API.Services;

public interface IQrCodeService
{
    /// <summary>
    /// Sinh mã QR dưới dạng chuỗi Data URL Base64 (PNG)
    /// Có thể dùng trực tiếp làm thuộc tính src cho thẻ <img> trên Frontend Next.js
    /// </summary>
    string GenerateBase64QrCode(string content);

    /// <summary>
    /// Sinh mã QR dạng mảng Byte (phục vụ download file ảnh PNG)
    /// </summary>
    byte[] GenerateByteArrayQrCode(string content);
}