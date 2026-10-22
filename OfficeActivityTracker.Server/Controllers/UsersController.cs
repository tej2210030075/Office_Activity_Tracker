using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Data;

namespace OfficeActivityTracker.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/users
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Include(u => u.Division)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Username,
                u.Role,
                u.DivisionId,
                DivisionName = u.Division != null
                    ? u.Division.Name
                    : "Not Assigned",
                u.IsActive
            })
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return Ok(users);
    }
}