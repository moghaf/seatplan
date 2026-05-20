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

        group.MapPost("/", async (TeamMember member, SeatPlanDbContext db) =>
        {
            db.TeamMembers.Add(member);
            await db.SaveChangesAsync();

            db.Users.Add(new User
            {
                Username = member.Name.ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(member.Name + "1234"),
                DisplayName = member.Name,
                Role = "viewer",
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
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPut("/{id:int}", async (int id, TeamMember input, SeatPlanDbContext db) =>
        {
            var member = await db.TeamMembers.FindAsync(id);
            if (member is null) return Results.NotFound();
            member.Name = input.Name;
            member.Role = input.Role;
            member.TeamId = input.TeamId;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapDelete("/{id:int}", async (int id, SeatPlanDbContext db) =>
        {
            var member = await db.TeamMembers.FindAsync(id);
            if (member is null) return Results.NotFound();
            db.TeamMembers.Remove(member);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        return group;
    }
}
