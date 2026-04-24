using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/station
        [HttpGet]
        public async Task<IActionResult> GetStations()
        {
            var stations = await _context.Stations
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(stations);
        }
    }
}
