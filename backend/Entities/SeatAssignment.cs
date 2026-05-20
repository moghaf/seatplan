namespace SeatPlan.Api.Entities;

public class SeatAssignment
{
    public int Id { get; set; }
    public int SeatId { get; set; }
    public Seat Seat { get; set; } = null!;
    public int TeamMemberId { get; set; }
    public TeamMember TeamMember { get; set; } = null!;
    public DateOnly Date { get; set; }
}
