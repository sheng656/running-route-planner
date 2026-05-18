using System.Text.Json.Serialization;

namespace RunningRoutePlanner.Core.Models;

public class RoutePoint
{
    [JsonPropertyName("coordinates")]
    public double[] Coordinates { get; set; } = [];

    [JsonPropertyName("elevation")]
    public int Elevation { get; set; }

    [JsonPropertyName("distance")]
    public int Distance { get; set; }
}

public class RouteResponse
{
    [JsonPropertyName("routeId")]
    public string RouteId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("scenicSummary")]
    public string ScenicSummary { get; set; } = string.Empty;

    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("durationRange")]
    public string DurationRange { get; set; } = string.Empty;

    [JsonPropertyName("maxElevation")]
    public int MaxElevation { get; set; }

    [JsonPropertyName("totalAscent")]
    public int TotalAscent { get; set; }

    [JsonPropertyName("scenicRating")]
    public int ScenicRating { get; set; }

    [JsonPropertyName("points")]
    public RoutePoint[] Points { get; set; } = [];
}
