using IRBS.API.DTOs;

namespace IRBS.API.DTOs
{
    public class BookingDTO
    {
        public List<string> SeatNumbers { get; set; } = new();
        public DateTime TravelDate { get; set; }
        public string TrainNumber { get; set; }
        public List<PassengerDto> Passengers { get; set; } = new();
    }
}