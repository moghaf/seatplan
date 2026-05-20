namespace SeatPlan.Api.Entities;

public class SeatUnavailability
{
    public int Id { get; set; }
    public int SeatId { get; set; }
    public Seat Seat { get; set; } = null!;
    public DateOnly Date { get; set; }
}
