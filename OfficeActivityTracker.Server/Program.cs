using Microsoft.EntityFrameworkCore;
using MySql.EntityFrameworkCore.Extensions;
using OfficeActivityTracker.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// Register controllers
builder.Services.AddControllers();

// Register OpenAPI
builder.Services.AddOpenApi();

// Configure MySQL database connection
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(
    options => options.UseMySQL(connectionString));

// Build the application
var app = builder.Build();

// Seed initial divisions and users
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();

    await DbSeeder.SeedAsync(context);
}

// Configure the HTTP request pipeline
app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// Map API controllers
app.MapControllers();

// Serve the Angular application
app.MapFallbackToFile("/index.html");

app.Run();