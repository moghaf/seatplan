using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Controllers;

public static class SeatsApi
{
    public static RouteGroupBuilder MapSeats(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (int? functionId, SeatPlanDbContext db) =>
        {
            var query = db.Seats.AsQueryable();
            if (functionId.HasValue)
                query = query.Where(s => s.FunctionId == functionId.Value);
            return await query.OrderBy(s => s.Name).ToListAsync();
        });

        group.MapGet("/with-assignments", async (int? functionId, SeatPlanDbContext db) =>
        {
            var query = db.Seats
                .Include(s => s.Assignments).ThenInclude(a => a.TeamMember).ThenInclude(m => m.Team)
                .Include(s => s.UnavailableDays)
                .AsQueryable();

            if (functionId.HasValue)
                query = query.Where(s => s.FunctionId == functionId.Value);

            var seats = await query.OrderBy(s => s.Name).ToListAsync();
            return seats.Select(s => new {
                s.Id, s.Name, s.FunctionId, s.PositionX, s.PositionY,
                Assignments = s.Assignments.Select(a => new {
                    a.Id, a.TeamMemberId, a.Date,
                    MemberName = a.TeamMember.Name,
                    TeamName = a.TeamMember.Team.Name,
                    TeamColor = a.TeamMember.Team.Color
                }),
                DisabledDates = s.UnavailableDays.Select(u => u.Date).ToList()
            });
        });

        group.MapPost("/", async (Seat seat, HttpContext http, SeatPlanDbContext db) =>
        {
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || cf != seat.FunctionId)
                    return Results.Forbid();
            }
            db.Seats.Add(seat);
            await db.SaveChangesAsync();
            return Results.Created($"/api/seats/{seat.Id}", seat);
        });

        group.MapPut("/{id:int}", async (int id, Seat input, HttpContext http, SeatPlanDbContext db) =>
        {
            var seat = await db.Seats.FindAsync(id);
            if (seat is null) return Results.NotFound();
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || cf != seat.FunctionId || cf != input.FunctionId)
                    return Results.Forbid();
            }
            seat.Name = input.Name;
            seat.FunctionId = input.FunctionId;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapDelete("/{id:int}", async (int id, HttpContext http, SeatPlanDbContext db) =>
        {
            var seat = await db.Seats.FindAsync(id);
            if (seat is null) return Results.NotFound();
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || cf != seat.FunctionId)
                    return Results.Forbid();
            }
            db.Seats.Remove(seat);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/{seatId:int}/toggle-unavailable", async (int seatId, ToggleUnavailableRequest req, HttpContext http, SeatPlanDbContext db) =>
        {
            var seat = await db.Seats.FindAsync(seatId);
            if (seat is null) return Results.NotFound();
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || cf != seat.FunctionId)
                    return Results.Forbid();
            }
            var date = req.Date;
            var existing = await db.SeatUnavailabilities
                .FirstOrDefaultAsync(u => u.SeatId == seatId && u.Date == date);
            if (existing is not null)
            {
                db.SeatUnavailabilities.Remove(existing);
            }
            else
            {
                db.SeatUnavailabilities.Add(new SeatUnavailability { SeatId = seatId, Date = date });
            }
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/{seatId:int}/position", async (int seatId, SetPositionRequest req, HttpContext http, SeatPlanDbContext db) =>
        {
            var seat = await db.Seats.FindAsync(seatId);
            if (seat is null) return Results.NotFound();
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            if (role != "superAdmin")
            {
                var fnId = http.User.FindFirstValue("functionId");
                if (role != "functionAdmin" || !int.TryParse(fnId, out var cf) || cf != seat.FunctionId)
                    return Results.Forbid();
            }
            seat.PositionX = req.PositionX;
            seat.PositionY = req.PositionY;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return group;
    }
}

public record ToggleUnavailableRequest(DateOnly Date);
public record SetPositionRequest(int PositionX, int PositionY);
