using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Models;

namespace OfficeActivityTracker.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Division> Divisions => Set<Division>();

    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    public DbSet<TaskUpdate> TaskUpdates => Set<TaskUpdate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Division>()
            .HasOne(d => d.Head)
            .WithMany()
            .HasForeignKey(d => d.HeadUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Division)
            .WithMany(d => d.Users)
            .HasForeignKey(u => u.DivisionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedBy)
            .WithMany()
            .HasForeignKey(t => t.AssignedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedTo)
            .WithMany()
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Division)
            .WithMany()
            .HasForeignKey(t => t.DivisionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskUpdate>()
            .HasOne(u => u.Task)
            .WithMany()
            .HasForeignKey(u => u.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskUpdate>()
            .HasOne(u => u.UpdatedBy)
            .WithMany()
            .HasForeignKey(u => u.UpdatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}