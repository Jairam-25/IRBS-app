using IRBS.API.DTOs;
using IRBS.API.Models.Bus_Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IRBS.API.Services;

namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusBookingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly TicketPdfService _ticketPdfService;

        public BusBookingController(
            AppDbContext context,
            NotificationService notificationService, TicketPdfService ticketPdfService)
        {
            _context = context;
            _notificationService = notificationService;
            _ticketPdfService = ticketPdfService;
        }

        // Get booked seats for selected bus/date
        [HttpGet("seats")]
        public async Task<IActionResult> GetBookedSeats([FromQuery] int busId, [FromQuery] DateTime date)
        {
            try
            {
                // Use range instead of .Date (EF-safe)
                var startDate = date.Date;
                var endDate = startDate.AddDays(1);

                var bookings = await _context.BusBookings
                    .Where(x =>
                        x.BusId == busId &&
                        x.TravelDate >= startDate &&
                        x.TravelDate < endDate &&
                        x.Status == "Booked" &&
                        !string.IsNullOrWhiteSpace(x.SeatNumber)) // critical fix
                    .ToListAsync();

                var seats = bookings
                    .SelectMany(x => x.SeatNumber
                        .Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(x => x.Trim().ToUpper())
                    .Distinct()
                    .ToList();

                return Ok(seats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString()); // show real error
            }
        }

        // Book seat(s)
        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat([FromBody] CreateBusBookingDto dto)
        {
            try
            {
                // Get user from token (correct approach)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized();

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized();

                // Validate bus
                var bus = await _context.Buses.FindAsync(dto.BusId);
                if (bus == null)
                    return BadRequest("Invalid bus");

                if (!bus.IsActive)
                    return BadRequest("Bus not active");

                // Clean requested seats                
                var requestedSeats = dto.SeatNumbers?
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim().ToUpper())
                    .Distinct()
                    .ToList();

                if (requestedSeats == null || !requestedSeats.Any())
                    return BadRequest("Please select seat(s)");

                // Safe date filtering
                var startDate = dto.TravelDate.Date;
                var endDate = startDate.AddDays(1);

                // Get existing bookings
                var existingBookings = await _context.BusBookings
                    .Where(x =>
                        x.BusId == dto.BusId &&
                        x.TravelDate >= startDate &&
                        x.TravelDate < endDate &&
                        x.Status == "Booked" &&
                        !string.IsNullOrWhiteSpace(x.SeatNumber))
                    .ToListAsync();

                var bookedSeats = existingBookings
                    .SelectMany(x => x.SeatNumber
                        .Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(x => x.Trim().ToUpper())
                    .ToHashSet(); // faster lookup

                // Check duplicates
                var alreadyBooked = requestedSeats
                    .Where(seat => bookedSeats.Contains(seat))
                    .ToList();

                if (alreadyBooked.Any())
                {
                    return BadRequest($"Seats already booked: {string.Join(", ", alreadyBooked)}");
                }

                // Check availability
                int availableSeats = bus.TotalSeats - bus.BookedSeats;

                if (requestedSeats.Count > availableSeats)
                    return BadRequest("Not enough seats available");

                // Create booking
                var booking = new BusBooking
                {
                    UserId = userId,
                    BusId = dto.BusId,
                    TravelDate = dto.TravelDate,
                    BookingDate = DateTime.Now,
                    SeatNumber = string.Join(",", requestedSeats),
                    Status = "Booked"
                };

                _context.BusBookings.Add(booking);

                // Update count
                bus.BookedSeats += requestedSeats.Count;

                await _context.SaveChangesAsync();

                // Send email (optional — don’t let it crash booking)
                try
                {
                    string body = _notificationService.BuildBusBookingConfirmation(user, booking, bus);

                    await _notificationService.SendEmailAsync(
                        user.Email,
                        "Bus Booking Confirmed",
                        body
                    );
                }
                catch(Exception ex)
                {
                    return StatusCode(500, ex.ToString());
                }

                return Ok(new
                {
                    success = true,
                    bookingId = booking.Id,
                    seats = requestedSeats,
                    totalSeats = bus.TotalSeats,
                    bookedSeats = bus.BookedSeats,
                    availableSeats = bus.TotalSeats - bus.BookedSeats,
                    message = "Bus seats booked successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        // My bookings
        [Authorize]
        [HttpGet("mybookings")]
        public async Task<IActionResult> MyBookings()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized();

                var data = await _context.BusBookings
                    .Where(x => x.UserId == userId)
                    .Include(x => x.Bus)
                    .ToListAsync();

                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while fetching your bookings/n{ex.Message}");
            }
        }

        // Cancel booking
        [Authorize]
        [HttpPost("cancel")]
        public async Task<IActionResult> Cancel(int bookingId)
        {
            try
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier);

                if (claim == null)
                    return Unauthorized();

                if (!int.TryParse(claim.Value, out int userId))
                    return Unauthorized();

                var booking = await _context.BusBookings
                    .FirstOrDefaultAsync(x =>
                        x.Id == bookingId &&
                        x.UserId == userId);

                if (booking == null)
                    return NotFound("Booking not found");

                if (booking.Status == "Cancelled")
                    return BadRequest("Booking already cancelled");

                booking.Status = "Cancelled";

                var bus = await _context.Buses.FindAsync(booking.BusId);

                if (bus != null)
                {
                    int seatCount = booking.SeatNumber
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Length;

                    bus.BookedSeats -= seatCount;

                    if (bus.BookedSeats < 0)
                        bus.BookedSeats = 0;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Booking cancelled successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while cancelling the booking/n{ex}");
            }
        }

        [Authorize]
        [HttpGet("ticket/{bookingId}")]
        public async Task<IActionResult> DownloadTicket(int bookingId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized();

                var booking = await _context.BusBookings
                    .Include(x => x.Bus)
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x =>
                        x.Id == bookingId &&
                        x.UserId == userId);

                if (booking == null)
                    return NotFound("Ticket not found");

                var pdfBytes = _ticketPdfService.GenerateBusTicket(booking);

                return File(
                    pdfBytes,
                    "application/pdf",
                    $"IRBS_Bus_Ticket_{booking.Id}.pdf"
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while generating the ticket/n{ex.Message}");
            }
        }
    }
}