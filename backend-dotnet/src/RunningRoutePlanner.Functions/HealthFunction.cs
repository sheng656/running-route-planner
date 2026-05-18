using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace RunningRoutePlanner.Functions;

public class HealthFunction
{
    [Function("Health")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "health")] HttpRequestData req)
    {
        var ok = req.CreateResponse(HttpStatusCode.OK);
        await ok.WriteAsJsonAsync(new
        {
            ok        = true,
            service   = "running-route-planner-dotnet",  // distinguishes from Node.js backend
            runtime   = "dotnet8",
            platform  = "azure-functions",
            timestamp = DateTime.UtcNow.ToString("o")
        });
        return ok;
    }
}
