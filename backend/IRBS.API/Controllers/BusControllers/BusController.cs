using IRBS.API.DTOs.BusDTOs;
using IRBS.API.Models;
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

    [HttpPost]
    public async Task<IActionResult> AddBus(CreateBusDto dto)
    {
        var bus = new Bus
        {
            BusName = dto.BusName,
            BusType = dto.BusType,
            FromCity = dto.FromCity,
            ToCity = dto.ToCity,
            TravelDate = dto.TravelDate,
            DepartureTime = dto.DepartureTime,
            ArrivalTime = dto.ArrivalTime,
            TotalSeats = dto.TotalSeats,
            BookedSeats = 0
        };

        _context.Buses.Add(bus);
        await _context.SaveChangesAsync();

        return Ok(bus);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.Buses.ToListAsync());
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(string from, string to)
    {
        var buses = await _context.Buses
            .Where(x => x.FromCity == from && x.ToCity == to)
            .ToListAsync();

        return Ok(buses);
    }
}
