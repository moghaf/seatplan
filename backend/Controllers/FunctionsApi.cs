using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class FunctionsApi
{
    public static RouteGroupBuilder MapFunctions(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (SeatPlanDbContext db) =>
            await db.Functions.OrderBy(f => f.Name)
                .Select(f => new { f.Id, f.Name, f.Description })
                .ToListAsync());

        group.MapGet("/{id:int}", async (int id, SeatPlanDbContext db) =>
            await db.Functions.FindAsync(id) is Function fn
                ? Results.Ok(new { fn.Id, fn.Name, fn.Description })
                : Results.NotFound());

        group.MapPost("/", async (Function input, SeatPlanDbContext db) =>
        {
            db.Functions.Add(input);
            await db.SaveChangesAsync();
            return Results.Created($"/api/functions/{input.Id}", new { input.Id, input.Name, input.Description });
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapPut("/{id:int}", async (int id, Function input, SeatPlanDbContext db) =>
        {
            var fn = await db.Functions.FindAsync(id);
            if (fn is null) return Results.NotFound();
            fn.Name = input.Name;
            fn.Description = input.Description;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        group.MapDelete("/{id:int}", async (int id, SeatPlanDbContext db) =>
        {
            var fn = await db.Functions.FindAsync(id);
            if (fn is null) return Results.NotFound();
            db.Functions.Remove(fn);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("admin"));

        return group;
    }
}
