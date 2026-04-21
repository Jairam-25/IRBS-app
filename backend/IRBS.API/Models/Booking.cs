namespace IRBS.API.Models
{
    public class Booking
    {
        public int Id { get; set; }

        // User who booked
        public int UserId { get; set; }
        public User User { get; set; }

        // Train details
        public int TrainId { get; set; }
        public Train Train { get; set; }

        // Seat info
        public string SeatNumber { get; set; }

        // Travel date
        public DateTime TravelDate { get; set; }

        // Booking date
        public DateTime BookingDate { get; set; } = DateTime.Now;

        // Status (Booked / Cancelled)
        public string Status { get; set; } = "Booked";
    }
}