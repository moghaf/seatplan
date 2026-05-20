using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class AssignmentsApi
{
    public static RouteGroupBuilder MapAssignments(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (SeatPlanDbContext db) =>
            await db.SeatAssignments.Include(a => a.Seat).Include(a => a.TeamMember).ToListAsync());

        group.MapPost("/", async (SeatAssignment assignment, HttpContext http, SeatPlanDbContext db) =>
        {
            var userTeamMemberId = GetUserTeamMemberId(http);
            var role = http.User.FindFirstValue(ClaimTypes.Role);

            if (role != "admin")
            {
                if (userTeamMemberId is null || assignment.TeamMemberId != userTeamMemberId.Value)
                    return Results.Forbid();
            }




            var persian = new PersianCalendar();
            var dt = assignment.Date.ToDateTime(TimeOnly.MinValue);
            var pm = persian.GetMonth(dt);
            var pd = persian.GetDayOfMonth(dt);
            var isHoliday = await db.Holidays.AnyAsync(h => h.Month == pm && h.Day == pd);
            if (isHoliday)
                return Results.BadRequest("Cannot assign on a holiday.");

            var exists = await db.SeatAssignments.AnyAsync(a =>
                a.SeatId == assignment.SeatId && a.Date == assignment.Date);
            if (exists)
                return Results.Conflict("Seat already assigned on this day.");

            db.SeatAssignments.Add(assignment);
            await db.SaveChangesAsync();
            return Results.Created($"/api/assignments/{assignment.Id}", assignment);
        });

        group.MapDelete("/{id:int}", async (int id, HttpContext http, SeatPlanDbContext db) =>
        {
            var a = await db.SeatAssignments.FindAsync(id);
            if (a is null) return Results.NotFound();

            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "admin")
            {
                var userTeamMemberId = GetUserTeamMemberId(http);
                if (userTeamMemberId is null || a.TeamMemberId != userTeamMemberId.Value)
                    return Results.Forbid();
            }

            db.SeatAssignments.Remove(a);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return group;
    }

    private static int? GetUserTeamMemberId(HttpContext http)
    {
        var val = http.User.FindFirstValue("teamMemberId");
        return int.TryParse(val, out var id) ? id : null;
    }
}
