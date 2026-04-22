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
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Booking>()
            .HasIndex(b => new { b.TrainId, b.SeatNumber, b.TravelDate })
            .IsUnique();

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Train)
            .WithMany()
            .HasForeignKey(b => b.TrainId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId);
    }

}