using IRBS.API.Models;

namespace IRBS.API.Core.Interface
{
    public interface INotificationService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendBookingEmailAsync(User user, List<Booking> bookings);
    }
}
