using System.Text.Json.Serialization;

namespace RunningRoutePlanner.Core.Models;

public class RouteRequest
{
    [JsonPropertyName("startPoint")]
    public double[] StartPoint { get; set; } = [];

    [JsonPropertyName("distanceKm")]
    public double DistanceKm { get; set; }

    [JsonPropertyName("routeMode")]
    public string RouteMode { get; set; } = "loop";

    [JsonPropertyName("difficulty")]
    public string Difficulty { get; set; } = "moderate";

    [JsonPropertyName("preferences")]
    public string[] Preferences { get; set; } = [];

    [JsonPropertyName("guidingWaypoints")]
    public double[][]? GuidingWaypoints { get; set; }

    [JsonPropertyName("drawMode")]
    public bool? DrawMode { get; set; }
}
