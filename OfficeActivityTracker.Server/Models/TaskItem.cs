namespace OfficeActivityTracker.Server.Models;

public class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int AssignedById { get; set; }

    public User? AssignedBy { get; set; }

    public int AssignedToId { get; set; }

    public User? AssignedTo { get; set; }

    public int DivisionId { get; set; }

    public Division? Division { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime Deadline { get; set; }

    public string Priority { get; set; } = "Medium";

    public int ProgressPercentage { get; set; } = 0;

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}