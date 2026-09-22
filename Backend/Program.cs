using Backend;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Making configurations for CORS and DB
builder.Services.AddCors(opt => opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
builder.Services.AddDbContext<MyDb>(opt => opt.UseSqlite("Data Source=monitorius.db"));

var app = builder.Build();
app.UseCors("AllowAll");

// creating DB
using (var scope = app.Services.CreateScope()) {
    scope.ServiceProvider.GetRequiredService<MyDb>().Database.EnsureCreated();
}

// 2. Data geting and alert authentification
// ---------------------------------------------------------
app.MapPost("/save", async (Metric m, MyDb db) => {
    db.Metrics.Add(m);

    void AddAlert(AlertLog alert)
    {
        db.Alerts.Add(alert);
        var logMessage = $"[{alert.Time:yyyy-MM-dd HH:mm:ss}][{alert.Component}] [{alert.Status}] {alert.Message}";
        File.AppendAllText("logs.txt", logMessage + Environment.NewLine);
    }

    // Alert auth. logic
    if (m.CpuTemp > 1) {
        AddAlert(new AlertLog { 
            Component = "CPU", 
            Status = "Critical", 
            Message = $"Kritinė temperatūra: {m.CpuTemp:0}°C!" 
        });
    }

    // ram usage check logic
    if (m.RamUsage > 1) {
        AddAlert(new AlertLog { 
            Component = "RAM", 
            Status = "Warning", 
            Message = "Check ram usage - " + m.RamUsage.ToString("0.00") + "%"
        });
    }

    // gpu usage check logic
    if (m.GpuLoad > 1) {
        AddAlert(new AlertLog { 
            Component = "GPU", 
            Status = "Warning", 
            Message = "Check gpu usage - " + m.GpuLoad.ToString("0.00") + "%" 
        });
    }

    await db.SaveChangesAsync();
    return Results.Ok();
});

// 3. Alert displaying on client side
// -------------------------------
app.MapGet("/alerts", async (MyDb db) => {
   // update the newest alert for each component
    return await db.Alerts.GroupBy(x => x.Component).Select(g => g.OrderByDescending(x => x.Id).First()).ToListAsync();
});

// present metrics geting
app.MapGet("/data", async (MyDb db) => {
    return await db.Metrics.OrderByDescending(x => x.Id).Take(25).ToListAsync();
});

app.Run("http://localhost:5000");


// last update 2026-09-22