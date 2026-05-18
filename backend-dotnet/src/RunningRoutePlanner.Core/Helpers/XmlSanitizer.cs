using System.Text.RegularExpressions;

namespace RunningRoutePlanner.Core.Helpers;

/// <summary>
/// XML and filename sanitization. Ported from Node.js export-gpx/app.ts.
/// </summary>
public static class XmlSanitizer
{
    /// <summary>Escapes the five predefined XML entities.</summary>
    public static string XmlEscape(string value) =>
        value
            .Replace("&",  "&amp;")
            .Replace("<",  "&lt;")
            .Replace(">",  "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'",  "&apos;");

    /// <summary>
    /// Produces a filesystem-safe slug for a GPX filename.
    /// e.g. "Mission Bay 10k!" → "mission-bay-10k"
    /// </summary>
    public static string SanitizeFileName(string name)
    {
        var normalized = Regex.Replace(name.Trim().ToLower(), @"\s+", "-");
        var safe = Regex.Replace(normalized, @"[^a-z0-9\-_]", "");
        return safe.Length > 0 ? safe : "route";
    }
}
