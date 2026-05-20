using System.Text.Json.Serialization;

namespace SeatPlan.Api.Entities;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public int FunctionId { get; set; }
    [JsonIgnore]
    public Function Function { get; set; } = null!;
    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
}
