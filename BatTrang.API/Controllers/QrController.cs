using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BatTrang.API.Services;

namespace BatTrang.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class QrController : ControllerBase
{
    private readonly IQrCodeService _qrCodeService;

    public QrController(IQrCodeService qrCodeService)
    {
        _qrCodeService = qrCodeService;
    }

    /// <summary>
    /// Lấy chuỗi mã QR dạng Base64 cho Sản phẩm
    /// </summary>
    [HttpGet("base64/{productId}")]
    public IActionResult GetQrBase64(string productId)
    {
        string qrPayload = $"https://battrang.app/product/{productId}";
        
        string base64Image = _qrCodeService.GenerateBase64QrCode(qrPayload);
        
        return Ok(new 
        { 
            productId = productId, 
            qrCodePayload = qrPayload,
            qrCodeBase64 = base64Image 
        });
    }

    /// <summary>
    /// Tải trực tiếp file ảnh PNG mã QR của sản phẩm
    /// </summary>
    [HttpGet("download/{productId}")]
    public IActionResult DownloadQrImage(string productId)
    {
        string qrPayload = $"https://battrang.app/product/{productId}";
        byte[] qrBytes = _qrCodeService.GenerateByteArrayQrCode(qrPayload);

        return File(qrBytes, "image/png", $"QRCode_{productId}.png");
    }
}