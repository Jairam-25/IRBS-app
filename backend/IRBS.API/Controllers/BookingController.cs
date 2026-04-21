using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IRBS.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingController(AppDbContext context)
        {
            _context = context;
        }

        // Get booked seats for a train & date
        [HttpGet("seats")]
        public async Task<IActionResult> GetBookedSeats(int trainId, DateTime date)
        {
            var bookedSeats = await _context.Bookings
                .Where(b => b.TrainId == trainId && b.TravelDate == date)
                .Select(b => b.SeatNumber)
                .ToListAsync();

            return Ok(bookedSeats);
        }

        // Book a seat
        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat(Booking booking)
        {
            // Check if already booked
            var exists = await _context.Bookings.AnyAsync(b =>
                b.TrainId == booking.TrainId &&
                b.TravelDate == booking.TravelDate &&
                b.SeatNumber == booking.SeatNumber);

            if (exists)
                return BadRequest("Seat already booked");

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok("Seat booked successfully");
        }
    }
}