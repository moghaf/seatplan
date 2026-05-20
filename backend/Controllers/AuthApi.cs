using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class AuthApi
{
    public static RouteGroupBuilder MapAuth(this RouteGroupBuilder group)
    {
        group.MapPost("/login", async (LoginRequest req, SeatPlanDbContext db, IConfiguration config) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
            if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var token = GenerateToken(user, config);
            return Results.Ok(new { token, user = FormatUser(user) });
        }).AllowAnonymous();

        group.MapGet("/users", async (SeatPlanDbContext db) =>
            await db.Users.Select(u => FormatUser(u)).ToListAsync())
            .RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPost("/register", async (RegisterRequest req, SeatPlanDbContext db) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == req.Username))
                return Results.Conflict("Username already exists");

            var user = new User
            {
                Username = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                DisplayName = req.DisplayName,
                Role = req.Role ?? "viewer"
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/auth/users/{user.Id}", FormatUser(user));
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPut("/users/{id:int}/password", async (int id, SetPasswordRequest req, SeatPlanDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPut("/users/{id:int}/team-member", async (int id, SetTeamMemberRequest req, SeatPlanDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            user.TeamMemberId = req.TeamMemberId;
            await db.SaveChangesAsync();
            return Results.Ok(FormatUser(user));
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPut("/me/password", async (ChangePasswordRequest req, SeatPlanDbContext db, HttpContext ctx) =>
        {
            var userId = int.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var user = await db.Users.FindAsync(userId);
            if (user is null) return Results.NotFound();
            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
                return Results.Problem("Current password is incorrect", statusCode: 400);
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return group;
    }

    private static object FormatUser(User u) => new
    {
        u.Id, u.Username, u.DisplayName, u.Role, u.TeamMemberId
    };

    private static string GenerateToken(User user, IConfiguration config)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("displayName", user.DisplayName),
            new Claim("teamMemberId", user.TeamMemberId?.ToString() ?? ""),
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginRequest(string Username, string Password);
public record RegisterRequest(string Username, string Password, string DisplayName, string? Role);
public record SetPasswordRequest(string Password);
public record SetTeamMemberRequest(int? TeamMemberId);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
