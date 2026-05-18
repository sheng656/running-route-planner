using System.Xml.Linq;
using RunningRoutePlanner.Core.Helpers;
using RunningRoutePlanner.Core.Models;

namespace RunningRoutePlanner.Core.Services;

/// <summary>
/// Generates GPX 1.1 XML from route points.
/// Uses System.Xml.Linq for safe, structured XML (vs Node.js string templates).
/// Ported from Node.js export-gpx/app.ts toGpx().
/// </summary>
public class GpxService : IGpxService
{
    private static readonly XNamespace GpxNs  = "http://www.topografix.com/GPX/1/1";
    private static readonly XNamespace XsiNs  = "http://www.w3.org/2001/XMLSchema-instance";

    public string BuildGpx(GpxExportRequest request)
    {
        var now = DateTime.UtcNow;

        var trkpts = request.Points.Select((pt, idx) =>
        {
            var (lng, lat) = (pt.Coordinates[0], pt.Coordinates[1]);
            var trkpt = new XElement(GpxNs + "trkpt",
                new XAttribute("lat", lat),
                new XAttribute("lon", lng),
                new XElement(GpxNs + "time", now.AddSeconds(idx).ToString("o")));

            if (pt.Elevation.HasValue)
                trkpt.AddFirst(new XElement(GpxNs + "ele", (int)pt.Elevation.Value));

            return trkpt;
        });

        var doc = new XDocument(
            new XDeclaration("1.0", "UTF-8", null),
            new XElement(GpxNs + "gpx",
                new XAttribute("version", "1.1"),
                new XAttribute("creator", "running-route-planner-dotnet"),
                new XAttribute(XNamespace.Xmlns + "xsi", XsiNs),
                new XAttribute(XsiNs + "schemaLocation",
                    "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"),
                new XElement(GpxNs + "metadata",
                    new XElement(GpxNs + "name", request.RouteName),
                    new XElement(GpxNs + "time", now.ToString("o"))),
                new XElement(GpxNs + "trk",
                    new XElement(GpxNs + "name", request.RouteName),
                    new XElement(GpxNs + "trkseg", trkpts))));

        return doc.Declaration + "\n" + doc.ToString();
    }
}
