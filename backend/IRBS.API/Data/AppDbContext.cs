using IRBS.API.Models;
using IRBS.API.Models.Bus_Model;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Train> Trains { get; set; }
    public DbSet<Booking> TrainBookings { get; set; }
    public DbSet<Station> TrainStations { get; set; }
    public DbSet<Bus> Buses { get; set; }
    public DbSet<BusBooking> BusBookings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //modelBuilder.Entity<Booking>()
        //    .HasIndex(b => new { b.TrainId, b.SeatNumber, b.TravelDate })
        //    .IsUnique();

        //modelBuilder.Entity<Booking>()
        //    .HasOne(b => b.Train)
        //    .WithMany()
        //    .HasForeignKey(b => b.TrainId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId);

        modelBuilder.Entity<BusBooking>()
            .HasIndex(b => new { b.BusId, b.SeatNumber, b.TravelDate })
            .IsUnique();

        modelBuilder.Entity<BusBooking>()
            .HasOne(b => b.Bus)
            .WithMany()
            .HasForeignKey(b => b.BusId);

        modelBuilder.Entity<BusBooking>()
            .HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId);
        modelBuilder.Entity<Bus>()
            .Property(b => b.Price)
            .HasPrecision(18, 2);

    }

}