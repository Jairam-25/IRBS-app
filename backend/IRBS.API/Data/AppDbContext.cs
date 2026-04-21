using IRBS.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Train> Trains { get; set; }
    public DbSet<Booking> Bookings { get; set; }
}