using System.Net.Http.Json;
using LibreHardwareMonitor.Hardware;

// 1. Sukonfigūruojame jutiklius: pridedame GPU sekimą
var computer = new Computer 
{ 
    IsCpuEnabled = true, 
    IsGpuEnabled = true, // Įjungiame vaizdo plokštę
    IsMemoryEnabled = true 
};

computer.Open();

var http = new HttpClient();

Console.WriteLine(">>> Agentas (v2) paleistas.");
Console.WriteLine(">>> Renku duomenis: CPU, GPU, RAM ir Temperatūras..."); // del kompo savybiu cpu nesurenka cpu temperaturos ir tt..

while (true) {
    float cpuL = 0, cpuT = 0, gpuL = 0, gpuT = 0, ram = 0;

    foreach (var hw in computer.Hardware) {
        hw.Update();
        foreach (var s in hw.Sensors) {
            // CPU Sektorius
            if (hw.HardwareType == HardwareType.Cpu) {
                if (s.SensorType == SensorType.Load) cpuL = s.Value ?? 0;
                
                if (s.SensorType == SensorType.Temperature) {
                    // Išspausdinam viską, ką randam, kad žinotume vardus
                    Console.WriteLine($"[CPU TEMP] Rastas jutiklis: {s.Name} = {s.Value}°C");
                    
                    // Bandom pagauti pagrindinę temperatūrą
                    // Jei tai Intel - dažniausiai "Core Average" arba "Package"
                    // Jei tai AMD - dažniausiai "Core (Tctl/Tdie)"
                    if (s.Name.Contains("Package") || s.Name.Contains("Average") || s.Name.Contains("Tctl") || cpuT == 0) {
                        cpuT = s.Value ?? 0;
                    }
                }
            }

            // GPU Sektorius
            if (hw.HardwareType == HardwareType.GpuNvidia || hw.HardwareType == HardwareType.GpuAmd) {
                if (s.SensorType == SensorType.Load) gpuL = s.Value ?? 0;
                if (s.SensorType == SensorType.Temperature) gpuT = s.Value ?? 0;
            }

            // RAM Sektorius
            if (hw.HardwareType == HardwareType.Memory && s.SensorType == SensorType.Load) 
                ram = s.Value ?? 0;
        }
    }

    // SVARBU: Patikrink, ar šie pavadinimai (kairėje) sutampa su tavo Backend Models.cs laukais!
    var payload = new { 
        CpuLoad = cpuL, 
        CpuTemp = cpuT, 
        GpuLoad = gpuL, 
        GpuTemp = gpuT, 
        RamUsage = ram 
    };

    try {
        await http.PostAsJsonAsync("http://localhost:5000/save", payload);
        Console.WriteLine($"[SIUNČIAMA] CPU: {cpuL:0}% | Temp: {cpuT:0}°C | GPU: {gpuL:0}%");
    } catch { 
        Console.WriteLine("Klaida: Serveris nepasiekiamas."); 
    }

    await Task.Delay(120000); // 2 min
}


// last update 2026-09-22