using IRBS.API.Core.Interface;
using IRBS.API.DTOs;
using IRBS.API.Models;
using iText.IO.Image;
using iText.Kernel.Colors;
using iText.Kernel.Pdf;
using iText.Layout.Element;
using iText.Layout.Properties;
using QRCoder;
using iText.Layout;

namespace IRBS.API.Services
{
    public class BookingService : IBookingService
    {
        public string GeneratePNR()
        {
            return new Random().Next(100000000, 999999999).ToString();
        }

        public string GetBerth(int num)
        {
            string[] map = { "LB", "MB", "UB", "LB", "MB", "UB", "SL", "SU" };
            return map[(num - 1) % 8];
        }

        public List<string> GenerateAllSeats()
        {
            var seats = new List<string>();

            var coaches = new[]
            {
                new { Name = "S1", Total = 72 },
                new { Name = "S2", Total = 72 },
                new { Name = "A1", Total = 64 }
            };

            foreach (var c in coaches)
            {
                for (int i = 1; i <= c.Total; i++)
                {
                    seats.Add($"{c.Name}-{i}");
                }
            }

            return seats;
        }

        public byte[] GenerateTicketPdf(Train train, BookingDTO bookings, string pnr)
        {
            using var ms = new MemoryStream();

            var writer = new PdfWriter(ms);
            var pdf = new PdfDocument(writer);
            var doc = new Document(pdf);

            // HEADER 
            doc.Add(new Paragraph("Indian Railway Booking System E-TICKET")
                .SetFontSize(18)
                .SetFontSize(18)
                .SetTextAlignment(TextAlignment.CENTER));

            doc.Add(new Paragraph("\n"));

            // JOURNEY TABLE 
            var journeyTable = new Table(2).UseAllAvailableWidth();

            journeyTable.AddCell("Train Number");
            journeyTable.AddCell(bookings.TrainNumber.ToString());

            journeyTable.AddCell("From");
            journeyTable.AddCell(train.FromStation);

            journeyTable.AddCell("To");
            journeyTable.AddCell(train.ToStation);

            journeyTable.AddCell("Travel Date");
            journeyTable.AddCell(bookings.TravelDate.ToString("yyyy-MM-dd"));

            journeyTable.AddCell("PNR");
            journeyTable.AddCell(pnr);

            doc.Add(journeyTable);

            doc.Add(new Paragraph("\n"));

            // PASSENGER TABLE 
            var table = new Table(5).UseAllAvailableWidth();

            table.AddHeaderCell("Passenger");
            table.AddHeaderCell("Age");
            table.AddHeaderCell("Coach");
            table.AddHeaderCell("Seat");
            table.AddHeaderCell("Berth");

            for (int i = 0; i < bookings.SeatNumbers.Count; i++)
            {
                var seat = bookings.SeatNumbers[i];
                var parts = seat.Split('-');

                string coach = parts[0];
                int number = int.Parse(parts[1]);

                var passenger = bookings.Passengers.Count > i
                    ? bookings.Passengers[i]
                    : new PassengerDto { Name = $"Passenger {i + 1}", Age = 0 };

                table.AddCell(passenger.Name);
                table.AddCell(passenger.Age.ToString());
                table.AddCell(coach);
                table.AddCell(number.ToString());
                table.AddCell(GetBerth(number));
            }

            doc.Add(table);

            doc.Add(new Paragraph("\n"));

            // STATUS 
            doc.Add(new Paragraph("Status: CONFIRMED")
                .SetFontSize(18)
                .SetFontColor(ColorConstants.GREEN));

            doc.Add(new Paragraph("\n"));

            // QR CODE 
            var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode($"PNR:{pnr}", QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrData);
            var qrBytes = qrCode.GetGraphic(20);

            var qrImage = new Image(ImageDataFactory.Create(qrBytes))
                .SetWidth(100)
                .SetHorizontalAlignment(HorizontalAlignment.CENTER);

            doc.Add(qrImage);

            doc.Add(new Paragraph("\n"));

            // FOOTER 
            doc.Add(new Paragraph("Carry valid ID proof during journey")
                .SetFontSize(10)
                .SetTextAlignment(TextAlignment.CENTER));

            doc.Close();

            return ms.ToArray();
        }
    }
}
