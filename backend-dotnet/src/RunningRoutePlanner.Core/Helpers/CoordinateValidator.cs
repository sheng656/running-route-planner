namespace RunningRoutePlanner.Core.Helpers;

/// <summary>
/// Validates geographic coordinates. Ported from Node.js isValidCoordinate() in generate-route/app.ts.
/// </summary>
public static class CoordinateValidator
{
    /// <summary>
    /// Returns true if coord is a 2-element [longitude, latitude] array within valid bounds.
    /// </summary>
    public static bool IsValid(double[]? coord)
    {
        if (coord is null || coord.Length != 2) return false;

        double lng = coord[0];
        double lat = coord[1];

        return lng >= -180 && lng <= 180
            && lat >= -90  && lat <= 90;
    }

    public static bool AllValid(IEnumerable<double[]> coords) =>
        coords.All(IsValid);
}
