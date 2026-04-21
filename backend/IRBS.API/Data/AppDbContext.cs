using IRBS.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Train> Trains { get; set; }
    public DbSet<Booking> Bookings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>()
            .HasIndex(b => new { b.TrainId, b.SeatNumber, b.TravelDate })
            .IsUnique(); // ❗ Prevent duplicate seat booking (DB level)
    }
}