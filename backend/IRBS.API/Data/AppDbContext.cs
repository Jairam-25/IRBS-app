using IRBS.API.Models;
using IRBS.API.Models.Bus_Model;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Train> Trains { get; set; }
    public DbSet<TrainBooking> TrainBookings { get; set; }
    public DbSet<TrainStation> TrainStations { get; set; }
    public DbSet<Bus> Buses { get; set; }
    public DbSet<BusBooking> BusBookings { get; set; }
    public DbSet<BusCities> BusCities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // TRAIN TABLE MAPPINGS
        modelBuilder.Entity<TrainBooking>().ToTable("TrainBooking");
        modelBuilder.Entity<TrainStation>().ToTable("TrainStation");
        modelBuilder.Entity<Train>().ToTable("Train");

        // BUS BOOKING RELATIONS
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