using IRBS.API.DTOs;
using IRBS.API.Models;

namespace IRBS.API.Core.Interface
{
    public interface INotificationService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendBookingEmailAsync(User user, List<TrainBooking> bookings);
        string BuildBusBookingConfirmation(
        User user,
        CreateBusBookingDto dto,
        string trackingNumber,
        Bus bus);
    }
}
