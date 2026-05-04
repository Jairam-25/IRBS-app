using System.ComponentModel.DataAnnotations;

namespace IRBS.API.DTOs.BusDTOs
{
    public class CreateBusDto
    {
        [Required]
        public string BusName { get; set; } = string.Empty;
        public string BusType { get; set; } = string.Empty;
        public string FromCity { get; set; } = string.Empty;
        public string ToCity { get; set; } = string.Empty;
        public DateTime TravelDate { get; set; }
        public string DepartureTime { get; set; } = string.Empty;
        public string ArrivalTime { get; set; } = string.Empty;
        public int TotalSeats { get; set; }
        [Range(1, 100000)]
        public decimal Price { get; set; }
    }
}
