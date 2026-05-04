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
        public async Task<IActionResult> GetBookedSeats(int busId, DateTime date)
        {
            try
            {
                var seats = await _context.BusBookings
                    .Where(x =>
                        x.BusId == busId &&
                        x.TravelDate.Date == date.Date &&
                        x.Status == "Booked")
                    .SelectMany(x => x.SeatNumber.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(x => x.Trim().ToUpper())
                    .ToListAsync();

                return Ok(seats);
            }
            catch (Exception ex)
            {
                return StatusCode(500,$"An error occurred while fetching booked seats/n{ex.ToString}");
            }
        }

        // Book seat(s)
        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat([FromBody] CreateBusBookingDto dto)
        {
            try
            {
                // Logged-in user
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized();

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return Unauthorized();

                // Validate bus
                var bus = await _context.Buses.FindAsync(dto.BusId);

                if (bus == null)
                    return BadRequest("Invalid Bus");

                if (!bus.IsActive)
                    return BadRequest("Bus not available");

                // Requested seats
                var requestedSeats = dto.SeatNumbers
                    .Select(x => x.Trim().ToUpper())
                    .Distinct()
                    .ToList();

                if (!requestedSeats.Any())
                    return BadRequest("Please select seat(s)");

                // Available seats check
                int availableSeats = bus.TotalSeats - bus.BookedSeats;

                if (requestedSeats.Count > availableSeats)
                    return BadRequest("Not enough seats available");

                // Existing booked seats
                var existingBookings = await _context.BusBookings
                    .Where(x =>
                        x.BusId == dto.BusId &&
                        x.TravelDate.Date == dto.TravelDate.Date &&
                        x.Status == "Booked")
                    .ToListAsync();

                var bookedSeats = existingBookings
                    .SelectMany(x => x.SeatNumber.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(x => x.Trim().ToUpper())
                    .ToList();

                // Duplicate seat check
                if (requestedSeats.Any(seat => bookedSeats.Contains(seat)))
                    return BadRequest("One or more seats already booked");

                // Create booking
                var booking = new BusBooking
                {
                    UserId = userId,
                    BusId = dto.BusId,
                    TravelDate = dto.TravelDate,
                    SeatNumber = string.Join(",", requestedSeats),
                    Status = "Booked"
                };

                _context.BusBookings.Add(booking);

                // Update booked count
                bus.BookedSeats += requestedSeats.Count;

                await _context.SaveChangesAsync();

                // Send mail
                string body = _notificationService.BuildBusBookingConfirmation(user, booking, bus);

                await _notificationService.SendEmailAsync(
                    user.Email,
                    "Bus Booking Confirmed",
                    body
                );

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
                return StatusCode(500, $"An error occurred while booking seats/n{ex.ToString}");
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