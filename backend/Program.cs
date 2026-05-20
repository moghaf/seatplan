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

    if (!db.Functions.Any())
    {
        SeedData.Seed(db);
    }

    if (!db.Users.Any(u => u.Role == "admin"))
    {
        var adminUsername = app.Configuration["Seed:Admin:Username"] ?? "admin";
        var adminPassword = app.Configuration["Seed:Admin:Password"] ?? "admin";
        var adminDisplayName = app.Configuration["Seed:Admin:DisplayName"] ?? "Admin";

        db.Users.Add(new SeatPlan.Api.Entities.User
        {
            Username = adminUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            DisplayName = adminDisplayName,
            Role = "admin"
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
                Role = "viewer",
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
