using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Data;
using System.Globalization;

namespace SeatPlan.Api.Controllers;

public static class WeeksApi
{
    private static readonly PersianCalendar Persian = new();
    private static readonly string[] DayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];
    private static readonly string[] DayLabels = ["Sat", "Sun", "Mon", "Tue", "Wed"];
    private static readonly string[] PersianMonths =
        ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

    public static RouteGroupBuilder MapWeeks(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (SeatPlanDbContext db) =>
        {
            var today = DateTime.Today;
            var dotw = (int)Persian.GetDayOfWeek(today);
            var daysSinceSaturday = dotw == 6 ? 0 : dotw + 1;
            var saturday = today.AddDays(-daysSinceSaturday);
            var holidays = await db.Holidays.ToListAsync();

            var weeks = new List<object>();
            for (var w = 0; w < 4; w++)
            {
                var start = saturday.AddDays(w * 7);
                var days = new List<object>();
                for (var d = 0; d < 5; d++)
                {
                    var dt = start.AddDays(d);
                    var persianMonth = Persian.GetMonth(dt);
                    var persianDay = Persian.GetDayOfMonth(dt);
                    days.Add(new
                    {
                        date = DateOnly.FromDateTime(dt),
                        dayOfWeek = d + 1,
                        dayName = DayNames[d],
                        shortLabel = DayLabels[d],
                        persianDate = FormatPersianShort(dt),
                        holiday = holidays.FirstOrDefault(h => h.Month == persianMonth && h.Day == persianDay)?.Name
                    });
                }

                var startMonth = Persian.GetMonth(start);
                var endDay = Persian.GetDayOfMonth(start.AddDays(4));
                var endMonth = Persian.GetMonth(start.AddDays(4));
                var label = startMonth == endMonth
                    ? $"{Persian.GetDayOfMonth(start)}-{endDay} {PersianMonths[startMonth - 1]}"
                    : $"{Persian.GetDayOfMonth(start)} {PersianMonths[startMonth - 1]} - {endDay} {PersianMonths[endMonth - 1]}";

                weeks.Add(new { weekNumber = w + 1, label, days });
            }

            return Results.Ok(new { weeks });
        }).AllowAnonymous();

        return group;
    }

    private static string FormatPersianShort(DateTime dt) =>
        $"{Persian.GetDayOfMonth(dt)} {PersianMonths[Persian.GetMonth(dt) - 1]}";
}
