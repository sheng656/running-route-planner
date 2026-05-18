using System.Text.Json.Serialization;

namespace RunningRoutePlanner.Core.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RouteMode
{
    [JsonPropertyName("loop")]
    Loop,

    [JsonPropertyName("one-way")]
    OneWay
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Difficulty
{
    [JsonPropertyName("easy")]
    Easy,

    [JsonPropertyName("moderate")]
    Moderate,

    [JsonPropertyName("hard")]
    Hard
}
