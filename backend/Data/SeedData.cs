using System.Text.Json;

namespace SeatPlan.Api.Data;

public static class SeedData
{
    public static void Seed(SeatPlanDbContext db)
    {
        var basePath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Data");
        var paths = new[]
        {
            Path.Combine(basePath, "seed-data.json"),
            Path.Combine(basePath, "seed-data.sample.json"),
        };

        string? jsonPath = paths.FirstOrDefault(File.Exists);
        if (jsonPath == null)
            throw new FileNotFoundException("Seed data file not found. Provide seed-data.json or seed-data.sample.json in backend/Data/.");

        var json = File.ReadAllText(jsonPath);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        foreach (var f in root.GetProperty("Functions").EnumerateArray())
            db.Functions.Add(new Entities.Function
            {
                Id = f.GetProperty("Id").GetInt32(),
                Name = f.GetProperty("Name").GetString()!,
                Description = f.TryGetProperty("Description", out var desc) ? desc.GetString() : null
            });

        foreach (var t in root.GetProperty("Teams").EnumerateArray())
            db.Teams.Add(new Entities.Team
            {
                Id = t.GetProperty("Id").GetInt32(),
                Name = t.GetProperty("Name").GetString()!,
                Color = t.GetProperty("Color").GetString()!,
                FunctionId = t.GetProperty("FunctionId").GetInt32()
            });

        foreach (var m in root.GetProperty("TeamMembers").EnumerateArray())
            db.TeamMembers.Add(new Entities.TeamMember
            {
                Id = m.GetProperty("Id").GetInt32(),
                Name = m.GetProperty("Name").GetString()!,
                Role = m.TryGetProperty("Role", out var role) ? role.GetString() : null,
                TeamId = m.GetProperty("TeamId").GetInt32()
            });

        foreach (var s in root.GetProperty("Seats").EnumerateArray())
            db.Seats.Add(new Entities.Seat
            {
                Id = s.GetProperty("Id").GetInt32(),
                Name = s.GetProperty("Name").GetString()!,
                FunctionId = s.GetProperty("FunctionId").GetInt32(),
                PositionX = s.TryGetProperty("PositionX", out var px) ? px.GetInt32() : null,
                PositionY = s.TryGetProperty("PositionY", out var py) ? py.GetInt32() : null
            });

        foreach (var h in root.GetProperty("Holidays").EnumerateArray())
            db.Holidays.Add(new Entities.Holiday
            {
                Id = h.GetProperty("Id").GetInt32(),
                Name = h.GetProperty("Name").GetString()!,
                Month = h.GetProperty("Month").GetInt32(),
                Day = h.GetProperty("Day").GetInt32()
            });

        db.SaveChanges();
    }
}