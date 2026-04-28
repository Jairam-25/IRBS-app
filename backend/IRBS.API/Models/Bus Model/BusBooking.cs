using Swashbuckle.AspNetCore.Annotations;

namespace IRBS.API.Models.Bus_Model
{
    public class BusBooking
    {
        [SwaggerSchema(ReadOnly = true)]
        public int Id { get; set; }

        public int UserId { get; set; }

        public int BusId { get; set; }

        public string SeatNumber { get; set; }

        public DateTime TravelDate { get; set; }

        public string Status { get; set; } = "Booked";
    }
}
