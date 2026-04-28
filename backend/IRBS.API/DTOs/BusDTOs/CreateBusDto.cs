namespace IRBS.API.DTOs.BusDTOs
{
    public class CreateBusDto
    {
        public string BusName { get; set; } = string.Empty;
        public string BusType { get; set; } = string.Empty;
        public string FromCity { get; set; } = string.Empty;
        public string ToCity { get; set; } = string.Empty;
        public DateTime TravelDate { get; set; }
        public string DepartureTime { get; set; } = string.Empty;
        public string ArrivalTime { get; set; } = string.Empty;
        public int TotalSeats { get; set; }
    }
}
