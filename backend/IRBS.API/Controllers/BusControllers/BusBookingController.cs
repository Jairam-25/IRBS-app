using IRBS.API.Core.Interface;
using IRBS.API.DTOs;
using IRBS.API.Models;
using IRBS.API.Models.Bus_Model;
using IRBS.API.Services;
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
        private readonly INotificationService _notificationService;
        private readonly TicketPdfService _ticketPdfService;

        public BusBookingController(
            AppDbContext context,
            NotificationService notificationService, TicketPdfService ticketPdfService)
        {
            _context = context;
            _notificationService = notificationService;
            _ticketPdfService = ticketPdfService;
        }

        private string GenerateBusBookingNumber()
        {
            // simple random numeric booking number; adjust as needed
            return DateTime.UtcNow.ToString("yyyyMMddHHmmss") + new Random().Next(1000, 9999).ToString();
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
                        !string.IsNullOrWhiteSpace(x.SeatNumber)) 
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

        // Book multiple seats
        [Authorize]
        [HttpPost("book-multiple")]
        public async Task<IActionResult> BookSeat([FromBody] CreateBusBookingDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // GET USER
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized();

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return Unauthorized();

                // VALIDATE BUS
                Bus? bus = await _context.Buses
                    .FirstOrDefaultAsync(x => x.BusNumber == dto.BusNumber);

                if (bus == null)
                    return BadRequest("Invalid bus");

                if (!bus.IsActive)
                    return BadRequest("Bus is not active");

                // VALIDATE PASSENGERS
                if (dto.Passengers == null || !dto.Passengers.Any())
                    return BadRequest("Passenger details required");

                // CLEAN SEATS
                var requestedSeats = dto.Passengers
                    .Where(x => !string.IsNullOrWhiteSpace(x.SeatNumber))
                    .Select(x => x.SeatNumber.Trim().ToUpper())
                    .Distinct()
                    .ToList();

                if (!requestedSeats.Any())
                    return BadRequest("Please select seats");

                // DATE FILTER
                var startDate = dto.TravelDate.Date;
                var endDate = startDate.AddDays(1);

                // GET EXISTING BOOKINGS
                var existingBookings = await _context.BusBookings
                    .Where(x =>
                        x.BusNumber == dto.BusNumber &&
                        x.TravelDate >= startDate &&
                        x.TravelDate < endDate &&
                        x.Status == "Booked")
                    .ToListAsync();

                // GET BOOKED SEATS
                var bookedSeats = existingBookings
                    .Select(x => x.SeatNumber.Trim().ToUpper())
                    .ToHashSet();

                // CHECK ALREADY BOOKED
                var alreadyBooked = requestedSeats
                    .Where(seat => bookedSeats.Contains(seat))
                    .ToList();

                if (alreadyBooked.Any())
                {
                    return BadRequest($"Seats already booked: {string.Join(", ", alreadyBooked)}");
                }

                // CHECK AVAILABLE COUNT (FIXED: Use existingBookings.Count instead of aggregate bus.BookedSeats)
                int availableSeatsCount = bus.TotalSeats - existingBookings.Count;

                if (requestedSeats.Count > availableSeatsCount)
                    return BadRequest("Not enough seats available on this date");

                // GENERATE BOOKING NUMBER
                var bookingNumber = GenerateBusBookingNumber();

                // CREATE MULTIPLE ROWS
                foreach (var passenger in dto.Passengers)
                {
                    var booking = new BusBooking
                    {
                        UserId = userId,
                        BusId = bus.Id,
                        BusNumber = bus.BusNumber,
                        SeatNumber = passenger.SeatNumber.Trim().ToUpper(),
                        TravelDate = dto.TravelDate,
                        BookingDate = DateTime.UtcNow,
                        PassengerName = passenger.Name,
                        PassengerAge = passenger.Age,
                        Berth = passenger.Berth,
                        Status = "Booked",
                        BusBookingNumber = bookingNumber
                    };

                    _context.BusBookings.Add(booking);
                }

                // UPDATE BOOKED SEATS (Aggregate count in Bus table - optional but keeping for now)
                bus.BookedSeats += requestedSeats.Count;

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // SEND EMAIL
                try
                {
                    string body = _notificationService.BuildBusBookingConfirmation(
                        user,
                        dto,
                        bookingNumber,
                        bus
                    );

                    await _notificationService.SendEmailAsync(
                        user.Email,
                        "Bus Booking Confirmed",
                        body
                    );
                }
                catch (Exception ex)
                {
                    // Log but don't fail booking
                    Console.WriteLine("Email error: " + ex.Message);
                }

                // GENERATE PDF
                var firstBooking = await _context.BusBookings
                    .Include(x => x.Bus)
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.BusBookingNumber == bookingNumber);

                if (firstBooking == null)
                    return BadRequest("Error generating ticket");

                var pdfBytes = _ticketPdfService.GenerateBusTicket(firstBooking);

                return File(
                    pdfBytes,
                    "application/pdf",
                    $"IRBS_Bus_Ticket_{bookingNumber}.pdf"
                );
            }
            catch (Exception ex)
            {
                if (transaction != null) await transaction.RollbackAsync();

                return StatusCode(500, ex.Message);
            }
        }

        // My bookings
        [Authorize]
        [HttpGet("booked/{trackingNumber}")]
        public async Task<IActionResult> GetBookingByTrackingNumber(string trackingNumber)
        {
            try
            {
                // GET USER ID
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized();

                // GET BOOKINGS
                var bookings = await _context.BusBookings
                    .Where(x =>
                        x.BusBookingNumber == trackingNumber &&
                        x.Status == "Booked")
                    .Include(x => x.Bus)
                    .ToListAsync();

                // CHECK EMPTY
                if (!bookings.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Booking not found"
                    });
                }

                // FIRST RECORD
                var first = bookings.First();

                // RESPONSE
                var result = new
                {
                    success = true,
                    trackingNumber = first.BusBookingNumber,
                    bookingDate = first.BookingDate,
                    travelDate = first.TravelDate,
                    status = first.Status,
                    bus = new
                    {
                        first.Bus!.BusName,
                        first.Bus!.BusNumber,
                        first.Bus!.BusType,
                        first.Bus!.FromCity,
                        first.Bus!.ToCity,
                        first.Bus!.DepartureTime,
                        first.Bus!.ArrivalTime
                    },

                    passengers = bookings.Select(p => new
                    {
                        p.PassengerName,
                        p.PassengerAge,
                        p.SeatNumber,
                        p.Berth
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    $"An error occurred while fetching booking details\n{ex.Message}");
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