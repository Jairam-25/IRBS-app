namespace IRBS.API.DTOs
{
    public class CreateBookingDto
    {
        public int UserId { get; set; }
        public int TrainId { get; set; }
        public string SeatNumber { get; set; }
        public DateTime TravelDate { get; set; }
    }
}
