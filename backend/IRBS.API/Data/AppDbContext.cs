using IRBS.API.Models;
using IRBS.API.Models.Bus_Model;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Train> Trains { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Station> Stations { get; set; }
    public DbSet<Bus> Buses { get; set; }
    public DbSet<BusBooking> BusBookings { get; set; }

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