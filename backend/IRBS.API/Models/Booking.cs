using IRBS.API.Models;

namespace IRBS.API.Models
{
    public class Booking
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int TrainId { get; set; }
        public Train Train { get; set; }

        public string Coach { get; set; } = string.Empty; // S1, A1
        public int SeatNumber { get; set; }               // 23

        public DateTime TravelDate { get; set; }

        public string Status { get; set; } = "Booked";
    }
}