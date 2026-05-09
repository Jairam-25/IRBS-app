using Swashbuckle.AspNetCore.Annotations;

namespace IRBS.API.Models.Bus_Model
{
    public class BusBooking
    {
        [SwaggerSchema(ReadOnly = true)]
        public int Id { get; set; }

        public int UserId { get; set; }

        public int BusId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime TravelDate { get; set; }
        public DateTime BookingDate { get; set; }

        public string Status { get; set; } = "Booked";

        // Additional passenger & tracking info
        public string? PassengerName { get; set; }

        public int? PassengerAge { get; set; }

        public string? BusBookingNumber { get; set; }

        //public string? PassengerData { get; set; }

        public string? Berth { get; set; }
        // store the bus registration/identifier (matches Bus.BusNumber)
        public string? BusNumber { get; set; }

        public Bus? Bus { get; set; }

        public User? User { get; set; }
    }
}
