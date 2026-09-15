using Backend;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Konfigūruojame CORS ir DB
builder.Services.AddCors(opt => opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
builder.Services.AddDbContext<MyDb>(opt => opt.UseSqlite("Data Source=monitorius.db"));

var app = builder.Build();
app.UseCors("AllowAll");

// DB sukūrimas
using (var scope = app.Services.CreateScope()) {
    scope.ServiceProvider.GetRequiredService<MyDb>().Database.EnsureCreated();
}

// ---------------------------------------------------------
// 2. DUOMENŲ PRIĖMIMAS IR ALERTŲ TIKRINIMAS
// ---------------------------------------------------------
app.MapPost("/save", async (Metric m, MyDb db) => {
    db.Metrics.Add(m);

    // ČIA PRIDĖTA: Alertų tikrinimo logika
    // Jei CPU temperatūra viršija 10 laipsnių
    if (m.CpuTemp > 1) {
        db.Alerts.Add(new AlertLog { 
            Component = "CPU", 
            Status = "Critical", 
            Message = $"Kritinė temperatūra: {m.CpuTemp:0}°C!" 
        });
    }

    // Jei RAM užpildytas daugiau nei 10%
    if (m.RamUsage > 1) {
        db.Alerts.Add(new AlertLog { 
            Component = "RAM", 
            Status = "Warning", 
            Message = "Check ram usage - " + m.RamUsage.ToString("0.00") + "%"
        });
    }

    // Jei GPU apkrova viršija 1%
    if (m.GpuLoad > 1) {
        db.Alerts.Add(new AlertLog { 
            Component = "GPU", 
            Status = "Warning", 
            Message = "Check gpu usage - " + m.GpuLoad.ToString("0.00") + "%" 
        });
    }

    await db.SaveChangesAsync();
    return Results.Ok();
});

// ---------------------------------------------------------
// 3. ALERTŲ ATIDAVIMAS FRONTENDUI
// ---------------------------------------------------------
app.MapGet("/alerts", async (MyDb db) => {
    // Grąžiname paskutinius 10 įspėjimų
    return await db.Alerts.GroupBy(x => x.Component).Select(g => g.OrderByDescending(x => x.Id).First()).ToListAsync();
});

// Esamas metrikų gavimas
app.MapGet("/data", async (MyDb db) => {
    return await db.Metrics.OrderByDescending(x => x.Id).Take(25).ToListAsync();
});

app.Run("http://localhost:5000");


// last update 2026-09-15