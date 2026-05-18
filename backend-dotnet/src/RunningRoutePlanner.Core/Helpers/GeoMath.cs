namespace RunningRoutePlanner.Core.Helpers;

/// <summary>
/// Geographic math helpers. Ported 1-to-1 from the Node.js backend (generate-route/app.ts).
/// </summary>
public static class GeoMath
{
    private const double EarthRadiusMeters = 6_371_000;

    /// <summary>
    /// Haversine formula: great-circle distance between two [lng, lat] points (in meters).
    /// </summary>
    public static double DistanceBetweenMeters(double[] a, double[] b)
    {
        double toRad(double v) => v * Math.PI / 180;

        double lat1 = toRad(a[1]);
        double lat2 = toRad(b[1]);
        double dLat = toRad(b[1] - a[1]);
        double dLng = toRad(b[0] - a[0]);

        double h = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(lat1) * Math.Cos(lat2)
                 * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(h), Math.Sqrt(1 - h));
        return EarthRadiusMeters * c;
    }

    /// <summary>
    /// Compute the destination [lng, lat] from an origin, bearing (degrees) and distance (meters).
    /// </summary>
    public static double[] ComputeDestination(double[] origin, double bearingDeg, double distanceMeters)
    {
        double toRad(double d) => d * Math.PI / 180;
        double toDeg(double r) => r * 180 / Math.PI;

        double lat1 = toRad(origin[1]);
        double lon1 = toRad(origin[0]);
        double bearing = toRad(bearingDeg);
        double angDist = distanceMeters / EarthRadiusMeters;

        double lat2 = Math.Asin(
            Math.Sin(lat1) * Math.Cos(angDist)
            + Math.Cos(lat1) * Math.Sin(angDist) * Math.Cos(bearing));

        double lon2 = lon1 + Math.Atan2(
            Math.Sin(bearing) * Math.Sin(angDist) * Math.Cos(lat1),
            Math.Cos(angDist) - Math.Sin(lat1) * Math.Sin(lat2));

        return [toDeg(lon2), toDeg(lat2)];
    }
}
