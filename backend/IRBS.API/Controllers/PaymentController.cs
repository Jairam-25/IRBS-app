using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;

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
        public IActionResult CreateOrder(decimal amount)
        {
            var key = _config["Razorpay:Key"];
            var secret = _config["Razorpay:Secret"];

            var client = new RazorpayClient(key, secret);

            var options = new Dictionary<string, object>
            {
                { "amount", amount * 100 }, // paise
                { "currency", "INR" },
                { "receipt", $"IRBS-{ Guid.NewGuid().ToString().Substring(0, 20) }"}
            };

            var order = client.Order.Create(options);
            return Ok(new 
            { 
                orderId = order["id"].ToString()
            });
        }

        // 🔹 Verify Payment
        [Authorize]
        [HttpPost("verify")]
        public IActionResult VerifyPayment(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature)
        {
            var attributes = new Dictionary<string, string>
            {
                { "razorpay_order_id", razorpayOrderId },
                { "razorpay_payment_id", razorpayPaymentId },
                { "razorpay_signature", razorpaySignature }
            };

            try
            {
                Utils.verifyPaymentSignature(attributes);
                return Ok(new { success = true, message = "Payment verified successfully" });
            }
            catch
            {
                return BadRequest(new { success = false, message = "Payment verification failed" });
            }
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
}
