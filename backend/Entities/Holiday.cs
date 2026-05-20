namespace SeatPlan.Api.Entities;

public class Holiday
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int Month { get; set; }
    public int Day { get; set; }
}
