using IRBS.API.DTOs.BusDTOs;
using IRBS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class BusController : ControllerBase
{
    private readonly AppDbContext _context;

    public BusController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> AddBus(CreateBusDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var bus = new Bus
            {
                BusName = dto.BusName,
                BusNumber = dto.BusNumber,
                BusType = dto.BusType,
                FromCity = dto.FromCity,
                ToCity = dto.ToCity,
                TravelDate = dto.TravelDate,
                DepartureTime = dto.DepartureTime,
                ArrivalTime = dto.ArrivalTime,
                TotalSeats = dto.TotalSeats,

                BookedSeats = 0,
                Price = dto.Price,

                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Buses.Add(bus);
            await _context.SaveChangesAsync();

            return Ok(bus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
       if(!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        return Ok(await _context.Buses.ToListAsync());
    }

    [Authorize]
    [HttpGet("search")]
    public async Task<IActionResult> Search(string from, string to)
    {
        if (from == null || to == null)
        {
            return BadRequest("From and To parameters are required.");
        }
           var buses = await _context.Buses
          .Where(x => x.FromCity == from && x.ToCity == to)
            .ToListAsync();

            return Ok(buses);
        
    }
}
