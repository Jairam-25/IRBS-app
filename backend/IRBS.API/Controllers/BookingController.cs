using IRBS.API.DTOs;
using IRBS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
                .Where(b =>
                    b.TrainId == trainId &&
                    b.TravelDate.Date == date.Date
                )
                .Select(b => b.SeatNumber)
                .ToListAsync();

            return Ok(bookedSeats);
        }

        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat(CreateBookingDto dto)
        {
            // 🔹 Get user from token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            User? user = null;

            if (int.TryParse(userIdClaim, out var userId))
            {
                user = await _context.Users.FindAsync(userId);
            }

            if (user == null)
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            }

            if (user == null)
                return Unauthorized(new { success = false, message = "User not found" });

            // 🔹 Validate Train
            var train = await _context.Trains.FindAsync(dto.TrainId);
            if (train == null)
                return BadRequest(new { success = false, message = "Invalid train" });

            // 🔹 Check seat already booked
            var exists = await _context.Bookings.AnyAsync(b =>
                b.TrainId == dto.TrainId &&
                b.TravelDate.Date == dto.TravelDate.Date &&
                b.SeatNumber == dto.SeatNumber
            );

            if (exists)
                return BadRequest(new { success = false, message = "Seat already booked" });

            // 🔹 Create Booking (IMPORTANT)
            var booking = new Booking
            {
                UserId = user.Id,
                TrainId = dto.TrainId,
                SeatNumber = dto.SeatNumber,
                TravelDate = dto.TravelDate,
                Status = "Booked"
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // 🔹 Email
            var notifier = new NotificationService();
            string subject = $"Booking Confirmation - Train {booking.TrainId}";
            string body = notifier.BuildBookingConfirmation(user, booking);

            await notifier.SendEmailAsync(user.Email, subject, body);

            return Ok(new
            {
                success = true,
                bookingId = booking.Id,
                message = "Seat booked successfully"
            });
        }


        // Get my bookings
        [Authorize]
        [HttpGet("mybookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            // Prefer NameIdentifier claim to avoid extra DB lookup
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            if (int.TryParse(userIdClaim, out var parsedId)) userId = parsedId;

            if (userId == null)
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == userEmail);
                if (user == null) return Unauthorized("User not found");
                userId = user.Id;
            }

            var myBookings = await _context.Bookings
                .AsNoTracking()
                .Where(b => b.UserId == userId)
                .Include(b => b.Train)
                .ToListAsync();

            return Ok(myBookings);
        }

        [HttpPost("update-status")]
        public async Task<IActionResult> UpdateBookingStatus(int bookingId, string status)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();

            booking.Status = status;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Booking {bookingId} updated to {status}" });
        }

    }
}