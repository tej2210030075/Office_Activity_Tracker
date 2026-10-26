using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Data;
using OfficeActivityTracker.Server.Models;

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

    private static readonly string[] AllowedRoles =
    {
        "Admin",
        "DivisionalHead1",
        "DivisionalHead2",
        "Employee"
    };

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

    // GET: api/users/divisions
    [HttpGet("divisions")]
    public async Task<IActionResult> GetDivisions()
    {
        var divisions = await _context.Divisions
            .OrderBy(d => d.Name)
            .Select(d => new
            {
                d.Id,
                d.Name
            })
            .ToListAsync();

        return Ok(divisions);
    }

    // POST: api/users
    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Full name is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password is required."
            });
        }

        var username = request.Username.Trim();

        var role = AllowedRoles.FirstOrDefault(r =>
            r.Equals(
                request.Role?.Trim(),
                StringComparison.OrdinalIgnoreCase));

        if (role == null)
        {
            return BadRequest(new
            {
                message = "Please select a valid role."
            });
        }

        var usernameExists = await _context.Users
            .AnyAsync(u => u.Username == username);

        if (usernameExists)
        {
            return Conflict(new
            {
                message = "This username already exists. Please choose another."
            });
        }

        var divisionError = await ValidateDivision(
            request.DivisionId,
            role);

        if (divisionError != null)
        {
            return BadRequest(new
            {
                message = divisionError
            });
        }

        var newUser = new User
        {
            FullName = request.FullName.Trim(),
            Username = username,
            Password = request.Password,
            Role = role,
            DivisionId = request.DivisionId,
            IsActive = request.IsActive
        };

        _context.Users.Add(newUser);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "The user could not be created. Check whether the username already exists."
            });
        }

        return Created(
            $"/api/users/{newUser.Id}",
            new
            {
                message = "User created successfully.",
                newUser.Id,
                newUser.FullName,
                newUser.Username,
                newUser.Role,
                newUser.DivisionId,
                newUser.IsActive
            });
    }

    // PUT: api/users/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(
        int id,
        [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Full name is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username is required."
            });
        }

        var username = request.Username.Trim();

        var role = AllowedRoles.FirstOrDefault(r =>
            r.Equals(
                request.Role?.Trim(),
                StringComparison.OrdinalIgnoreCase));

        if (role == null)
        {
            return BadRequest(new
            {
                message = "Please select a valid role."
            });
        }

        var usernameExists = await _context.Users.AnyAsync(u =>
            u.Username == username &&
            u.Id != id);

        if (usernameExists)
        {
            return Conflict(new
            {
                message = "This username is already used by another account."
            });
        }

        var divisionError = await ValidateDivision(
            request.DivisionId,
            role);

        if (divisionError != null)
        {
            return BadRequest(new
            {
                message = divisionError
            });
        }

        // Update editable fields only.
        // The existing password is intentionally preserved.
        user.FullName = request.FullName.Trim();
        user.Username = username;
        user.Role = role;
        user.DivisionId = request.DivisionId;
        user.IsActive = request.IsActive;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "The user could not be updated. Check whether the username already exists."
            });
        }

        return Ok(new
        {
            message = "User updated successfully.",
            user.Id,
            user.FullName,
            user.Username,
            user.Role,
            user.DivisionId,
            user.IsActive
        });
    }

    // Validate division assignments for both create and update.
    private async Task<string?> ValidateDivision(
        int? divisionId,
        string role)
    {
        if (role != "Admin" && !divisionId.HasValue)
        {
            return "Please select a division for this user.";
        }

        if (divisionId.HasValue)
        {
            var divisionExists = await _context.Divisions
                .AnyAsync(d => d.Id == divisionId.Value);

            if (!divisionExists)
            {
                return "The selected division does not exist.";
            }
        }

        return null;
    }
}

public class CreateUserRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = "Employee";

    public int? DivisionId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = "Employee";

    public int? DivisionId { get; set; }

    public bool IsActive { get; set; } = true;
}
