using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeActivityTracker.Server.Data;
using OfficeActivityTracker.Server.Models;

namespace OfficeActivityTracker.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TasksController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================
    // GET: api/tasks
    // GET: api/tasks?divisionId=1
    // ============================================
    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] int? divisionId)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.AssignedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.Division)
            .AsQueryable();

        if (divisionId.HasValue)
        {
            query = query.Where(
                t => t.DivisionId == divisionId.Value);
        }

        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.AssignedById,
                AssignedByName = t.AssignedBy!.FullName,
                t.AssignedToId,
                AssignedToName = t.AssignedTo!.FullName,
                t.DivisionId,
                DivisionName = t.Division!.Name,
                t.StartDate,
                t.Deadline,
                t.Priority,
                t.ProgressPercentage,
                t.Status,
                t.CreatedAt
            })
            .ToListAsync();

        return Ok(tasks);
    }

    // ============================================
    // GET: api/tasks/employee/4
    // Retrieve tasks assigned to an employee
    // ============================================
    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetEmployeeTasks(
        int employeeId)
    {
        var employee = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.Id == employeeId &&
                     u.IsActive &&
                     u.Role == "Employee");

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee not found or inactive."
            });
        }

        var tasks = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.AssignedToId == employeeId)
            .Include(t => t.AssignedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.Division)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.AssignedById,
                AssignedByName = t.AssignedBy!.FullName,
                t.AssignedToId,
                AssignedToName = t.AssignedTo!.FullName,
                t.DivisionId,
                DivisionName = t.Division!.Name,
                t.StartDate,
                t.Deadline,
                t.Priority,
                t.ProgressPercentage,
                t.Status,
                t.CreatedAt
            })
            .ToListAsync();

        return Ok(tasks);
    }

    // ============================================
    // POST: api/tasks
    // Create a task for an employee
    // ============================================
    [HttpPost]
    public async Task<IActionResult> CreateTask(
        [FromBody] CreateTaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new
            {
                message = "Task title is required."
            });
        }

        if (request.Deadline.Date < request.StartDate.Date)
        {
            return BadRequest(new
            {
                message = "The deadline cannot be before the start date."
            });
        }

        if (request.Priority is not ("Low" or "Medium" or "High"))
        {
            return BadRequest(new
            {
                message = "Priority must be Low, Medium, or High."
            });
        }

        var division = await _context.Divisions
            .FirstOrDefaultAsync(
                d => d.Id == request.DivisionId);

        if (division == null)
        {
            return BadRequest(new
            {
                message = "The selected division does not exist."
            });
        }

        var assigner = await _context.Users
            .FirstOrDefaultAsync(
                u => u.Id == request.AssignedById &&
                     u.IsActive);

        if (assigner == null)
        {
            return BadRequest(new
            {
                message = "The assigning user does not exist or is inactive."
            });
        }

        if (assigner.Role is not (
            "DivisionalHead1" or "DivisionalHead2"))
        {
            return BadRequest(new
            {
                message = "Only divisional heads can create tasks."
            });
        }

        if (assigner.DivisionId != request.DivisionId)
        {
            return BadRequest(new
            {
                message = "You can only create tasks for your own division."
            });
        }

        var employee = await _context.Users
            .FirstOrDefaultAsync(
                u => u.Id == request.AssignedToId &&
                     u.IsActive);

        if (employee == null ||
            employee.Role != "Employee" ||
            employee.DivisionId != request.DivisionId)
        {
            return BadRequest(new
            {
                message = "Select an active employee from your own division."
            });
        }

        var task = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            AssignedById = assigner.Id,
            AssignedToId = employee.Id,
            DivisionId = division.Id,
            StartDate = request.StartDate,
            Deadline = request.Deadline,
            Priority = request.Priority,
            ProgressPercentage = 0,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetTasks),
            new { divisionId = task.DivisionId },
            new
            {
                message = "Task created successfully.",
                task.Id,
                task.Title,
                task.AssignedToId,
                task.DivisionId,
                task.Deadline,
                task.Status
            });
    }

    // ============================================
    // PUT: api/tasks/1/progress
    // Update task progress and remarks
    // ============================================
    [HttpPut("{taskId:int}/progress")]
    public async Task<IActionResult> UpdateTaskProgress(
        int taskId,
        [FromBody] UpdateTaskProgressRequest request)
    {
        if (request.ProgressPercentage < 0 ||
            request.ProgressPercentage > 100)
        {
            return BadRequest(new
            {
                message = "Progress must be between 0 and 100."
            });
        }

        var employee = await _context.Users
            .FirstOrDefaultAsync(
                u => u.Id == request.EmployeeId &&
                     u.IsActive &&
                     u.Role == "Employee");

        if (employee == null)
        {
            return BadRequest(new
            {
                message = "Employee not found or inactive."
            });
        }

        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return NotFound(new
            {
                message = "Task not found."
            });
        }

        // Employees may update only tasks assigned to them.
        if (task.AssignedToId != employee.Id)
        {
            return Forbid();
        }

        // Update task progress.
        task.ProgressPercentage = request.ProgressPercentage;

        task.Status = request.ProgressPercentage switch
        {
            0 => "Pending",
            100 => "Completed",
            _ => "In Progress"
        };

        // Record the progress update.
        var update = new TaskUpdate
        {
            TaskId = task.Id,
            UpdatedById = employee.Id,
            ProgressPercentage = request.ProgressPercentage,
            Status = task.Status,
            Remarks = request.Remarks?.Trim() ?? string.Empty,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TaskUpdates.Add(update);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Task progress updated successfully.",
            task.Id,
            task.Title,
            task.ProgressPercentage,
            task.Status,
            update.Remarks,
            update.UpdatedAt
        });
    }
}

// ============================================
// REQUEST MODELS
// ============================================

public class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int AssignedById { get; set; }

    public int AssignedToId { get; set; }

    public int DivisionId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime Deadline { get; set; }

    public string Priority { get; set; } = "Medium";
}

public class UpdateTaskProgressRequest
{
    public int EmployeeId { get; set; }

    public int ProgressPercentage { get; set; }

    public string? Remarks { get; set; }
}