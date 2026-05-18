# Running Route Planner — C#/.NET Azure Functions Backend

A parallel backend for the Running Route Planner application, implemented in **C# / .NET 8** and deployed to **Azure Functions** (Consumption Plan). Runs independently alongside the existing Node.js / AWS Lambda backend.

## Architecture

```
RunningRoutePlanner.sln
├── src/
│   ├── RunningRoutePlanner.Core/        # Business logic class library (net8.0 + net10.0)
│   │   ├── Models/                      # Request/Response DTOs
│   │   ├── Helpers/                     # GeoMath, CoordinateValidator, XmlSanitizer
│   │   └── Services/                    # IRouteService, IGpxService, OpenRouteServiceClient
│   └── RunningRoutePlanner.Functions/   # Azure Functions HTTP triggers (net8.0)
│       ├── GenerateRouteFunction.cs     # POST /api/routes/generate
│       ├── ExportGpxFunction.cs         # POST /api/routes/export/gpx
│       └── HealthFunction.cs            # GET  /api/health
└── tests/
    └── RunningRoutePlanner.Core.Tests/  # xUnit + FluentAssertions + Moq (net10.0)
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/routes/generate` | Generate a running route (same schema as Node.js backend) |
| `POST` | `/api/routes/export/gpx` | Export route as GPX 1.1 file |
| `GET`  | `/api/health` | Health check (returns `runtime: "dotnet8", platform: "azure-functions"`) |

JSON response schema is **100% compatible** with the Node.js backend — the frontend switches seamlessly.

## Local Development

### Prerequisites

- .NET 8 SDK (for Functions) + .NET 10 SDK (installed)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
- [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) (local storage emulator)

### Setup

1. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. Fill in your ORS API key in `local.settings.json`:
   ```json
   "ORS_API_KEY": "your-openrouteservice-api-key"
   ```
   Use the same key stored in AWS SSM `/running-route-planner/openroute-service-api-key`.

3. Start Azurite (storage emulator):
   ```bash
   npx azurite --silent
   ```

4. Run locally:
   ```bash
   cd src/RunningRoutePlanner.Functions
   func start
   ```
   Functions will be available at `http://localhost:7071/api/`

### Run Tests

```bash
dotnet test tests/RunningRoutePlanner.Core.Tests
```

All 23 tests should pass.

## Azure Deployment

### Create Azure Resources

```bash
RESOURCE_GROUP="rg-running-route-planner"
LOCATION="australiaeast"
STORAGE_ACCOUNT="rrpstoragedotnet"
FUNCTION_APP="running-route-planner-dotnet"
KEY_VAULT="rrp-keyvault-dotnet"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage (required by Functions)
az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP \
  --location $LOCATION --sku Standard_LRS

# Create Function App (.NET 8)
az functionapp create --resource-group $RESOURCE_GROUP --consumption-plan-location $LOCATION \
  --runtime dotnet-isolated --runtime-version 8 --functions-version 4 \
  --name $FUNCTION_APP --storage-account $STORAGE_ACCOUNT

# Create Key Vault and add ORS API key
az keyvault create --name $KEY_VAULT --resource-group $RESOURCE_GROUP --location $LOCATION
az keyvault secret set --vault-name $KEY_VAULT --name "OrsApiKey" --value "YOUR_ORS_API_KEY"

# Grant Function App access to Key Vault via Managed Identity
az functionapp identity assign --name $FUNCTION_APP --resource-group $RESOURCE_GROUP
PRINCIPAL_ID=$(az functionapp identity show --name $FUNCTION_APP --resource-group $RESOURCE_GROUP --query principalId -o tsv)
az keyvault set-policy --name $KEY_VAULT --object-id $PRINCIPAL_ID --secret-permissions get

# Link Key Vault secret to App Settings
az functionapp config appsettings set --name $FUNCTION_APP --resource-group $RESOURCE_GROUP \
  --settings "ORS_API_KEY=@Microsoft.KeyVault(VaultName=$KEY_VAULT;SecretName=OrsApiKey)"
```

### Deploy

```bash
cd src/RunningRoutePlanner.Functions
func azure functionapp publish $FUNCTION_APP
```

### Configure CORS in Azure Portal

After deployment, add allowed origins in Function App → CORS:
- `https://running.sheng.nz`
- `http://localhost:5173`

## Frontend Integration

Add to `frontend/.env.local`:

```env
VITE_API_BASE_URL_DOTNET=https://running-route-planner-dotnet.azurewebsites.net/api
```

The app's **Backend** toggle (bottom of sidebar) will automatically activate the Azure option.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `net8.0` for Functions | Azure Functions v4 requires .NET 8 LTS |
| Multi-target Core (`net8.0;net10.0`) | Allows tests to run on locally installed .NET 10 |
| Nested private classes in ORS client | Avoids C# CS9051 file-scoped type restriction |
| `System.Xml.Linq` for GPX | Type-safe XML generation vs. Node.js string templates |
| `IHttpClientFactory` | Prevents socket exhaustion under high request rates |
