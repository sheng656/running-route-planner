using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using RunningRoutePlanner.Core.Helpers;
using RunningRoutePlanner.Core.Models;

namespace RunningRoutePlanner.Core.Services;

public interface IOpenRouteServiceClient
{
    Task<(double[][] Coordinates, double DistanceM, double DurationS)> GetRouteAsync(
        RouteRequest request, string apiKey, CancellationToken ct = default);
}

public class OpenRouteServiceClient(IHttpClientFactory httpFactory) : IOpenRouteServiceClient
{
    // ── Internal ORS JSON shapes (private nested — not exposed in public API) ──

    private sealed class OrsResponse
    {
        [JsonPropertyName("features")]
        public OrsFeature[]? Features { get; set; }
    }

    private sealed class OrsFeature
    {
        [JsonPropertyName("geometry")]
        public OrsGeometry? Geometry { get; set; }

        [JsonPropertyName("properties")]
        public OrsProperties? Properties { get; set; }
    }

    private sealed class OrsGeometry
    {
        [JsonPropertyName("coordinates")]
        public double[][]? Coordinates { get; set; }
    }

    private sealed class OrsProperties
    {
        [JsonPropertyName("summary")]
        public OrsSummary? Summary { get; set; }
    }

    private sealed class OrsSummary
    {
        [JsonPropertyName("distance")]
        public double Distance { get; set; }

        [JsonPropertyName("duration")]
        public double Duration { get; set; }
    }

    // ── Constants ─────────────────────────────────────────────────────────────

    private const string OrsUrl = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
    private const int MaxAttempts = 12;
    private const double ToleranceRatio = 0.4;
    private const double StraightLineFactor = 1.3;

    private static readonly string[] BaseAvoidFeatures = ["ferries"];

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    // ── Public interface ──────────────────────────────────────────────────────

    public async Task<(double[][] Coordinates, double DistanceM, double DurationS)> GetRouteAsync(
        RouteRequest request, string apiKey, CancellationToken ct = default)
    {
        bool isLoop     = request.RouteMode == "loop";
        bool isDrawMode = request.DrawMode == true;
        double[] effectiveStart = request.StartPoint;

        if (isDrawMode && request.GuidingWaypoints?.Length > 0)
            effectiveStart = request.GuidingWaypoints[0];

        double targetDistM = request.DistanceKm * 1_000 * DifficultyFactor(request.Difficulty);

        // For loop draw-mode, use drawn perimeter as target distance
        if (isDrawMode && isLoop && request.GuidingWaypoints?.Length > 2)
        {
            double perim = 0;
            var wp = request.GuidingWaypoints;
            for (int i = 0; i < wp.Length; i++)
                perim += GeoMath.DistanceBetweenMeters(wp[i], wp[(i + 1) % wp.Length]);
            targetDistM = Math.Max(perim, 500);
        }

        var avoidFeatures = new List<string>(BaseAvoidFeatures);
        var prefs = request.Preferences;
        if (prefs.Contains("avoid_steps") || request.Difficulty == "easy")
            avoidFeatures.Add("steps");

        var weightings = new Dictionary<string, int>();
        if (prefs.Contains("green")) weightings["green"] = 1;
        if (prefs.Contains("quiet")) weightings["quiet"] = 1;

        int roundTripPoints = Math.Max(3, Math.Min(8, 4 + (int)(request.DistanceKm / 5)));
        int seed = Math.Abs(HashSeed(
            $"{effectiveStart[0]:F5}:{effectiveStart[1]:F5}:{targetDistM:F2}:" +
            $"{request.RouteMode}:{request.Difficulty}:{string.Join("|", prefs.Order())}:" +
            $"{Random.Shared.Next(100_000)}"));
        double straightLine = targetDistM / StraightLineFactor;

        var candidates = new List<(double[][] Coords, double DistM, double DurS, double ErrRatio)>();

        using var http = httpFactory.CreateClient();
        http.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", apiKey);

        for (int i = 0; i < MaxAttempts; i++)
        {
            double[]? endPoint = null;

            if (!isLoop)
            {
                endPoint = isDrawMode && request.GuidingWaypoints?.Length > 1
                    ? request.GuidingWaypoints[^1]
                    : GeoMath.ComputeDestination(effectiveStart, (seed + i * 30) % 360, straightLine);
            }

            int iterSeed = (seed + i * 137) % 1000;
            var feature = await CallOrsAsync(http, request, effectiveStart, avoidFeatures, weightings,
                                             isLoop, isDrawMode, roundTripPoints, iterSeed,
                                             endPoint, targetDistM, ct);
            if (feature is null) continue;

            double measuredDist = feature.Properties?.Summary?.Distance ?? 0;
            if (measuredDist <= 0) continue;

            double err    = Math.Abs(measuredDist - targetDistM) / targetDistM;
            var coords    = feature.Geometry!.Coordinates!;

            // Close loop if needed
            if (isLoop && coords.Length > 0 && (coords[0][0] != coords[^1][0] || coords[0][1] != coords[^1][1]))
                coords = [.. coords, coords[0]];

            candidates.Add((coords, measuredDist, feature.Properties?.Summary?.Duration ?? 0, err));

            if (err <= ToleranceRatio || isDrawMode) break;
        }

        if (candidates.Count == 0)
            throw new InvalidOperationException("OpenRouteService returned no usable route candidates.");

        var best = candidates.MinBy(c => c.ErrRatio);
        return (best.Coords, best.DistM, best.DurS);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static double DifficultyFactor(string difficulty) => difficulty switch
    {
        "easy" => 0.9,
        "hard" => 1.1,
        _      => 1.0
    };

    private static int HashSeed(string value)
    {
        int hash = 0;
        foreach (char c in value)
            hash = (hash * 31 + c) % int.MaxValue;
        return Math.Abs(hash);
    }

    private static object BuildBody(
        RouteRequest request, double[] start,
        List<string> avoidFeatures, Dictionary<string, int> weightings,
        bool isLoop, bool isDrawMode, int roundTripPoints, int seed,
        double[]? endPoint, double targetDistM)
    {
        var options = new Dictionary<string, object>();

        if (isLoop && !isDrawMode)
            options["round_trip"] = new { length = (int)targetDistM, points = roundTripPoints, seed };

        if (avoidFeatures.Count > 0)
            options["avoid_features"] = avoidFeatures;

        if (weightings.Count > 0)
            options["profile_params"] = new { weightings };

        List<double[]> coordinates;
        if (isDrawMode && request.GuidingWaypoints?.Length > 1)
        {
            coordinates = [.. request.GuidingWaypoints];
            if (isLoop && coordinates.Count > 2)
            {
                var first = coordinates[0];
                var last  = coordinates[^1];
                if (first[0] != last[0] || first[1] != last[1])
                    coordinates.Add([first[0], first[1]]);
            }
        }
        else
        {
            coordinates = !isLoop && endPoint is not null ? [start, endPoint] : [start];
        }

        return new
        {
            coordinates,
            radiuses     = coordinates.Select(_ => 2000).ToArray(),
            options      = options.Count > 0 ? (object)options : null,
            elevation    = true,
            instructions = false
        };
    }

    private async Task<OrsFeature?> CallOrsAsync(
        HttpClient http, RouteRequest request, double[] start,
        List<string> avoidFeatures, Dictionary<string, int> weightings,
        bool isLoop, bool isDrawMode, int roundTripPoints, int seed,
        double[]? endPoint, double targetDistM, CancellationToken ct)
    {
        var body = BuildBody(request, start, avoidFeatures, weightings,
                             isLoop, isDrawMode, roundTripPoints, seed, endPoint, targetDistM);

        var json = JsonSerializer.Serialize(body, JsonOpts);
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        var resp = await http.PostAsync(OrsUrl, content, ct);

        if (!resp.IsSuccessStatusCode)
        {
            var msg = await resp.Content.ReadAsStringAsync(ct);
            // Defensive fallback: retry without avoid_features if ORS rejects them for this region
            if ((int)resp.StatusCode == 400 && msg.Contains("avoid_features"))
            {
                var retryBody = BuildBody(request, start, [], weightings,
                                         isLoop, isDrawMode, roundTripPoints, seed, endPoint, targetDistM);
                var retryJson = JsonSerializer.Serialize(retryBody, JsonOpts);
                using var retryContent = new StringContent(retryJson, System.Text.Encoding.UTF8, "application/json");
                var retryResp = await http.PostAsync(OrsUrl, retryContent, ct);
                if (!retryResp.IsSuccessStatusCode) return null;
                var retryJson2 = await retryResp.Content.ReadAsStringAsync(ct);
                var retryData = JsonSerializer.Deserialize<OrsResponse>(retryJson2, JsonOpts);
                return retryData?.Features?.FirstOrDefault();
            }
            return null;
        }

        var responseJson = await resp.Content.ReadAsStringAsync(ct);
        var data = JsonSerializer.Deserialize<OrsResponse>(responseJson, JsonOpts);
        return data?.Features?.FirstOrDefault();
    }
}
