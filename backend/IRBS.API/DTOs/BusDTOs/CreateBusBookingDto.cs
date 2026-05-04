namespace IRBS.API.DTOs
{
    public class CreateBusBookingDto
    {
        public int BusId { get; set; }

        public List<string> SeatNumbers { get; set; } = new();

        public DateTime TravelDate { get; set; }
    }
}