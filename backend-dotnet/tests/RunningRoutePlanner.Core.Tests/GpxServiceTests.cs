using FluentAssertions;
using RunningRoutePlanner.Core.Models;
using RunningRoutePlanner.Core.Services;

namespace RunningRoutePlanner.Core.Tests;

public class GpxServiceTests
{
    private readonly GpxService _svc = new();

    private static GpxExportRequest SimpleRequest() => new()
    {
        RouteName = "Test Route",
        Points =
        [
            new() { Coordinates = [174.832, -36.848], Elevation = 10 },
            new() { Coordinates = [174.850, -36.860], Elevation = 15 }
        ]
    };

    [Fact]
    public void BuildGpx_ContainsGpxDeclaration()
    {
        var gpx = _svc.BuildGpx(SimpleRequest());
        gpx.Should().StartWith("<?xml");
        gpx.Should().Contain("gpx");
    }

    [Fact]
    public void BuildGpx_ContainsRouteName()
    {
        var gpx = _svc.BuildGpx(SimpleRequest());
        gpx.Should().Contain("Test Route");
    }

    [Fact]
    public void BuildGpx_ContainsTrackPoints()
    {
        var gpx = _svc.BuildGpx(SimpleRequest());
        gpx.Should().Contain("trkpt");
        gpx.Should().Contain("lat=\"-36.848\"");
        gpx.Should().Contain("lon=\"174.832\"");
    }

    [Fact]
    public void BuildGpx_ContainsElevation()
    {
        var gpx = _svc.BuildGpx(SimpleRequest());
        gpx.Should().Contain("<ele>10</ele>");
    }

    [Fact]
    public void BuildGpx_EscapesSpecialCharactersInName()
    {
        var req = SimpleRequest();
        req.RouteName = "Tom & Jerry's <Route>";
        var gpx = _svc.BuildGpx(req);
        gpx.Should().Contain("Tom &amp; Jerry");
        gpx.Should().Contain("&lt;Route&gt;");
    }
}
