using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using RunningRoutePlanner.Core.Helpers;
using RunningRoutePlanner.Core.Models;
using RunningRoutePlanner.Core.Services;
using System.Net;
using System.Text.Json;

namespace RunningRoutePlanner.Functions;

public class ExportGpxFunction(IGpxService gpxService, ILogger<ExportGpxFunction> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [Function("ExportGpx")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "routes/export/gpx")] HttpRequestData req)
    {
        GpxExportRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<GpxExportRequest>(req.Body, JsonOpts);
        }
        catch
        {
            request = null;
        }

        if (request is null
            || string.IsNullOrWhiteSpace(request.RouteName)
            || request.Points is null or { Length: 0 }
            || !request.Points.All(p => p.Coordinates?.Length == 2))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteAsJsonAsync(new { message = "Invalid payload. Expected routeName and points with coordinates." });
            return bad;
        }

        try
        {
            var gpx = gpxService.BuildGpx(request);
            var fileName = $"{XmlSanitizer.SanitizeFileName(request.RouteName)}.gpx";

            var ok = req.CreateResponse(HttpStatusCode.OK);
            ok.Headers.Add("Content-Type", "application/gpx+xml");
            ok.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
            await ok.WriteStringAsync(gpx);
            return ok;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GPX export failed");
            var err = req.CreateResponse(HttpStatusCode.InternalServerError);
            await err.WriteAsJsonAsync(new { message = "GPX export failed." });
            return err;
        }
    }
}
