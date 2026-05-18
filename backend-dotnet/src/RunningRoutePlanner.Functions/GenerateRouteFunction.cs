using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using RunningRoutePlanner.Core.Helpers;
using RunningRoutePlanner.Core.Models;
using RunningRoutePlanner.Core.Services;
using System.Net;
using System.Text.Json;

namespace RunningRoutePlanner.Functions;

public class GenerateRouteFunction(IRouteService routeService, ILogger<GenerateRouteFunction> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [Function("GenerateRoute")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "routes/generate")] HttpRequestData req)
    {
        // Validate request body
        RouteRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<RouteRequest>(req.Body, JsonOpts);
        }
        catch
        {
            request = null;
        }

        if (!IsValid(request))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteAsJsonAsync(new { message = "Invalid request body. Expected startPoint [lng,lat], distanceKm > 0, routeMode, difficulty, preferences." });
            return bad;
        }

        try
        {
            var result = await routeService.GenerateAsync(request!);
            var ok = req.CreateResponse(HttpStatusCode.OK);
            ok.Headers.Add("Content-Type", "application/json");
            await ok.WriteStringAsync(JsonSerializer.Serialize(result, JsonOpts));
            return ok;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Route generation failed");
            var err = req.CreateResponse(HttpStatusCode.BadGateway);
            await err.WriteAsJsonAsync(new { message = "Failed to generate route due to an external service error." });
            return err;
        }
    }

    private static bool IsValid(RouteRequest? r)
    {
        if (r is null) return false;

        // Draw mode — validate guiding waypoints
        if (r.DrawMode == true && r.GuidingWaypoints?.Length >= 2)
        {
            return r.GuidingWaypoints.All(CoordinateValidator.IsValid)
                && r.DistanceKm > 0
                && IsValidMode(r.RouteMode)
                && IsValidDifficulty(r.Difficulty)
                && r.Preferences is not null;
        }

        // Standard mode
        return CoordinateValidator.IsValid(r.StartPoint)
            && r.DistanceKm > 0
            && IsValidMode(r.RouteMode)
            && IsValidDifficulty(r.Difficulty)
            && r.Preferences is not null;
    }

    private static bool IsValidMode(string? m) => m is "loop" or "one-way";
    private static bool IsValidDifficulty(string? d) => d is "easy" or "moderate" or "hard";
}
