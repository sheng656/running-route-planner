using System.Text.Json.Serialization;

namespace RunningRoutePlanner.Core.Models;

public class GpxPoint
{
    [JsonPropertyName("coordinates")]
    public double[] Coordinates { get; set; } = [];

    [JsonPropertyName("elevation")]
    public double? Elevation { get; set; }

    [JsonPropertyName("distance")]
    public double? Distance { get; set; }
}

public class GpxExportRequest
{
    [JsonPropertyName("routeName")]
    public string RouteName { get; set; } = string.Empty;

    [JsonPropertyName("points")]
    public GpxPoint[] Points { get; set; } = [];
}
