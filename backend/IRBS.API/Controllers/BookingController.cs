using IRBS.API.DTOs;
using IRBS.API.Models;
using iText.Kernel.Pdf;
using iText.Layout.Element;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using iText.Layout;

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
        public IActionResult GetSeats(int trainId, string date)
        {
            if (!DateTime.TryParse(date, out var travelDate))
                return BadRequest("Invalid date");

            var seats = _context.Bookings
                .Where(x => x.TrainId == trainId && x.TravelDate.Date == travelDate.Date)
                .Select(x => x.Coach + "-" + x.SeatNumber)
                .ToList();

            return Ok(seats);
        }

        [Authorize]
        [HttpPost("book")]
        public async Task<IActionResult> BookSeat(CreateBookingDto dto)
        {
            // Guard: must contain exactly 1 seat
            if (dto.SeatNumbers == null || dto.SeatNumbers.Count != 1)
                return BadRequest(new { message = "Exactly one seat required" });

            var seat = dto.SeatNumbers[0];

            // Get user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found" });

            // Validate Train
            var train = await _context.Trains.FindAsync(dto.TrainId);
            if (train == null)
                return BadRequest(new { message = "Invalid train" });

            // SPLIT "S1-23"
            var parts = seat.Split('-');

            if (parts.Length != 2)
                return BadRequest(new { message = "Invalid seat format" });

            string coach = parts[0];
            int seatNumber = int.Parse(parts[1]);

            // Check exists
            var exists = await _context.Bookings.AnyAsync(b =>
                b.TrainId == dto.TrainId &&
                b.TravelDate.Date == dto.TravelDate.Date &&
                b.Coach == coach &&
                b.SeatNumber == seatNumber
            );

            if (exists)
                return BadRequest(new { message = "Seat already booked" });

            // Save
            var booking = new Booking
            {
                UserId = user.Id,
                TrainId = dto.TrainId,
                Coach = coach,
                SeatNumber = seatNumber,
                TravelDate = dto.TravelDate,
                Status = "Booked"
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seat booked successfully",
                seat = seat
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

        // Book multiple seats
        [Authorize]
        [HttpPost("book-multiple")]
        public async Task<IActionResult> BookMultiple(CreateBookingDto dto)
        {
            if (dto == null || dto.SeatNumbers == null || !dto.SeatNumbers.Any())
                return BadRequest("No seats selected");

            // USER
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Unauthorized();

            // TRAIN
            var train = await _context.Trains.FindAsync(dto.TrainId);
            if (train == null)
                return BadRequest("Invalid train");

            var bookings = new List<Booking>();

            using var transaction = await _context.Database.BeginTransactionAsync();

            foreach (var seat in dto.SeatNumbers)
            {
                var parts = seat.Split('-');

                if (parts.Length != 2)
                    return BadRequest($"Invalid seat: {seat}");

                var coach = parts[0];
                var seatNumber = int.Parse(parts[1]);

                var exists = await _context.Bookings.AnyAsync(b =>
                    b.TrainId == dto.TrainId &&
                    b.TravelDate.Date == dto.TravelDate.Date &&
                    b.Coach == coach &&
                    b.SeatNumber == seatNumber
                );

                if (exists)
                {
                    return BadRequest(new { message = $"Seat already booked: {seat}" });
                }

                bookings.Add(new Booking
                {
                    UserId = user.Id,
                    TrainId = dto.TrainId,
                    Coach = coach,
                    SeatNumber = seatNumber,
                    TravelDate = dto.TravelDate,
                    Status = "Booked"
                });
            }

            _context.Bookings.AddRange(bookings);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Seats booked successfully",
                seats = dto.SeatNumbers
            });
        }

        [HttpPost("auto-allocate")]
        public IActionResult AutoAllocate(int trainId, string date, int count)
        {
            var travelDate = DateTime.Parse(date);

            var allSeats = GenerateAllSeats();

            var booked = _context.Bookings
                .Where(x => x.TrainId == trainId && x.TravelDate.Date == travelDate.Date)
                .Select(x => x.Coach + "-" + x.SeatNumber)
                .ToList();

            var available = allSeats.Except(booked).ToList();

            // GROUP BY COACH
            var grouped = available
                .GroupBy(s => s.Split('-')[0])
                .Select(g => new
                {
                    Coach = g.Key,
                    Seats = g.OrderBy(x => int.Parse(x.Split('-')[1])).ToList()
                })
                .ToList();

            // TRY SAME COACH + CONTINUOUS
            foreach (var coach in grouped)
            {
                var seats = coach.Seats;

                for (int i = 0; i <= seats.Count - count; i++)
                {
                    var block = seats.Skip(i).Take(count).ToList();

                    var numbers = block.Select(s => int.Parse(s.Split('-')[1])).ToList();

                    bool continuous = true;

                    for (int j = 1; j < numbers.Count; j++)
                    {
                        if (numbers[j] != numbers[j - 1] + 1)
                        {
                            continuous = false;
                            break;
                        }
                    }

                    if (continuous)
                    {
                        return Ok(block.Select(s => new
                        {
                            seat = s,
                            berth = GetBerth(int.Parse(s.Split('-')[1]))
                        }));
                    }
                }
            }

            // fallback (not continuous)
            return Ok(available.Take(count).Select(s => new
            {
                seat = s,
                berth = GetBerth(int.Parse(s.Split('-')[1]))
            }));
        }

        [HttpPost("ticket")]
        public IActionResult GenerateTicket(BookingDTO dto)
        {
            using var ms = new MemoryStream();

            var writer = new PdfWriter(ms);
            var pdf = new PdfDocument(writer);
            var document = new Document(pdf);

            document.Add(new Paragraph("TRAIN TICKET"));
            document.Add(new Paragraph($"Train: {dto.TrainId}"));
            document.Add(new Paragraph($"Date: {dto.TravelDate:yyyy-MM-dd}"));
            document.Add(new Paragraph($"Seats: {string.Join(", ", dto.SeatNumbers)}"));

            document.Close();

            return File(ms.ToArray(), "application/pdf", "ticket.pdf");
        }

        // Service method to generate all seat numbers (for simplicity, 10 coaches with 72 seats each)
        private string GetBerth(int num)
        {
            string[] map = { "LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU" };
            return map[(num - 1) % 8];
        }

        private List<string> GenerateAllSeats()
        {
            var seats = new List<string>();

            var coaches = new[]
            {
                new { Name = "S1", Total = 72 },
                new { Name = "S2", Total = 72 },
                new { Name = "A1", Total = 64 }
            };

            foreach (var c in coaches)
            {
                for (int i = 1; i <= c.Total; i++)
                {
                    seats.Add($"{c.Name}-{i}");
                }
            }

            return seats;
        }

    }
}