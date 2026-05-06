export interface BusInterface {
  id: number;
  busName: string;
  busType: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  bookedSeats: number;
  price: number;
}

