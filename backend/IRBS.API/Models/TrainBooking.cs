using Swashbuckle.AspNetCore.Annotations;

namespace IRBS.API.Models
{
    public class TrainBooking
    {
        [SwaggerSchema(ReadOnly = true)]
        public int Id { get; set; }

        public int UserId { get; set; }

        public int TrainId { get; set; }

        // Train identifiers
        public string? TrainNumber { get; set; }
        public string? FromStation { get; set; }
        public string? ToStation { get; set; }

        // seat info
        public string Coach { get; set; } = string.Empty;
        public int SeatNumber { get; set; }
        public string? Berth { get; set; }

        // PNR for grouped bookings
        public string? PNR { get; set; }

        // passenger
        public string? PassengerName { get; set; }
        public int PassengerAge { get; set; }

        public DateTime TravelDate { get; set; }
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Booked";

        // navigation
        public Train? Train { get; set; }
        public User? User { get; set; }
    }
}
