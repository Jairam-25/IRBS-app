using IRBS.API.DTOs;
using IRBS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrainController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrainController(AppDbContext context)
        {
            _context = context;
        }

        // Add Train (Admin use)
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddTrain(Train train)
        {
            _context.Trains.Add(train);
            await _context.SaveChangesAsync();

            return Ok(train);
        }

        // 🚆 Get All Trains
        [HttpGet]
        public async Task<IActionResult> GetTrains()
        {
            var trains = await _context.Trains
                .Select(t => new TrainDto
                {
                    Id = t.Id,
                    TrainName = t.TrainName,
                    FromStation = t.FromStation,
                    ToStation = t.ToStation,
                    Date = t.Date,
                    DepartureTime = t.DepartureTime,
                    ArrivalTime = t.ArrivalTime,
                    TotalSeats = t.TotalSeats,
                    BookedSeats = t.BookedSeats
                })
                .ToListAsync();

            return Ok(trains);
        }

        // 🔍 Search Train (From + To)
        [HttpGet("search")]
        public async Task<IActionResult> Search(string from, string to)
        {
            var trains = await _context.Trains
                .Where(t => t.FromStation == from && t.ToStation == to)
                .ToListAsync();

            return Ok(trains);
        }
    }
}