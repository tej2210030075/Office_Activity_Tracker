namespace OfficeActivityTracker.Server.Models;

public class TaskUpdate
{
    public int Id { get; set; }

    public int TaskId { get; set; }

    public TaskItem? Task { get; set; }

    public int UpdatedById { get; set; }

    public User? UpdatedBy { get; set; }

    public int ProgressPercentage { get; set; }

    public string Status { get; set; } = "Pending";

    public string Remarks { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}