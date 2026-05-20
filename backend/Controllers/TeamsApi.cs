using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class TeamsApi
{
    public static RouteGroupBuilder MapTeams(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (int? functionId, SeatPlanDbContext db) =>
        {
            var query = db.Teams.AsQueryable();
            if (functionId.HasValue)
                query = query.Where(t => t.FunctionId == functionId.Value);
            return await query.OrderBy(t => t.Name)
                .Select(t => new {
                    t.Id, t.Name, t.Description, t.Color, t.FunctionId,
                    Members = t.Members.OrderBy(m => m.Name).ToList()
                })
                .ToListAsync();
        });

        group.MapGet("/{id:int}", async (int id, SeatPlanDbContext db) =>
            await db.Teams.Include(t => t.Members.OrderBy(m => m.Name))
                .FirstOrDefaultAsync(t => t.Id == id) is Team team
                ? Results.Ok(team) : Results.NotFound());

        group.MapPost("/", async (Team team, SeatPlanDbContext db) =>
        {
            db.Teams.Add(team);
            await db.SaveChangesAsync();
            return Results.Created($"/api/teams/{team.Id}", team);
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPut("/{id:int}", async (int id, Team input, SeatPlanDbContext db) =>
        {
            var team = await db.Teams.FindAsync(id);
            if (team is null) return Results.NotFound();
            team.Name = input.Name;
            team.Description = input.Description;
            team.Color = input.Color;
            team.FunctionId = input.FunctionId;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapDelete("/{id:int}", async (int id, SeatPlanDbContext db) =>
        {
            var team = await db.Teams.FindAsync(id);
            if (team is null) return Results.NotFound();
            db.Teams.Remove(team);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        return group;
    }
}
