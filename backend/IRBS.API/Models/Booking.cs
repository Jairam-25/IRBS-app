using IRBS.API.Models;

namespace IRBS.API.Models
{
    public class TrainBooking
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int TrainId { get; set; }
        public Train Train { get; set; }

        public string TrainNumber { get; set; } 
        public string FromStation { get; set; }  
        public string ToStation { get; set; }    

        public string Coach { get; set; } = string.Empty; // S1, A1
        public int SeatNumber { get; set; }               // 23

        public DateTime TravelDate { get; set; }

        public string PassengerName { get; set; }
        public int PassengerAge { get; set; }

        public string PNR { get; set; }

        public string Berth { get; set; } = string.Empty;

        public string Status { get; set; } = "Booked";
    }
}