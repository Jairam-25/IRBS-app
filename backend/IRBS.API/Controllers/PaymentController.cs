using IRBS.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Security.Cryptography;
using System.Text;

namespace IRBS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly AppDbContext _context;

        public PaymentController(IConfiguration config, AppDbContext context)
        {
            _config = config;
            _context = context;
        }

        // 🔹 Create Order
        [Authorize]
        [HttpPost("create-order")]
        public IActionResult CreateOrder([FromBody] PaymentRequestDto dto)
        {
            var options = new Dictionary<string, object>
    {
        { "amount", dto.Amount * 100 }, // amount in paise
        { "currency", "INR" },
        { "receipt", Guid.NewGuid().ToString() },
        { "payment_capture", 1 }
    };

            var client = new Razorpay.Api.RazorpayClient(
                _config["Razorpay:Key"],
                _config["Razorpay:Secret"]
            );

            var order = client.Order.Create(options);

            return Ok(new
            {
                success = true,
                orderId = order["id"].ToString(),
                amount = dto.Amount,
                currency = "INR"
            });
        }


        // 🔹 Verify Payment
        [Authorize]
        [HttpPost("verify-payment")]
        public async Task<IActionResult> VerifyPayment([FromBody] PaymentVerificationDto dto)
        {
            var secret = _config["Razorpay:Secret"];

            bool isValid = RazorpayHelper.VerifySignature(dto.OrderId, dto.PaymentId, dto.Signature, secret);

            if (!isValid)
                return BadRequest(new { success = false, message = "Payment verification failed" });

            // Update booking status
            var booking = await _context.Bookings.FindAsync(dto.BookingId);
            if (booking == null) return NotFound("Booking not found");

            booking.Status = "Paid";
            await _context.SaveChangesAsync();

            // 🔔 Send payment receipt notification
            var notifier = new NotificationService();
            var user = await _context.Users.FindAsync(booking.UserId);
            string subject = "Payment Successful - IRBS";
            string body = $@"
Dear {user.Name},

Your payment for booking {booking.Id} has been successfully processed.

Details:
- Train: {booking.TrainId}
- Seat Number: {booking.SeatNumber}
- Travel Date: {booking.TravelDate:dd-MMM-yyyy HH:mm}
- Amount Paid: ₹{dto.Amount}

Thank you for choosing IRBS. Safe travels!

Warm regards,
IRBS Customer Support
";
            await notifier.SendEmailAsync(user.Email, subject, body);

            return Ok(new { success = true, message = "Payment verified successfully" });
        }



        [HttpPost("verify-dummy")]
        public IActionResult VerifyDummyPayment(int bookingId)
        {
            // Dummy verification always success
            var booking = _context.Bookings.FirstOrDefault(b => b.Id == bookingId);
            if (booking == null) return NotFound();

            booking.Status = "Paid";
            _context.SaveChanges();

            return Ok(new { success = true, message = "Dummy payment verified", bookingId = booking.Id });
        }

    }

    public static class RazorpayHelper
    {
        public static bool VerifySignature(string orderId, string paymentId, string signature, string secret)
        {
            var payload = orderId + "|" + paymentId;
            var secretBytes = Encoding.UTF8.GetBytes(secret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);

            using (var hmac = new HMACSHA256(secretBytes))
            {
                var hash = hmac.ComputeHash(payloadBytes);
                var generatedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

                return generatedSignature == signature;
            }
        }
    }
}
