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
    public class TrainBookingService : ITrainBookingService
    {
        public string GeneratePNR()
        {
            return new Random().Next(100000000, 999999999).ToString();
        }

        public string GetBerth(int seatNumber)
        {
            int mod = (seatNumber - 1) % 8;

            return mod switch
            {
                0 => "LB",
                1 => "MB",
                2 => "UB",
                3 => "LB",
                4 => "MB",
                5 => "UB",
                6 => "SL",
                7 => "SU",
                _ => "NA"
            };
        }

        public List<string> GenerateAllSeats()
        {
            var seats = new List<string>();

            var coaches = new List<(string Prefix, int Count, int Seats)>
            {
                ("S", 10, 72),
                ("A", 5, 64),
                ("B", 3, 64)
            };

            foreach (var coachType in coaches)
            {
                for (int c = 1; c <= coachType.Count; c++)
                {
                    string coachName = $"{coachType.Prefix}{c}";

                    for (int i = 1; i <= coachType.Seats; i++)
                    {
                        seats.Add($"{coachName}-{i}");
                    }
                }
            }

            return seats;
        }

        public List<string> AllocateSeats(
            List<string> availableSeats,
            int count)
        {
            var allocated = new List<string>();

            var grouped = availableSeats
                    .GroupBy(s => s.Split('-')[0])
                    .Select(g => new
                    {
                        Coach = g.Key,
                        Seats = g.Select(x => int.Parse(x.Split('-')[1]))
                                  .OrderBy(n => n)
                                  .ToList()
                    })
                    .ToList();

            foreach (var coach in grouped)
            {
                var coachSeats = coach.Seats;

                for (int i = 0; i <= coachSeats.Count - count; i++)
                {
                    var block = coachSeats.Skip(i).Take(count).ToList();

                    bool continuous = true;

                    for (int j = 1; j < block.Count; j++)
                    {
                        if (block[j] != block[j - 1] + 1)
                        {
                            continuous = false;
                            break;
                        }
                    }

                    if (continuous)
                    {
                        return block.Select(n => $"{coach.Coach}-{n}").ToList();
                    }
                }
            }

            // fallback
            return availableSeats.Take(count).ToList();
        }

        // PDF
        public byte[] GenerateTicketPdf(Train? train, BookingDTO? dto, string? pnr)
        {
            using var ms = new MemoryStream();

            var writer = new PdfWriter(ms);
            var pdf = new PdfDocument(writer);
            var doc = new Document(pdf);

            doc.Add(new Paragraph("Indian Railway Booking System E-TICKET")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFontSize(18));

            doc.Add(new Paragraph("\n"));

            // JOURNEY TABLE 
            var journeyTable = new Table(2).UseAllAvailableWidth();

            journeyTable.AddCell("Train Number");
            journeyTable.AddCell(dto?.TrainNumber?.ToString() ?? "N/A");

            journeyTable.AddCell("From");
            journeyTable.AddCell(train?.FromStation ?? "N/A");

            journeyTable.AddCell("To");
            journeyTable.AddCell(train?.ToStation ?? "N/A");

            journeyTable.AddCell("Travel Date");
            journeyTable.AddCell(dto?.TravelDate.ToString("yyyy-MM-dd") ?? "N/A");

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

            for (int i = 0; i < dto?.SeatNumbers.Count; i++)
            {
                var parts = dto.SeatNumbers[i].Split('-');

                table.AddCell(dto.Passengers[i].Name);
                table.AddCell(dto.Passengers[i].Age.ToString());
                table.AddCell(parts[0]);
                table.AddCell(parts[1]);
                table.AddCell(dto.Passengers[i].Berth); 
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
