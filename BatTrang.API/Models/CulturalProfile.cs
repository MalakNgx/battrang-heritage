using BatTrang.API.Models;
namespace BatTrang.API.Models;

public class CulturalProfile
{
    public int ProfileID { get; set; }
    public string ProductID { get; set; } = string.Empty;
    public string? IdentityLayer { get; set; }
    public string? SymbolismLayer { get; set; }
    public string? CraftsmanshipLayer { get; set; }
    public string? ArtisanStory { get; set; }
    public string? CulturalConnection { get; set; }
    public DateTime UpdatedAt { get; set; }
}