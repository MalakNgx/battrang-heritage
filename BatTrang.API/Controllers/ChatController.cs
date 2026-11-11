using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BatTrang.API.Data;
using BatTrang.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using BatTrang.API.Models;

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
        if (productId.ToUpper() != "SP001")
        {
            return NotFound(new { message = $"Không tìm thấy sản phẩm: {productId}" });
        }

        var responseData = new 
        {
            productId = "SP001",
            productName = "Bình hoa gốm men rạn Hoa Sen cổ",
            category = "Gốm men rạn",
            thumbnailUrl = "https://picsum.photos/400", 
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
        
        try
        {
            var chatLog = new ChatLog
            {
                ProductID = request.ProductId,
                Question = request.Question,
                Language = request.Language,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatLogs.Add(chatLog);
            await _context.SaveChangesAsync(); 
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi lưu chat log: {ex.Message}");
        }
        
        return Ok(new
        {
            productId = product.ProductID,
            productName = product.ProductName,
            answer = answer
        });
    }

    // API trả về danh sách lịch sử chat cho trang CMS Admin
    [HttpGet("logs")]
    [Authorize(Roles = "Admin")] 
    public async Task<IActionResult> GetChatLogs()
    {
        var logs = await _context.ChatLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(100) 
            .ToListAsync();

        return Ok(logs);
    }

    // 👉 ĐÃ ĐƯA HÀM NÀY VÀO BÊN TRONG CLASS CHATCONTROLLER
    [HttpGet("stats/popular-products")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPopularProductsStats()
    {
        var stats = await _context.ChatLogs
            .GroupBy(l => l.ProductID)
            .Select(g => new 
            {
                ProductID = g.Key,
                InteractionCount = g.Count() 
            })
            .OrderByDescending(x => x.InteractionCount)
            .Take(10) 
            .ToListAsync();

        var result = new List<object>();
        foreach (var item in stats)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == item.ProductID);
            result.Add(new
            {
                productId = item.ProductID,
                productName = product?.ProductName ?? "Sản phẩm không rõ",
                thumbnail = product?.ThumbnailUrl ?? "",
                count = item.InteractionCount
            });
        }

        return Ok(result);
    }
    [HttpGet("stats/dashboard")]
    [Authorize(Roles = "Admin")]

    public async Task<IActionResult> GetDashboardStats([FromQuery] string period = "day")
    {
        var query = _context.ChatLogs.AsQueryable();
        var now = DateTime.UtcNow;

        // Lọc thời gian theo kỳ (day, month, year)
        if (period == "day")
        {
            query = query.Where(x => x.CreatedAt.Date == now.Date);
        }
        else if (period == "month")
        {
            query = query.Where(x => x.CreatedAt.Year == now.Year && x.CreatedAt.Month == now.Month);
        }
        else if (period == "year")
        {
            query = query.Where(x => x.CreatedAt.Year == now.Year);
        }

        var totalChats = await query.CountAsync();
        var totalProducts = await _context.Products.CountAsync();

        // Tính toán lượt quét QR (Giả định mỗi lượt quét QR tương ứng với một phiên hoặc được tính dựa trên số lượng truy cập thực tế, hoặc bạn có thể đếm tổng số bản ghi mở sản phẩm)
        // Ở đây ta có thể quy đổi hoặc tính dựa trên số lượng chat thực tế có hệ số, hoặc đếm từ log QR nếu có. Tạm tính QR = số lượt chat + lượng truy cập phát sinh:
        var totalQrScans = totalChats > 0 ? (int)(totalChats * 1.5) : 0; 

        // Thống kê tìm ra ngôn ngữ phổ biến nhất trong kỳ
        var topLanguage = await query
            .GroupBy(l => l.Language)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefaultAsync();

        // Thống kê phân bố ngôn ngữ cho biểu đồ tròn
        var langDistribution = await query
            .GroupBy(l => l.Language)
            .Select(g => new { language = g.Key ?? "vi-VN", count = g.Count() })
            .ToListAsync();

        return Ok(new
        {
            totalProducts = totalProducts,
            totalChats = totalChats,
            totalQrScans = totalQrScans,
            topLanguage = topLanguage ?? "vi-VN",
            languageDistribution = langDistribution
        });
    }
}

public class ChatRequest
{
    public string ProductId { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? Language { get; set; } = "vi-VN";
}