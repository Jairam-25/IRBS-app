using System.ComponentModel.DataAnnotations;

namespace IRBS.API.Models
{
    public class Bus
    {
        public int Id { get; set; }

        [StringLength(100)]
        public string BusName { get; set; } = string.Empty;
        public string? BusNumber { get; set; } 

        [Required]
        public string BusType { get; set; } = string.Empty;

        [Required]
        public string FromCity { get; set; } = string.Empty;

        [Required]
        public string ToCity { get; set; } = string.Empty;

        public DateTime TravelDate { get; set; }

        [Required]
        public string DepartureTime { get; set; } = string.Empty;

        [Required]
        public string ArrivalTime { get; set; } = string.Empty;

        [Range(1, 100)]
        public int TotalSeats { get; set; }

        public int BookedSeats { get; set; } = 0;

        [Range(1, 100000)]
        public decimal Price { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
