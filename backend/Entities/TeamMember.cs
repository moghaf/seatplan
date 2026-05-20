using System.Text.Json.Serialization;

namespace SeatPlan.Api.Entities;

public class TeamMember
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Role { get; set; }
    public int TeamId { get; set; }
    [JsonIgnore]
    public Team Team { get; set; } = null!;
    [JsonIgnore]
    public ICollection<SeatAssignment> Assignments { get; set; } = new List<SeatAssignment>();
}
