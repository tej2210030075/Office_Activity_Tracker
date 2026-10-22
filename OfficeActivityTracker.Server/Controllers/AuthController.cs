using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Data;

namespace OfficeActivityTracker.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Username and password are required."
            });
        }

        var user = await _context.Users
            .Include(u => u.Division)
            .FirstOrDefaultAsync(u =>
                u.Username == request.Username &&
                u.IsActive);

        if (user == null || user.Password != request.Password)
        {
            return Unauthorized(new
            {
                message = "Invalid username or password."
            });
        }

        return Ok(new
        {
            message = "Login successful.",
            user = new
            {
                user.Id,
                user.FullName,
                user.Username,
                user.Role,
                user.DivisionId,
                DivisionName = user.Division != null
                    ? user.Division.Name
                    : null
            }
        });
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}