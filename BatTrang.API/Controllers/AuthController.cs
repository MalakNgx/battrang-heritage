using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BatTrang.API.Data;
using BatTrang.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace BatTrang.API.Controllers
{
    [Authorize(Roles = "Admin")] // Bảo vệ toàn bộ Controller, ngoại trừ các hàm có AllowAnonymous
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        [AllowAnonymous] // Thêm thẻ này để ai cũng có thể gọi API Đăng nhập
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);
            
            if (user == null || !VerifyPassword(model.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác!" });
            }

            if (user.Role != "Admin")
            {
                return StatusCode(403, new { message = "Bạn không có quyền truy cập trang quản trị Admin!" });
            }

            var token = GenerateJwtToken(user);
            return Ok(new { token, username = user.Username, role = user.Role });
        }

        [HttpPost("seed-admin")]
        [AllowAnonymous] // Thêm thẻ này để Terminal/cURL có thể gọi vào tạo admin
        public async Task<IActionResult> SeedAdmin()
        {
            if (await _context.Users.AnyAsync(u => u.Username == "admin"))
                return BadRequest("Tài khoản admin đã tồn tại!");

            var admin = new User
            {
                Username = "admin",
                PasswordHash = HashPassword("Admin@123"), 
                Role = "Admin"
            };

            _context.Users.Add(admin);
            await _context.SaveChangesAsync();
            
            // Trả về JSON để hiển thị rõ ràng trên cURL/Swagger
            return Ok(new { message = "Đã tạo tài khoản Admin thành công (User: admin / Pass: Admin@123)" });
        }

        // ... Các hàm private GenerateJwtToken, HashPassword, VerifyPassword giữ nguyên
        
        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"];
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            return HashPassword(password) == storedHash;
        }
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}