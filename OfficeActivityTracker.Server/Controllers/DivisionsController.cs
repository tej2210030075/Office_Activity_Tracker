using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Data;

namespace OfficeActivityTracker.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DivisionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DivisionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/divisions
    [HttpGet]
    public async Task<IActionResult> GetDivisions()
    {
        var divisions = await _context.Divisions
            .Include(d => d.Head)
            .Include(d => d.Users)
            .Select(d => new
            {
                d.Id,
                d.Name,

                HeadUserId = d.HeadUserId,

                HeadName = d.Head != null
                    ? d.Head.FullName
                    : "Not Assigned",

                EmployeeCount = d.Users.Count(
                    u => u.Role == "Employee"
                ),

                Employees = d.Users
                    .Where(u => u.Role == "Employee")
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Username,
                        u.IsActive
                    })
                    .ToList()
            })
            .OrderBy(d => d.Id)
            .ToListAsync();

        return Ok(divisions);
    }
}