using IRBS.API.Core.Interface;
using IRBS.API.DTOs;
using IRBS.API.Models;
using iText.IO.Image;
using iText.Kernel.Colors;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Crypto.Macs;
using QRCoder;
using System.Security.Claims;


namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IBookingService _bookingService;
        private readonly INotificationService _notificationService;

        public BookingController(AppDbContext context, IBookingService bookingService, INotificationService notificationService )
        {
            _context = context;
            _bookingService = bookingService;
            _notificationService = notificationService;
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
        public async Task<IActionResult> BookSeat(BookingDTO dto)
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
            var train = await _context.Trains.FindAsync(dto.TrainNumber );
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
                b.TrainNumber == dto.TrainNumber &&
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
                TrainNumber = dto.TrainNumber,
                Coach = coach,
                SeatNumber = seatNumber,
                TravelDate = dto.TravelDate,
                Status = "Booked"
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Send notification
            await _notificationService.SendBookingEmailAsync(user, new List<Booking> { booking });
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

        [Authorize]
        [HttpGet("ticket/{pnr}")]
        public async Task<IActionResult> GetTicketByPNR(string pnr)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Train)
                .Where(b => b.PNR == pnr)
                .OrderBy(b => b.Id)
                .ToListAsync();

            if (!bookings.Any())
                return NotFound(new { message = "Invalid PNR. Please enter the valid PNR" });

            var train = bookings.FirstOrDefault()?.Train;
            if (train == null) 
            { 
                return BadRequest("Train data missing"); 
            }

            return Ok(new
            {
                pnr = pnr,
                trainNumber = train.TrainNumber,
                trainName = train.TrainName,
                from = train.FromStation,
                to = train.ToStation,
                date = bookings.First().TravelDate,
                seats = bookings
                    .Select(b => $"{b.Coach}-{b.SeatNumber}")
                    .ToList(),
                passengers = bookings.Select(b => new
                {
                    name = b.PassengerName,
                    age = b.PassengerAge,
                    Berth = b.Berth
                }).ToList(),
                status = bookings?.FirstOrDefault()?.Status
            });
        }

        [Authorize]
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
        public async Task<IActionResult> BookMultiple(BookingDTO dto)
        {
            if (dto.Passengers == null || !dto.Passengers.Any())
                return BadRequest("No passengers");

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Unauthorized();

            var train = await _context.Trains
                .FirstOrDefaultAsync(t => t.TrainNumber == dto.TrainNumber);

            if (train == null)
                return BadRequest(new { message = $"Invalid train number: {dto.TrainNumber}" });

            // ALL SEATS
            var allSeats = _bookingService.GenerateAllSeats();

            var bookedSeats = await _context.Bookings
                .Where(b => b.TrainNumber == dto.TrainNumber &&
                            b.TravelDate.Date == dto.TravelDate.Date)
                .Select(b => $"{b.Coach}-{b.SeatNumber}")
                .ToListAsync();

            var availableSeats = allSeats.Except(bookedSeats).ToList();

            // AUTO ALLOCATE
            var allocatedSeats = dto.SeatNumbers;

            // Check seat count match
            if (dto.SeatNumbers.Count != dto.Passengers.Count)
                return BadRequest("Seat count and passenger count mismatch");

            // Check availability
            foreach (var seat in dto.SeatNumbers)
            {
                if (!availableSeats.Contains(seat))
                    return BadRequest($"Seat {seat} not available");
            }

            if (allocatedSeats.Count < dto.Passengers.Count)
                return BadRequest("Not enough seats");

            var pnr = _bookingService.GeneratePNR();
            var bookings = new List<Booking>();

            using var tx = await _context.Database.BeginTransactionAsync();

            for (int i = 0; i < allocatedSeats.Count; i++)
            {
                var parts = allocatedSeats[i].Split('-');

                int seatNumber = int.Parse(parts[1]);
                string coach = parts[0];

                var berth = _bookingService.GetBerth(seatNumber);

                bookings.Add(new Booking
                {
                    UserId = user.Id,
                    TrainId = train.Id,

                    TrainNumber = train.TrainNumber,
                    FromStation = train.FromStation,
                    ToStation = train.ToStation,

                    Coach = coach,
                    SeatNumber = seatNumber,
                    Berth = berth,

                    TravelDate = dto.TravelDate,

                    PassengerName = dto.Passengers[i].Name,
                    PassengerAge = dto.Passengers[i].Age,

                    PNR = pnr
                });

                dto.Passengers[i].Berth = berth; 
            }

            _context.Bookings.AddRange(bookings);
            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            dto.SeatNumbers = allocatedSeats;

            var pdf = _bookingService.GenerateTicketPdf(train, dto, pnr);

            return File(pdf, "application/pdf", $"Ticket_{pnr}.pdf");
        }

        [HttpPost("auto-allocate")]
        public IActionResult AutoAllocate(int trainId, string date, int count)
        {
            var travelDate = DateTime.Parse(date);

            var allSeats = _bookingService.GenerateAllSeats();

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
                            berth = _bookingService.GetBerth(int.Parse(s.Split('-')[1]))
                        }));
                    }
                }
            }

            // fallback (not continuous)
            return Ok(available.Take(count).Select(s => new
            {
                seat = s,
                berth = _bookingService.GetBerth(int.Parse(s.Split('-')[1]))
            }));
        }

        [Authorize]
        [HttpGet("ticket/{pnr}/pdf")]
        public async Task<IActionResult> DownloadTicketByPNR(string pnr)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Train)
                .Where(b => b.PNR == pnr)
                .ToListAsync();

            if (!bookings.Any())
                return NotFound(new { message = "Invalid PNR" });

            var train = bookings.First().Train;

            // Build DTO manually
            var dto = new BookingDTO
            {
                TrainNumber = train.TrainNumber,
                TravelDate = bookings.First().TravelDate,
                SeatNumbers = bookings
                    .Select(b => $"{b.Coach}-{b.SeatNumber}")
                    .ToList(),
                Passengers = bookings.Select(b => new PassengerDto
                {
                    Name = b.PassengerName,
                    Age = b.PassengerAge,
                    Berth = b.Berth
                }).ToList()
            };

            var pdf = _bookingService.GenerateTicketPdf(train, dto, pnr);

            return File(pdf, "application/pdf", $"Ticket_{pnr}.pdf");
        }
    }
}