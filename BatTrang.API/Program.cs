using Microsoft.EntityFrameworkCore;
using BatTrang.API.Data;
using BatTrang.API.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. KẾT NỐI DATABASE (MS SQL SERVER DOCKER)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. ĐĂNG KÝ GEMINI RAG SERVICE & HTTPCLIENT
builder.Services.AddHttpClient<GeminiRagService>();

// 3. ĐĂNG KÝ CORS (CHO PHÉP WEB PWA / FRONTEND TRUY CẬP API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. ĐĂNG KÝ CÁC DỊCH VỤ CONTROLLER & SWAGGER
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();
// Đăng ký Service sinh mã QR
builder.Services.AddSingleton<IQrCodeService, QrCodeService>();

var app = builder.Build();

// 5. CẤU HÌNH PIPELINE (MIDDLEWARE)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Đảm bảo các dòng này nằm ngoài if (app.Environment.IsDevelopment())
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BatTrang Heritage API v1");
    // Nếu muốn khi truy cập vào trang chủ / nó tự động vào thẳng Swagger luôn, hãy bật dòng dưới:
    c.RoutePrefix = string.Empty; 
});
// Bật tính năng đọc file tĩnh (ảnh local trong wwwroot)
app.UseStaticFiles();

// Bật CORS policy
app.UseCors("AllowAll");

app.UseHttpsRedirection();
app.UseAuthorization();

// Ánh xạ các Controller (như ChatController)
app.MapControllers();

// WeatherForecast API mẫu của .NET
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

// CHỈ GIỮ LẠI LỆNH app.Run() DUY NHẤT Ở CUỐI FILE
app.Run();

// Record WeatherForecast
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}