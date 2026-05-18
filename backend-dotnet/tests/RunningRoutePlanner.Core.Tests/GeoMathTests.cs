using FluentAssertions;
using RunningRoutePlanner.Core.Helpers;

namespace RunningRoutePlanner.Core.Tests;

public class GeoMathTests
{
    [Fact]
    public void DistanceBetweenMeters_ZeroForSamePoint()
    {
        var pt = new double[] { 174.832, -36.848 };
        GeoMath.DistanceBetweenMeters(pt, pt).Should().BeApproximately(0, 0.001);
    }

    [Fact]
    public void DistanceBetweenMeters_AucklandToWellington()
    {
        // Auckland → Wellington ~490 km
        var auckland    = new double[] { 174.763, -36.848 };
        var wellington  = new double[] { 174.776, -41.286 };
        double distKm = GeoMath.DistanceBetweenMeters(auckland, wellington) / 1000.0;
        distKm.Should().BeInRange(480, 510);
    }

    [Fact]
    public void ComputeDestination_NorthwardBearing()
    {
        var origin = new double[] { 174.832, -36.848 };
        // Move 1 km due north (bearing 0°)
        var dest = GeoMath.ComputeDestination(origin, 0, 1000);
        dest[0].Should().BeApproximately(origin[0], 0.001); // same longitude
        dest[1].Should().BeGreaterThan(origin[1]);          // higher latitude = north
    }

    [Fact]
    public void ComputeDestination_DistanceIsApproximatelyCorrect()
    {
        var origin = new double[] { 174.832, -36.848 };
        var dest = GeoMath.ComputeDestination(origin, 90, 5000); // 5 km east
        double measured = GeoMath.DistanceBetweenMeters(origin, dest);
        measured.Should().BeApproximately(5000, 10); // within 10 m
    }
}
