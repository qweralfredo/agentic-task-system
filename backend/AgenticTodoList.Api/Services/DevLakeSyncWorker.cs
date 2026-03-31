using Microsoft.EntityFrameworkCore;
using PandoraTodoList.Api.Data;

namespace PandoraTodoList.Api.Services;

/// <summary>
/// Periodic background sync: pushes recent Pandora agent runs to DevLake (BL-15 SP-12).
/// Configurable via DevLake:SyncIntervalMinutes (default 15).
/// On failure, logs and retries on next cycle — no crash.
/// </summary>
public sealed class DevLakeSyncWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DevLakeSyncWorker> _logger;
    private readonly TimeSpan _interval;

    public DateTimeOffset? LastSyncAt { get; private set; }
    public int SyncIntervalMinutes { get; }

    public DevLakeSyncWorker(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<DevLakeSyncWorker> logger)
    {
        _scopeFactory  = scopeFactory;
        _logger        = logger;
        SyncIntervalMinutes = config.GetValue<int>("DevLake:SyncIntervalMinutes", 15);
        _interval      = TimeSpan.FromMinutes(SyncIntervalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Slight startup delay so the rest of the app can warm up
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).ContinueWith(_ => { });

        using var timer = new PeriodicTimer(_interval);
        while (!stoppingToken.IsCancellationRequested)
        {
            await SyncAsync(stoppingToken);
            try { await timer.WaitForNextTickAsync(stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    /// <summary>Manually trigger a sync cycle (called from the /api/devlake/sync endpoint).</summary>
    public async Task<int> SyncAsync(CancellationToken ct = default)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var syncService = scope.ServiceProvider.GetRequiredService<DevLakeSyncService>();
            var db          = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (!syncService.IsEnabled)
            {
                LastSyncAt = DateTimeOffset.UtcNow;
                return 0;
            }

            // Push agent runs from the last sync window that haven't been synced
            var since = LastSyncAt ?? DateTimeOffset.UtcNow.AddHours(-1);
            var runs  = await db.AgentRunLogs
                .Where(r => r.StartedAt >= since)
                .ToListAsync(ct);

            foreach (var run in runs)
                await syncService.NotifyAgentRunAsync(run, ct);

            LastSyncAt = DateTimeOffset.UtcNow;
            _logger.LogInformation("[DevLakeSyncWorker] Synced {Count} agent runs to DevLake", runs.Count);
            return runs.Count;
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[DevLakeSyncWorker] Sync cycle failed — will retry on next tick");
            return 0;
        }
    }
}
