namespace OfficeActivityTracker.Server.Models;

public class Division
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int? HeadUserId { get; set; }

    public User? Head { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
}