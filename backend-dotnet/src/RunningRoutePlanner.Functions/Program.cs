using Azure.Monitor.OpenTelemetry.Exporter;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Azure.Functions.Worker.OpenTelemetry;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpenTelemetry;
using RunningRoutePlanner.Core.Services;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Register application services via DI
// IHttpClientFactory is used by OpenRouteServiceClient for pooled, resilient HTTP connections
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IOpenRouteServiceClient, OpenRouteServiceClient>();
builder.Services.AddSingleton<IRouteService, RouteService>();
builder.Services.AddSingleton<IGpxService, GpxService>();

var otel = builder.Services.AddOpenTelemetry()
    .UseFunctionsWorkerDefaults();

var appInsightsConn = Environment.GetEnvironmentVariable("APPLICATIONINSIGHTS_CONNECTION_STRING");
if (!string.IsNullOrEmpty(appInsightsConn))
{
    otel.UseAzureMonitorExporter(options => options.ConnectionString = appInsightsConn);
}

builder.Build().Run();
