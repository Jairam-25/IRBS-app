using IRBS.API.Models.Bus_Model;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace IRBS.API.Services
{
    public class TicketPdfService
    {
        public byte[] GenerateBusTicket(BusBooking booking)
        {
            try
            {
                QuestPDF.Settings.License = LicenseType.Community;

                var pdf = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Margin(30);

                        page.Header()
                            .Text("IRBS BUS TICKET")
                            .FontSize(22)
                            .Bold()
                            .AlignCenter();

                        page.Content().Column(col =>
                        {
                            col.Spacing(10);

                            col.Item().Text($"Booking ID : {booking.Id}");                           
                            col.Item().Text($"Bus No.    : {booking.Bus?.BusNumber}");
                            col.Item().Text($"Bus Name   : {booking.Bus?.BusName}");
                            col.Item().Text($"Route      : {booking.Bus?.FromCity} to {booking.Bus?.ToCity}");
                            col.Item().Text($"Travel Date: {booking.TravelDate:dd-MMM-yyyy}");
                            col.Item().Text($"Seats      : {booking.SeatNumber}");
                            col.Item().Text($"Price      : ₹ {booking.Bus?.Price}");
                            col.Item().Text($"Status     : {booking.Status}");
                        });

                        page.Footer()
                            .AlignCenter()
                            .Text("Thank you for choosing IRBS");
                    });
                }).GeneratePdf();

                return pdf;
            }
            catch (Exception ex)
            {
                // Log the exception (you can use any logging framework)
                Console.WriteLine($"Error generating PDF: {ex.ToString}");
                throw new ApplicationException("An error occurred while generating the PDF ticket.", ex);
            }
        }
    }
}