using IRBS.API.Core.Interface;
using IRBS.API.DTOs;
using IRBS.API.Models;
using IRBS.API.Models.Bus_Model;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

public class NotificationService : INotificationService
{
    private readonly string? _fromEmail;
    private readonly string? _password;

    public NotificationService(IConfiguration configuration)
    {
        _fromEmail = configuration["EmailSettings:FromEmail"];
        _password = configuration["EmailSettings:Password"];
    }

    public async Task SendEmailAsync(string? to, string? subject, string? body)
    {
        var client = new SmtpClient("smtp.gmail.com", 587)
        {
            Credentials = new NetworkCredential(_fromEmail, _password),
            EnableSsl = true
        };

        var mail = new MailMessage(_fromEmail ?? string.Empty, to ?? string.Empty, subject, body);
        await client.SendMailAsync(mail);
        
    }

    public async Task SendBookingEmailAsync(User user, List<TrainBooking> bookings)
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

Thank you for choosing IRBS. We wish you a safe and pleasant journey!

Warm regards,
IRBS Customer Support
";
        await SendEmailAsync(user.Email, subject, body);
    }
    public string BuildBusBookingConfirmation(
        User user,
        CreateBusBookingDto dto,
        string trackingNumber,
        Bus bus)
    {
        var passengerRows = "";

        foreach (var passenger in dto.Passengers)
        {
            passengerRows += $@"
            Seat : {passenger.SeatNumber}
            Passenger : {passenger.Name}
            Age : {passenger.Age}
            Berth : {passenger.Berth}

            ";
                    }

                    return $@"
            Dear {user.Name},

            Your bus booking has been confirmed successfully.

            ========================================

            Tracking Number : {trackingNumber}

            Bus Name : {bus.BusName}
            Bus Number : {bus.BusNumber}

            Route : {bus.FromCity} to {bus.ToCity}

            Travel Date : {dto.TravelDate:dd-MMM-yyyy}

            ========================================
            Passenger Details
            ========================================

            {passengerRows}

            Thank you for choosing IRBS.

            We wish you a safe and pleasant journey.

            Warm regards,
            IRBS Customer Support.
        ";
    }
}
