using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class HolidaysApi
{
    public static RouteGroupBuilder MapHolidays(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (SeatPlanDbContext db) =>
            await db.Holidays.OrderBy(h => h.Month).ThenBy(h => h.Day).ToListAsync());

        group.MapPost("/", async (Holiday holiday, SeatPlanDbContext db) =>
        {
            db.Holidays.Add(holiday);
            await db.SaveChangesAsync();
            return Results.Created($"/api/holidays/{holiday.Id}", holiday);
        }).RequireAuthorization(p => p.RequireRole("superAdmin"));

        group.MapPut("/{id:int}", async (int id, Holiday input, SeatPlanDbContext db) =>
        {
            var holiday = await db.Holidays.FindAsync(id);
            if (holiday is null) return Results.NotFound();
            holiday.Name = input.Name;
            holiday.Month = input.Month;
            holiday.Day = input.Day;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("superAdmin"));

        group.MapDelete("/{id:int}", async (int id, SeatPlanDbContext db) =>
        {
            var holiday = await db.Holidays.FindAsync(id);
            if (holiday is null) return Results.NotFound();
            db.Holidays.Remove(holiday);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("superAdmin"));

        return group;
    }
}
