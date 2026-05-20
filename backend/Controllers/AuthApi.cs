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

        group.MapGet("/users", async (SeatPlanDbContext db, HttpContext http) =>
        {
            var currentRole = http.User.FindFirstValue(ClaimTypes.Role);
            var currentFnId = http.User.FindFirstValue("functionId");
            List<object> result;
            if (currentRole == "superAdmin")
                result = await db.Users.Select(u => FormatUser(u)).ToListAsync();
            else if (currentRole == "functionAdmin" && int.TryParse(currentFnId, out var fnId))
                result = await db.Users.Where(u => u.FunctionId == fnId || u.Id == GetUserId(http)).Select(u => FormatUser(u)).ToListAsync();
            else
                result = await db.Users.Where(u => u.Id == GetUserId(http)).Select(u => FormatUser(u)).ToListAsync();
            return Results.Ok(result);
        });

        group.MapPost("/register", async (RegisterRequest req, SeatPlanDbContext db) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == req.Username))
                return Results.Conflict("Username already exists");

            var user = new User
            {
                Username = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                DisplayName = req.DisplayName,
                Role = req.Role ?? "user"
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/auth/users/{user.Id}", FormatUser(user));
        }).RequireAuthorization(p => p.RequireRole("superAdmin"));

        group.MapPut("/users/{id:int}/password", async (int id, SetPasswordRequest req, SeatPlanDbContext db, HttpContext http) =>
        {
            var currentRole = http.User.FindFirstValue(ClaimTypes.Role);
            var userId = GetUserId(http);
            if (currentRole != "superAdmin" && userId != id)
                return Results.Forbid();
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPut("/users/{id:int}/team-member", async (int id, SetTeamMemberRequest req, SeatPlanDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            user.TeamMemberId = req.TeamMemberId;
            await db.SaveChangesAsync();
            return Results.Ok(FormatUser(user));
        }).RequireAuthorization(p => p.RequireRole("superAdmin"));

        group.MapPut("/users/{id:int}/role", async (int id, SetRoleRequest req, SeatPlanDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();
            if (req.Role != "user" && req.Role != "functionAdmin" && req.Role != "superAdmin")
                return Results.BadRequest("Invalid role");
            user.Role = req.Role;
            user.FunctionId = req.Role == "functionAdmin" ? req.FunctionId : null;
            await db.SaveChangesAsync();
            return Results.Ok(FormatUser(user));
        }).RequireAuthorization(p => p.RequireRole("superAdmin"));

        group.MapPut("/me/password", async (ChangePasswordRequest req, SeatPlanDbContext db, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
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

    private static int GetUserId(HttpContext http) =>
        int.Parse(http.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private static object FormatUser(User u) => new
    {
        u.Id, u.Username, u.DisplayName, u.Role, u.TeamMemberId, u.FunctionId
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
            new Claim("functionId", user.FunctionId?.ToString() ?? ""),
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
public record SetRoleRequest(string Role, int? FunctionId);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
