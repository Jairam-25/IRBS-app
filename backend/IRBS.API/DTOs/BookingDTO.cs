namespace IRBS.API.DTOs
{
    public class BookingDTO
    {
        public int TrainId { get; set; }
        public List<string> SeatNumbers { get; set; } = new();
        public DateTime TravelDate { get; set; }
    }
}
