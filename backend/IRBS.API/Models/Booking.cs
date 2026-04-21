namespace IRBS.API.Models
{
    public class Booking
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public int TrainId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime TravelDate { get; set; }

        public string Status { get; set; } = "Booked";
    }
}