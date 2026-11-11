namespace BatTrang.API.Models
{
    public class ChatLog
    {
        public int Id { get; set; }
        public string ProductID { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}