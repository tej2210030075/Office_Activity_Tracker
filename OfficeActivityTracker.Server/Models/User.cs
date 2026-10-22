namespace OfficeActivityTracker.Server.Models;

public class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    // Plain-text password for local demonstration only
    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = "Employee";

    public int? DivisionId { get; set; }

    public Division? Division { get; set; }

    public bool IsActive { get; set; } = true;
}