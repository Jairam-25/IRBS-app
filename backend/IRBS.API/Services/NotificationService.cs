using IRBS.API.Models;
using IRBS.API.Models.Bus_Model;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

public class NotificationService
{
    private readonly string _fromEmail = "irbs2026@gmail.com";
    private readonly string _password = "yjwv ubmf wzvi gnzn";

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var client = new SmtpClient("smtp.gmail.com", 587)
        {
            Credentials = new NetworkCredential(_fromEmail, _password),
            EnableSsl = true
        };

        var mail = new MailMessage(_fromEmail, to, subject, body);
        await client.SendMailAsync(mail);
    }

    public string BuildBookingConfirmation(User user, Booking booking)
    {
        return $@"
Dear {user.Name},

We are pleased to inform you that your booking has been confirmed.

Booking Details:
- Train Number: {booking.TrainId}
- Train Name: {booking.Train.TrainName}
- From Station: {booking.Train.FromStation} 
- To Station: {booking.Train.ToStation}
- Seat Number: {booking.SeatNumber}
- Travel Date: {booking.TravelDate:dd-MMM-yyyy HH:mm}
- Status: {booking.Status}

Thank you for choosing IRBS. We wish you a safe and pleasant journey!

Warm regards,
IRBS Customer Support
";
    }
    public string BuildBusBookingConfirmation(User user, BusBooking booking, Bus bus)
    {
        return $@"
    Dear {user.Name},

 We are pleased to inform you that your booking has been confirmed.

    Bus Name: {bus.BusName}
    Route: {bus.FromCity} to {bus.ToCity}
    Seat: {booking.SeatNumber}
    Date: {booking.TravelDate:dd-MMM-yyyy}
Thank you for choosing IRBS. We wish you a safe and pleasant journey!

Warm regards,
IRBS Customer Support
";
    }
}
