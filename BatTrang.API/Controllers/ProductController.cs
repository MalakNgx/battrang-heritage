using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BatTrang.API.Data;
using Microsoft.AspNetCore.Authorization;
using BatTrang.API.Models;
// Nếu thư mục chứa class Product của bạn tên khác, hãy sửa lại using cho đúng (ví dụ: BatTrang.API.Models)

namespace BatTrang.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Bắt buộc phải có JWT Token của Admin mới được gọi các API này
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductController(AppDbContext context)
        {
            _context = context;
        }

        // 1. API LẤY DANH SÁCH SẢN PHẨM (GET: api/product)
        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _context.Products
                .Include(p => p.CulturalProfile)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            
            return Ok(products);
        }

        // 2. API THÊM MỚI SẢN PHẨM (POST: api/product)
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] ProductDto request)
        {
            // Kiểm tra trùng mã sản phẩm
            if (await _context.Products.AnyAsync(p => p.ProductID == request.ProductID))
            {
                return BadRequest("Mã sản phẩm này đã tồn tại trong CSDL.");
            }

            var product = new Product
            {
                ProductID = request.ProductID,
                ProductName = request.ProductName,
                Category = request.Category,
                ThumbnailUrl = request.ThumbnailUrl,
                QrCodeUrl = request.QrCodeUrl,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            // Nếu FE có gửi kèm dữ liệu Hồ sơ văn hóa
            if (request.CulturalProfile != null)
            {
                product.CulturalProfile = new CulturalProfile
                {
                    ProductID = request.ProductID,
                    IdentityLayer = request.CulturalProfile.IdentityLayer,
                    SymbolismLayer = request.CulturalProfile.SymbolismLayer,
                    CraftsmanshipLayer = request.CulturalProfile.CraftsmanshipLayer,
                    ArtisanStory = request.CulturalProfile.ArtisanStory,
                    CulturalConnection = request.CulturalProfile.CulturalConnection,
                    UpdatedAt = DateTime.UtcNow
                };
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm sản phẩm thành công!" });
        }

        // 3. API CẬP NHẬT SẢN PHẨM (PUT: api/product/{id})
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductDto request)
        {
            var product = await _context.Products
                .Include(p => p.CulturalProfile)
                .FirstOrDefaultAsync(p => p.ProductID == id);

            if (product == null) 
                return NotFound("Không tìm thấy sản phẩm cần cập nhật.");

            // Cập nhật thông tin chung
            product.ProductName = request.ProductName;
            product.Category = request.Category;
            product.ThumbnailUrl = request.ThumbnailUrl;
            product.QrCodeUrl = request.QrCodeUrl;
            product.IsActive = request.IsActive;

            // Cập nhật hoặc thêm mới Hồ sơ văn hóa
            if (request.CulturalProfile != null)
            {
                if (product.CulturalProfile == null)
                {
                    product.CulturalProfile = new CulturalProfile { ProductID = id };
                }
                product.CulturalProfile.IdentityLayer = request.CulturalProfile.IdentityLayer;
                product.CulturalProfile.SymbolismLayer = request.CulturalProfile.SymbolismLayer;
                product.CulturalProfile.CraftsmanshipLayer = request.CulturalProfile.CraftsmanshipLayer;
                product.CulturalProfile.ArtisanStory = request.CulturalProfile.ArtisanStory;
                product.CulturalProfile.CulturalConnection = request.CulturalProfile.CulturalConnection;
                product.CulturalProfile.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật sản phẩm thành công!" });
        }

        // 4. API XÓA SẢN PHẨM (DELETE: api/product/{id})
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(string id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == id);
            if (product == null) return NotFound("Không tìm thấy sản phẩm để xóa.");

            // Do database có thiết lập ON DELETE CASCADE, xóa Product sẽ tự động xóa CulturalProfile liên quan
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Đã xóa sản phẩm thành công!" });
        }
    }

    // Các class DTO để hứng dữ liệu JSON từ Frontend (giúp tránh lỗi vòng lặp JSON)
    public class ProductDto
    {
        public string ProductID { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public CulturalProfileDto? CulturalProfile { get; set; }
    }

    public class CulturalProfileDto
    {
        public string IdentityLayer { get; set; } = string.Empty;
        public string SymbolismLayer { get; set; } = string.Empty;
        public string CraftsmanshipLayer { get; set; } = string.Empty;
        public string ArtisanStory { get; set; } = string.Empty;
        public string CulturalConnection { get; set; } = string.Empty;
    }
}