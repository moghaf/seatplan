using System.Text.Json.Serialization;

namespace SeatPlan.Api.Entities;

public class Seat
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FunctionId { get; set; }
    public int? PositionX { get; set; }
    public int? PositionY { get; set; }
    [JsonIgnore]
    public Function Function { get; set; } = null!;
    [JsonIgnore]
    public ICollection<SeatAssignment> Assignments { get; set; } = new List<SeatAssignment>();
    [JsonIgnore]
    public ICollection<SeatUnavailability> UnavailableDays { get; set; } = new List<SeatUnavailability>();
}
