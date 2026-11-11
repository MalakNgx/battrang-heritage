using System.Text;
using Microsoft.EntityFrameworkCore;
using BatTrang.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using BatTrang.API.Services;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models; // <-- Khai báo dòng này để gọi ngắn gọn các class Swagger

var builder = WebApplication.CreateBuilder(args);

// 1. KẾT NỐI DATABASE
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. CẤU HÌNH AUTHENTICATION JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();

// 3. ĐĂNG KÝ SERVICES
builder.Services.AddHttpClient<GeminiRagService>();
builder.Services.AddSingleton<IQrCodeService, QrCodeService>();

// 4. ĐĂNG KÝ CORS (Chỉ dùng AllowAll)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 5. ĐĂNG KÝ CONTROLLER & SWAGGER (Cấu hình nút Authorize Bearer JWT)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "BatTrang Heritage API", Version = "v1" });

    // Khai báo Scheme xác thực Bearer Token
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập theo đúng định dạng: Bearer [token_cua_ban]"
    });

    // Yêu cầu Swagger tự động gửi Token cho các endpoint
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// ================= PIPELINE =================

// 1. Cấu hình Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BatTrang Heritage API v1");
        c.RoutePrefix = string.Empty; 
    });
}

// 2. Middleware tĩnh và Cors
app.UseStaticFiles();
app.UseCors("AllowAll");
//app.UseHttpsRedirection();

// 3. Authentication & Authorization
app.UseAuthentication(); 
app.UseAuthorization();

// 4. Map Controller
app.MapControllers();

// 5. Minimal APIs
app.MapGet("/weatherforecast", () =>
{
    var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };
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

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}