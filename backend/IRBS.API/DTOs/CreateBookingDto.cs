using IRBS.API.DTOs;

namespace IRBS.API.DTOs
{
    public class CreateBookingDto
    {
        public int TrainId { get; set; }
        public List<string> SeatNumbers { get; set; } = new();
        public DateTime TravelDate { get; set; }
        public List<PassengerDto> Passengers { get; set; } = new();
    }
}
