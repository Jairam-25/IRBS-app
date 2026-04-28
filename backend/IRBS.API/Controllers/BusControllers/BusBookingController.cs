using IRBS.API.Models.Bus_Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusBookingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public BusBookingController(
            AppDbContext context,
            NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // Get booked seats for a bus on a specific date
        [HttpGet("seats")]
        public async Task<IActionResult> GetBookedSeats(int busId, DateTime date)
        {
            var seats = await _context.BusBookings
                .Where(x => x.BusId == busId &&
                            x.TravelDate.Date == date.Date)
                .Select(x => x.SeatNumber)
                .ToListAsync();

            return Ok(seats);
        }

        // Book a seat on a bus
        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat(BusBooking dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Invalid user");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Unauthorized("User not found");

            var bus = await _context.Buses.FindAsync(dto.BusId);
            if (bus == null)
                return BadRequest("Bus not found");


            var exists = await _context.BusBookings.AnyAsync(x =>
                x.BusId == dto.BusId &&
                x.TravelDate.Date == dto.TravelDate.Date &&
                x.SeatNumber == dto.SeatNumber);

            if (exists)
                return BadRequest("Seat already booked");

            var booking = new BusBooking
            {
                UserId = user.Id,
                BusId = dto.BusId,
                SeatNumber = dto.SeatNumber,
                TravelDate = dto.TravelDate,
                Status = "Booked"
            };

            _context.BusBookings.Add(booking);
            await _context.SaveChangesAsync();

            var buses = await _context.Buses.FindAsync(booking.BusId);

            string body = _notificationService.BuildBusBookingConfirmation(user, booking, buses);

            await _notificationService.SendEmailAsync(user.Email, "Bus Booking Confirmed", body);

            return Ok(new
            {
                success = true,
                bookingId = booking.Id,
                message = "Bus seat booked successfully"
            });
        }

        // Get user's bus bookings
        [Authorize]
        [HttpGet("mybookings")]
        public async Task<IActionResult> MyBookings()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var data = await _context.BusBookings
                .Where(x => x.UserId == userId)
                .Include(x => x.BusId)
                .ToListAsync();

            return Ok(data);
        }

        // Cancel a booking
        [Authorize]
        [HttpPost("cancel")]
        public async Task<IActionResult> Cancel(int bookingId)
        {
            var booking = await _context.BusBookings.FindAsync(bookingId);

            if (booking == null)
                return NotFound();

            booking.Status = "Cancelled";

            await _context.SaveChangesAsync();

            return Ok("Booking cancelled");
        }
    }
}