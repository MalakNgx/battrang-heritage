using BatTrang.API.Models;
namespace BatTrang.API.Models;

public class Product
{
    public string ProductID { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? QrCodeUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }

    public CulturalProfile? CulturalProfile { get; set; }
}