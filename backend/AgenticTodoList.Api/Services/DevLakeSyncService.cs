using System.Text;
using System.Text.Json;
using PandoraTodoList.Api.Domain;

namespace PandoraTodoList.Api.Services;

/// <summary>
/// Pushes Pandora agent run events to DevLake via webhook (SP-03 BL-05).
/// Fires-and-forgets — never throws; errors are logged but do not block callers.
/// </summary>
public class DevLakeSyncService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<DevLakeSyncService> logger)
{
    private readonly string _webhookUrl = config["DevLake:WebhookUrl"] ?? string.Empty;

    public bool IsEnabled => !string.IsNullOrWhiteSpace(_webhookUrl);

    /// <summary>
    /// Notifies DevLake of a completed agent run as a deployment event.
    /// </summary>
    public async Task NotifyAgentRunAsync(AgentRunLogEntity run, CancellationToken ct = default)
    {
        if (!IsEnabled) return;

        var result = run.Success ? "SUCCESS" : "FAILURE";
        var payload = new
        {
            id = run.Id.ToString(),
            result,
            startedDate = run.StartedAt.UtcDateTime.ToString("O"),
            finishedDate = (run.FinishedAt ?? run.StartedAt).UtcDateTime.ToString("O"),
            displayTitle = $"{run.AgentName} — {run.EntryPoint}",
            refName = run.Environment,
            environment = run.Environment.ToUpperInvariant(),
        };

        await PostAsync("deployments", payload, ct);
    }

    private async Task PostAsync(string endpoint, object payload, CancellationToken ct)
    {
        try
        {
            var client = httpClientFactory.CreateClient("devlake");
            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            var url = $"{_webhookUrl.TrimEnd('/')}/{endpoint}";
            var response = await client.PostAsync(url, content, ct);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("[DevLakeSync] POST {Endpoint} returned {Status}: {Body}", endpoint, (int)response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[DevLakeSync] Failed to push {Endpoint} — DevLake may be offline", endpoint);
        }
    }
}
