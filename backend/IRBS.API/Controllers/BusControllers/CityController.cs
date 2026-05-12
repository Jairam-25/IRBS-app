using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IRBS.API.Controllers.BusControllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CityController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/city
        [HttpGet]
        public async Task<IActionResult> GetCities()
        {
            var stations = await _context.BusCities
                .OrderBy(s => s.City)
                .ToListAsync();

            return Ok(stations);
        }
    }
}
