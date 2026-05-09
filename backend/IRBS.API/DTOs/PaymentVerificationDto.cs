namespace IRBS.API.DTOs
{
    public class PaymentVerificationDto
    {
        public string? OrderId { get; set; }
        public string? PaymentId { get; set; }
        public string? Signature { get; set; }
        public int BookingId { get; set; }
        public int Amount { get; set; }
    }
}
