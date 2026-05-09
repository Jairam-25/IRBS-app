namespace IRBS.API.DTOs
{
    public class CreateBusBookingDto
    {
        public string? BusNumber { get; set; }

        public DateTime TravelDate { get; set; }

        public List<PassengerBookingDto> Passengers { get; set; } = new();
    }

    public class PassengerBookingDto
    {
        public string Name { get; set; } = string.Empty;

        public int Age { get; set; }

        public string Berth { get; set; } = string.Empty;

        public string SeatNumber { get; set; } = string.Empty;
    }
}