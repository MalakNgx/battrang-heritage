using Microsoft.EntityFrameworkCore;
using BatTrang.API.Models;
namespace BatTrang.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<CulturalProfile> CulturalProfiles { get; set; } = null!;
    public DbSet<User> Users { get; set; } // Thêm bảng Users
    public DbSet<ChatLog> ChatLogs { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasKey(p => p.ProductID);
        modelBuilder.Entity<CulturalProfile>().HasKey(cp => cp.ProfileID);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.CulturalProfile)
            .WithOne()
            .HasForeignKey<CulturalProfile>(cp => cp.ProductID);
    }
}