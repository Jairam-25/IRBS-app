namespace IRBS.API.DTOs
{
    public class BookSeatsDto
    {
        public int TrainId { get; set; }
        public List<string> SeatNumbers { get; set; } = new();
        public DateTime TravelDate { get; set; }
    }
}
