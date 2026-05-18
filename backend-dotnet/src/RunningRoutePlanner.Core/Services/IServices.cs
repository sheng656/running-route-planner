using RunningRoutePlanner.Core.Models;

namespace RunningRoutePlanner.Core.Services;

public interface IRouteService
{
    Task<RouteResponse> GenerateAsync(RouteRequest request);
}

public interface IGpxService
{
    string BuildGpx(GpxExportRequest request);
}
