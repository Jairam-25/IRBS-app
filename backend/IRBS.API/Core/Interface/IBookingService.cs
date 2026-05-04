using IRBS.API.DTOs;
using IRBS.API.Models;

namespace IRBS.API.Core.Interface
{
    public interface IBookingService
    {
        string GeneratePNR();
        string GetBerth(int num);
        List<string> GenerateAllSeats();
        byte[] GenerateTicketPdf(Train train, BookingDTO bookings, string pnr);

        List<string> AllocateSeats(List<string> availableSeats, int count);
    }
}
