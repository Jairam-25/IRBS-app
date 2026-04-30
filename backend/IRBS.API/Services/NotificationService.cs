using IRBS.API.Core.Interface;
using IRBS.API.Models;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

public class NotificationService : INotificationService
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

    public async Task SendBookingEmailAsync(User user, List<Booking> bookings)
    {
        var first = bookings.First();

        var subject = $"Booking Confirmation - {first.TrainNumber}";

        var seats = bookings.Select(b => $"{b.Coach}-{b.SeatNumber}");
        var passengers = bookings.Select(b => $"{b.PassengerName} ({b.PassengerAge})");

        var body = $@"
Dear {user.Name},

Your booking is confirmed.
We are pleased to inform you that your booking has been confirmed.

PNR: {first.PNR}
Train Number: {first.TrainNumber}
From Station: {first.FromStation}
To Station: {first.ToStation}
Travel Date: {first.TravelDate:dd-MMM-yyyy}

Seat Numbers: {string.Join(", ", seats)}
Passengers: {string.Join(", ", passengers)}

Status: CONFIRMED

Thank you for choosing IRBS. 
We wish you a safe and pleasant journey! 

Warm regards, 
IRBS Customer Support.
";

        await SendEmailAsync(user.Email, subject, body);
    }
}
