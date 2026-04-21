namespace IRBS.API.Models
{
    public class Train
    {
        public int Id { get; set; }
        public string TrainName { get; set; }
        public string FromStation { get; set; }
        public string ToStation { get; set; }
    }
}