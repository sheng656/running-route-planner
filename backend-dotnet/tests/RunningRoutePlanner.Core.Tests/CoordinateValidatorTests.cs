using FluentAssertions;
using RunningRoutePlanner.Core.Helpers;

namespace RunningRoutePlanner.Core.Tests;

public class CoordinateValidatorTests
{
    [Fact]
    public void IsValid_ReturnsTrueForAucklandCoords()
    {
        // Auckland longitude ~174, latitude ~-36 (same values as Node.js test)
        CoordinateValidator.IsValid([174.832, -36.848]).Should().BeTrue();
    }

    [Fact]
    public void IsValid_ReturnsTrueAtExactBounds()
    {
        CoordinateValidator.IsValid([-180, 90]).Should().BeTrue();
        CoordinateValidator.IsValid([180, -90]).Should().BeTrue();
    }

    [Fact]
    public void IsValid_ReturnsFalseForOutOfBoundsLongitude()
    {
        CoordinateValidator.IsValid([-181, 0]).Should().BeFalse();
        CoordinateValidator.IsValid([181, 0]).Should().BeFalse();
    }

    [Fact]
    public void IsValid_ReturnsFalseForOutOfBoundsLatitude()
    {
        CoordinateValidator.IsValid([0, 91]).Should().BeFalse();
        CoordinateValidator.IsValid([0, -91]).Should().BeFalse();
    }

    [Fact]
    public void IsValid_ReturnsFalseForNull()
    {
        CoordinateValidator.IsValid(null).Should().BeFalse();
    }

    [Fact]
    public void IsValid_ReturnsFalseForWrongLength()
    {
        CoordinateValidator.IsValid([174]).Should().BeFalse();
        CoordinateValidator.IsValid([174, -36, 12]).Should().BeFalse();
    }
}
