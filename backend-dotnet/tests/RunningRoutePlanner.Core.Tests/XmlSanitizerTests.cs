using FluentAssertions;
using RunningRoutePlanner.Core.Helpers;

namespace RunningRoutePlanner.Core.Tests;

public class XmlSanitizerTests
{
    // Mirrors the Node.js export-gpx/app.test.ts assertions exactly

    [Fact]
    public void XmlEscape_EscapesAmpersand()
    {
        XmlSanitizer.XmlEscape("Tom & Jerry").Should().Be("Tom &amp; Jerry");
    }

    [Fact]
    public void XmlEscape_EscapesAngleBrackets()
    {
        XmlSanitizer.XmlEscape("<Route>").Should().Be("&lt;Route&gt;");
    }

    [Fact]
    public void XmlEscape_EscapesQuotes()
    {
        XmlSanitizer.XmlEscape("\"My\" 'Route'").Should().Be("&quot;My&quot; &apos;Route&apos;");
    }

    [Fact]
    public void SanitizeFileName_ProducesSlug()
    {
        XmlSanitizer.SanitizeFileName("Mission Bay 10k!").Should().Be("mission-bay-10k");
    }

    [Fact]
    public void SanitizeFileName_TrimsAndCollapseSpaces()
    {
        XmlSanitizer.SanitizeFileName("  Spaces  Around  ").Should().Be("spaces-around");
    }

    [Fact]
    public void SanitizeFileName_RemovesInvalidCharacters()
    {
        XmlSanitizer.SanitizeFileName("Invalid@#$Characters*&^").Should().Be("invalidcharacters");
    }

    [Fact]
    public void SanitizeFileName_FallsBackToRouteForEmptyResult()
    {
        XmlSanitizer.SanitizeFileName("!!!").Should().Be("route");
    }
}
