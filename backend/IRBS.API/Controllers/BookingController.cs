using IRBS.API.DTOs;
using IRBS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        [HttpGet("seats")]
        public async Task<IActionResult> GetBookedSeats([FromQuery] int trainId, [FromQuery] DateTime date)
        {
            var bookedSeats = await _context.Bookings
                .Where(b => b.TrainId == trainId && b.TravelDate.Date == date.Date)
                .Select(b => b.SeatNumber)
                .ToListAsync();

            return Ok(bookedSeats);
        }

        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat([FromBody] BookSeatsDto dto)
        {
            if (dto.SeatNumbers == null || dto.SeatNumbers.Count == 0)
                return BadRequest(new { success = false, message = "No seats selected" });

            var alreadyBooked = await _context.Bookings
                .Where(b => b.TrainId == dto.TrainId && b.TravelDate.Date == dto.TravelDate.Date)
                .Select(b => b.SeatNumber)
                .ToListAsync();

            var conflict = dto.SeatNumbers.Intersect(alreadyBooked).ToList();
            if (conflict.Any())
                return BadRequest(new { success = false, message = $"Already booked: {string.Join(", ", conflict)}" });

            foreach (var seat in dto.SeatNumbers)
            {
                _context.Bookings.Add(new Booking
                {
                    TrainId = dto.TrainId,
                    SeatNumber = seat,
                    TravelDate = dto.TravelDate.Date,
                    Status = "Booked"
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Seats booked successfully"
            });
        }
    }
}