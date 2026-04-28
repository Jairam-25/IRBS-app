namespace IRBS.API.DTOs
{
    public class CreateBusBookingDto
    {
        public int BusId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime TravelDate { get; set; }
    }
}