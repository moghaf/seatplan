using Microsoft.EntityFrameworkCore;
using SeatPlan.Api.Entities;

namespace SeatPlan.Api.Data;

public class SeatPlanDbContext(DbContextOptions<SeatPlanDbContext> options) : DbContext(options)
{
    public DbSet<Function> Functions => Set<Function>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Seat> Seats => Set<Seat>();

    public DbSet<SeatAssignment> SeatAssignments => Set<SeatAssignment>();
    public DbSet<SeatUnavailability> SeatUnavailabilities => Set<SeatUnavailability>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Holiday> Holidays => Set<Holiday>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Function>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Name).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<Team>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Name).HasMaxLength(100).IsRequired();
            e.Property(t => t.Color).HasMaxLength(7);
            e.HasOne(t => t.Function)
                .WithMany(f => f.Teams)
                .HasForeignKey(t => t.FunctionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TeamMember>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Name).HasMaxLength(100).IsRequired();
            e.HasOne(m => m.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(m => m.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Seat>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Name).HasMaxLength(50).IsRequired();
            e.HasOne(s => s.Function)
                .WithMany(f => f.Seats)
                .HasForeignKey(s => s.FunctionId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(s => new { s.FunctionId, s.Name }).IsUnique();
        });


        modelBuilder.Entity<SeatAssignment>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasOne(a => a.Seat)
                .WithMany(s => s.Assignments)
                .HasForeignKey(a => a.SeatId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.TeamMember)
                .WithMany(m => m.Assignments)
                .HasForeignKey(a => a.TeamMemberId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(a => new { a.SeatId, a.Date }).IsUnique();
        });

        modelBuilder.Entity<SeatUnavailability>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasOne(u => u.Seat)
                .WithMany(s => s.UnavailableDays)
                .HasForeignKey(u => u.SeatId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(u => new { u.SeatId, u.Date }).IsUnique();
        });

        modelBuilder.Entity<Holiday>(e =>
        {
            e.HasKey(h => h.Id);
            e.Property(h => h.Name).HasMaxLength(100).IsRequired();
            e.HasIndex(h => new { h.Month, h.Day }).IsUnique();
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Username).HasMaxLength(50).IsRequired();
            e.Property(u => u.Role).HasMaxLength(20).IsRequired();
            e.HasOne(u => u.TeamMember)
                .WithMany()
                .HasForeignKey(u => u.TeamMemberId)
                .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
