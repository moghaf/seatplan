using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class MembersApi
{
    public static RouteGroupBuilder MapMembers(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (int? functionId, SeatPlanDbContext db) =>
        {
            var query = db.TeamMembers.Include(m => m.Team).AsQueryable();
            if (functionId.HasValue)
                query = query.Where(m => m.Team.FunctionId == functionId.Value);
            return await query.OrderBy(m => m.Name)
                .Select(m => new { m.Id, m.Name, m.Role, m.TeamId, TeamName = m.Team.Name })
                .ToListAsync();
        });

        group.MapPost("/", async (TeamMember member, HttpContext http, SeatPlanDbContext db) =>
        {
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                var team = await db.Teams.FindAsync(member.TeamId);
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || team is null || team.FunctionId != cf)
                    return Results.Forbid();
            }
            db.TeamMembers.Add(member);
            await db.SaveChangesAsync();

            db.Users.Add(new User
            {
                Username = member.Name.ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(member.Name + "1234"),
                DisplayName = member.Name,
                Role = "user",
                TeamMemberId = member.Id
            });
            try
            {
                await db.SaveChangesAsync();
            }
            catch
            {
                db.TeamMembers.Remove(member);
                await db.SaveChangesAsync();
                return Results.Conflict(new { error = "Username already exists" });
            }

            return Results.Created($"/api/members/{member.Id}", member);
        });

        group.MapPut("/{id:int}", async (int id, TeamMember input, HttpContext http, SeatPlanDbContext db) =>
        {
            var member = await db.TeamMembers.Include(m => m.Team).FirstOrDefaultAsync(m => m.Id == id);
            if (member is null) return Results.NotFound();
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                var newTeam = await db.Teams.FindAsync(input.TeamId);
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || member.Team.FunctionId != cf || newTeam?.FunctionId != cf)
                    return Results.Forbid();
            }
            member.Name = input.Name;
            member.Role = input.Role;
            member.TeamId = input.TeamId;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapDelete("/{id:int}", async (int id, HttpContext http, SeatPlanDbContext db) =>
        {
            var member = await db.TeamMembers.Include(m => m.Team).FirstOrDefaultAsync(m => m.Id == id);
            if (member is null) return Results.NotFound();
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || member.Team.FunctionId != cf)
                    return Results.Forbid();
            }
            db.TeamMembers.Remove(member);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return group;
    }
}
