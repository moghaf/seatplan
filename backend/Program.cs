using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SeatPlan.Api.Controllers;
using SeatPlan.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SeatPlanDbContext>(opts =>
    opts.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=seatplan.db"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SeatPlan",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SeatPlanApp",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "SuperSecretKey_SeatPlan_2024_Dev_Key_12345678!")),
        };
    });

builder.Services.AddAuthorization(opts =>
{
    opts.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
builder.Services.AddCors(opts => opts.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SeatPlanDbContext>();
    db.Database.EnsureCreated();

    try { db.Database.ExecuteSqlRaw("SELECT PositionX FROM Seats LIMIT 1"); }
    catch
    {
        db.Database.ExecuteSqlRaw("ALTER TABLE Seats ADD COLUMN PositionX INTEGER NULL");
        db.Database.ExecuteSqlRaw("ALTER TABLE Seats ADD COLUMN PositionY INTEGER NULL");
    }

    try
    {
        db.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_SeatAssignments_TeamMemberId_Date ON SeatAssignments(TeamMemberId, Date)");
    }
    catch
    {
        var dupes = db.SeatAssignments
            .GroupBy(a => new { a.TeamMemberId, a.Date })
            .Where(g => g.Count() > 1)
            .ToList();
        foreach (var group in dupes)
            foreach (var dupe in group.OrderBy(a => a.Id).Skip(1))
                db.SeatAssignments.Remove(dupe);
        db.SaveChanges();
        db.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_SeatAssignments_TeamMemberId_Date ON SeatAssignments(TeamMemberId, Date)");
    }

    try { db.Database.ExecuteSqlRaw("SELECT FunctionId FROM Users LIMIT 1"); }
    catch
    {
        db.Database.ExecuteSqlRaw("ALTER TABLE Users ADD COLUMN FunctionId INTEGER NULL");
    }

    db.Database.ExecuteSqlRaw("UPDATE Users SET Role = 'superAdmin' WHERE Role = 'admin'");
    db.Database.ExecuteSqlRaw("UPDATE Users SET Role = 'user' WHERE Role = 'viewer'");

    if (!db.Functions.Any())
    {
        SeedData.Seed(db);
    }

    if (!db.Users.Any(u => u.Role == "superAdmin"))
    {
        var adminUsername = app.Configuration["Seed:Admin:Username"] ?? "admin";
        var adminPassword = app.Configuration["Seed:Admin:Password"] ?? "admin";
        var adminDisplayName = app.Configuration["Seed:Admin:DisplayName"] ?? "Admin";

        db.Users.Add(new SeatPlan.Api.Entities.User
        {
            Username = adminUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            DisplayName = adminDisplayName,
            Role = "superAdmin"
        });
    }

    var existingMemberIds = db.Users.Where(u => u.TeamMemberId != null)
        .Select(u => u.TeamMemberId).ToHashSet();
    foreach (var member in db.TeamMembers.ToList())
    {
        if (!existingMemberIds.Contains(member.Id))
        {
            db.Users.Add(new SeatPlan.Api.Entities.User
            {
                Username = member.Name.ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(member.Name + "1234"),
                DisplayName = member.Name,
                Role = "user",
                TeamMemberId = member.Id
            });
        }
    }
    db.SaveChanges();
}

app.MapGroup("/api/auth").MapAuth();
app.MapGroup("/api/functions").MapFunctions();
app.MapGroup("/api/teams").MapTeams();
app.MapGroup("/api/members").MapMembers();
app.MapGroup("/api/seats").MapSeats();
app.MapGroup("/api/weeks").MapWeeks();
app.MapGroup("/api/assignments").MapAssignments();
app.MapGroup("/api/holidays").MapHolidays();

app.Run();
