using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Models;

namespace OfficeActivityTracker.Server.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Avoid inserting duplicate demo data.
        if (await context.Users.AnyAsync())
        {
            return;
        }

        var division1 = new Division
        {
            Name = "Division 1"
        };

        var division2 = new Division
        {
            Name = "Division 2"
        };

        context.Divisions.AddRange(division1, division2);
        await context.SaveChangesAsync();

        var admin = new User
        {
            FullName = "System Administrator",
            Username = "admin",
            Password = "Admin@123",
            Role = "Admin",
            IsActive = true
        };

        var head1 = new User
        {
            FullName = "Divisional Head 1",
            Username = "head1",
            Password = "Head1@123",
            Role = "DivisionalHead1",
            DivisionId = division1.Id,
            IsActive = true
        };

        var head2 = new User
        {
            FullName = "Divisional Head 2",
            Username = "head2",
            Password = "Head2@123",
            Role = "DivisionalHead2",
            DivisionId = division2.Id,
            IsActive = true
        };

        var employees = new List<User>
        {
            new User
            {
                FullName = "Employee One",
                Username = "emp1",
                Password = "Emp1@123",
                Role = "Employee",
                DivisionId = division1.Id,
                IsActive = true
            },
            new User
            {
                FullName = "Employee Two",
                Username = "emp2",
                Password = "Emp2@123",
                Role = "Employee",
                DivisionId = division1.Id,
                IsActive = true
            },
            new User
            {
                FullName = "Employee Three",
                Username = "emp3",
                Password = "Emp3@123",
                Role = "Employee",
                DivisionId = division2.Id,
                IsActive = true
            },
            new User
            {
                FullName = "Employee Four",
                Username = "emp4",
                Password = "Emp4@123",
                Role = "Employee",
                DivisionId = division2.Id,
                IsActive = true
            }
        };

        context.Users.AddRange(admin, head1, head2);
        context.Users.AddRange(employees);

        await context.SaveChangesAsync();

        // Link each division to its respective head.
        division1.HeadUserId = head1.Id;
        division2.HeadUserId = head2.Id;

        await context.SaveChangesAsync();
    }
}