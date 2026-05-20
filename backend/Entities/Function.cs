namespace SeatPlan.Api.Entities;

public class Function
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Team> Teams { get; set; } = new List<Team>();
    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}
