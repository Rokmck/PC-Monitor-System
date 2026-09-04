using Microsoft.EntityFrameworkCore;

namespace Backend;

// 1. KLASĖS PAVADINIMAS: Metric
public class Metric 
{
    public int Id { get; set; }
    public DateTime Time { get; set; } = DateTime.Now;
    
    // UŽTIKRINK, KAD ČIA NĖRA KINTAMOJO VARDU "Metric"
    public float CpuLoad { get; set; }
    public float CpuTemp { get; set; }
    public float GpuLoad { get; set; }
    public float GpuTemp { get; set; }
    public float RamUsage { get; set; }
}

// 2. Alertų modelis
public class AlertLog 
{
    public int Id { get; set; }
    public DateTime Time { get; set; } = DateTime.Now;
    public string Component { get; set; } = ""; 
    public string Status { get; set; } = "";    
    public string Message { get; set; } = "";
}

// 3. Duomenų bazė
public class MyDb : DbContext 
{
    public MyDb(DbContextOptions<MyDb> options) : base(options) { }

    // Čia viskas gerai, nes kintamieji vadinasi daugiskaita (Metrics ir Alerts)
    public DbSet<Metric> Metrics => Set<Metric>();
    public DbSet<AlertLog> Alerts => Set<AlertLog>();
}