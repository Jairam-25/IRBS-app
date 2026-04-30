namespace IRBS.API.DTOs
{
    public class TrainDto
    {
        public string TrainNumber { get; set; }
        public string TrainName { get; set; }
        public string FromStation { get; set; }
        public string ToStation { get; set; }

        public DateTime Date { get; set; }
        public string DepartureTime { get; set; }
        public string ArrivalTime { get; set; }

        public int TotalSeats { get; set; }
        public int BookedSeats { get; set; }
        public int AvailableSeats => TotalSeats - BookedSeats;
    }
}
