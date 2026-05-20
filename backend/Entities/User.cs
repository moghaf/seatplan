namespace SeatPlan.Api.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = "viewer";
    public int? TeamMemberId { get; set; }
    public TeamMember? TeamMember { get; set; }
}
