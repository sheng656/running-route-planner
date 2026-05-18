using RunningRoutePlanner.Core.Helpers;
using RunningRoutePlanner.Core.Models;

namespace RunningRoutePlanner.Core.Services;

/// <summary>
/// Orchestrates route generation: validates request → calls ORS → builds response.
/// Ported from Node.js generate-route/app.ts handler logic.
/// </summary>
public class RouteService(IOpenRouteServiceClient orsClient) : IRouteService
{
    private static readonly Dictionary<string, string> PreferenceLabels = new()
    {
        ["green"]       = "Green",
        ["quiet"]       = "Quiet",
        ["avoid_steps"] = "Step-free"
    };

    public async Task<RouteResponse> GenerateAsync(RouteRequest request)
    {
        // Resolve API key from environment variable (set via Azure App Settings / Key Vault reference)
        var apiKey = Environment.GetEnvironmentVariable("ORS_API_KEY")
            ?? throw new InvalidOperationException("ORS_API_KEY environment variable is not configured.");

        var (coordinates, distanceM, durationS) = await orsClient.GetRouteAsync(request, apiKey);

        var points     = ToRoutePoints(coordinates);
        var stats      = ComputeStats(points);
        var prefs      = request.Preferences.OrderBy(p => p).ToArray();
        int durationMin = Math.Max(1, (int)Math.Round(durationS / 60.0));

        double measuredKm = Math.Round(distanceM / 1000.0, 1);

        return new RouteResponse
        {
            RouteId      = Guid.NewGuid().ToString(),
            Name         = BuildRouteName(prefs),
            ScenicSummary = BuildScenicSummary(prefs, request.RouteMode, measuredKm,
                                               stats.MaxElevation, stats.TotalAscent),
            Distance      = measuredKm,
            DurationRange = $"{durationMin} mins",
            MaxElevation  = stats.MaxElevation,
            TotalAscent   = stats.TotalAscent,
            ScenicRating  = BuildScenicRating(prefs),
            Points        = points
        };
    }

    // ── private helpers (ported from Node.js) ────────────────────────────────

    private static RoutePoint[] ToRoutePoints(double[][] coords)
    {
        if (coords.Length == 0) return [];

        double cumulative = 0;
        var result = new RoutePoint[coords.Length];

        for (int i = 0; i < coords.Length; i++)
        {
            if (i > 0)
                cumulative += GeoMath.DistanceBetweenMeters(coords[i - 1], coords[i]);

            result[i] = new RoutePoint
            {
                Coordinates = [coords[i][0], coords[i][1]],
                Distance    = (int)Math.Round(cumulative),
                Elevation   = coords[i].Length > 2 ? (int)Math.Round(coords[i][2]) : 0
            };
        }

        return result;
    }

    private static (int MaxElevation, int TotalAscent) ComputeStats(RoutePoint[] points)
    {
        int maxElev = 0, totalAscent = 0;
        for (int i = 0; i < points.Length; i++)
        {
            int cur = points[i].Elevation;
            maxElev = Math.Max(maxElev, cur);
            if (i > 0)
            {
                int delta = cur - points[i - 1].Elevation;
                if (delta > 0) totalAscent += delta;
            }
        }
        return (maxElev, totalAscent);
    }

    private static int BuildScenicRating(string[] prefs) =>
        prefs.Length == 0 ? 3 : Math.Max(1, Math.Min(5, 2 + Math.Min(3, prefs.Length)));

    private static string BuildRouteName(string[] prefs)
    {
        if (prefs.Length == 0) return "Generated Route";
        var labels = prefs.Select(p => PreferenceLabels.GetValueOrDefault(p, ToTitleCase(p)));
        return $"{string.Join(" & ", labels.Take(2))} Route";
    }

    private static string BuildScenicSummary(
        string[] prefs, string routeMode, double distKm, int maxElev, int totalAscent)
    {
        var activeLabels = prefs
            .Where(PreferenceLabels.ContainsKey)
            .Select(p => PreferenceLabels[p])
            .ToArray();

        string prefText = activeLabels.Length > 0
            ? $"Route style: {string.Join(", ", activeLabels)}."
            : "Route style: standard.";

        string modeText = routeMode == "loop"
            ? "This route returns to your start point."
            : "This route finishes at a different end point.";

        string elevText = maxElev <= 5
            ? "Terrain is mostly flat."
            : $"Elevation reaches {maxElev} m with {totalAscent} m total ascent.";

        return $"{prefText} {modeText} Estimated distance is {distKm:F1} km. {elevText}";
    }

    private static string ToTitleCase(string s) =>
        s.Length == 0 ? s : char.ToUpper(s[0]) + s[1..];
}
