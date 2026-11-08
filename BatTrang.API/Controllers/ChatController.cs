using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BatTrang.API.Data;
using BatTrang.API.Services;

namespace BatTrang.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GeminiRagService _ragService;

    public ChatController(AppDbContext context, GeminiRagService ragService)
    {
        _context = context;
        _ragService = ragService;
    }

    // 1. API Lấy chi tiết thông tin sản phẩm gốm theo ProductID
    [HttpGet("product/{productId}")]

    public async Task<IActionResult> GetProduct(string productId)
    {
        var product = await _context.Products
            .Include(p => p.CulturalProfile)
            .FirstOrDefaultAsync(p => p.ProductID == productId);

        if (product == null) return NotFound("Không tìm thấy sản phẩm gốm này.");
        return Ok(product);
    }
    [HttpGet("get-product-info")]
    public IActionResult GetProductInfo(string productId)
    {
        // Tạm thời mock 1 sản phẩm SP001 để test thông luồng Frontend
        if (productId.ToUpper() != "SP001")
        {
            return NotFound(new { message = $"Không tìm thấy sản phẩm: {productId}" });
        }

        // Dữ liệu này được thiết kế khớp với hàm normalizeApiData() bên Frontend
        var responseData = new 
        {
            productId = "SP001",
            productName = "Bình hoa gốm men rạn Hoa Sen cổ",
            category = "Gốm men rạn",
            thumbnailUrl = "https://picsum.photos/400", // Link ảnh placeholder tạm thời
            culturalProfile = new 
            {
                IdentityLayer = "Bình hoa dáng củ tỏi gốm sứ Bát Tràng cao 35cm, phủ men rạn giả cổ.",
                SymbolismLayer = "Họa tiết Hoa Sen tượng trưng cho sự thanh cao, tinh khiết trong văn hóa Việt.",
                CraftsmanshipLayer = "Được đắp nổi hoa văn thủ công, nung liên tục ở nhiệt độ 1.300°C trong lò bầu.",
                ArtisanStory = "Do Nghệ nhân Ưu tú Trần Văn A chế tác từ ký ức đầm sen mùa hạ.",
                CulturalConnection = "So với hoa sen mang tính thiền của Nhật, hoa sen Việt mang đậm nét đời thường, tươi sáng."
            }
        };

        return Ok(responseData);
    }

    // 2. API Nhận câu hỏi du khách -> Truy xuất dữ liệu DB -> Gọi Gemini RAG trả lời
    [HttpPost("ask")]
    
    public async Task<IActionResult> Ask([FromBody] ChatRequest request)
    {
        var product = await _context.Products
            .Include(p => p.CulturalProfile)
            .FirstOrDefaultAsync(p => p.ProductID == request.ProductId);

        if (product == null || product.CulturalProfile == null)
            return NotFound("Sản phẩm chưa có dữ liệu hồ sơ văn hóa.");

        var answer = await _ragService.GenerateRagResponseAsync(
            product.CulturalProfile,
            request.Question,
            request.Language ?? "vi-VN"
        );

        return Ok(new
        {
            productId = product.ProductID,
            productName = product.ProductName,
            answer = answer
        });
    }
}

public class ChatRequest
{
    public string ProductId { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? Language { get; set; } = "vi-VN";
}