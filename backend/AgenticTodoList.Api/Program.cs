using PandoraTodoList.Api.Contracts;
using PandoraTodoList.Api.Data;
using PandoraTodoList.Api.Domain;
using PandoraTodoList.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]
    ?? builder.Configuration["FRONTEND_ORIGINS"]
    ?? "http://localhost:8400";
var allowedCorsOrigins = corsOrigins
    .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
    options.AddPolicy("FrontendCors", policy =>
        policy.WithOrigins(allowedCorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));
builder.Services.AddScoped<ScrumService>();

// DevLake integration (SP-03)
builder.Services.AddHttpClient("devlake", c =>
{
    c.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<DevLakeSyncService>();

// Real-time metrics (BL-13 SP-10)
builder.Services.AddSingleton<MetricsEventService>();

// Auth & RBAC (BL-14 SP-11)
builder.Services.AddSingleton<ApiKeyService>();

// Bidirectional sync worker (BL-15 SP-12)
builder.Services.AddSingleton<DevLakeSyncWorker>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<DevLakeSyncWorker>());

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Environment.IsEnvironment("Testing"))
    {
        db.Database.EnsureCreated();
    }
    else
    {
        db.Database.Migrate();
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("FrontendCors");

app.MapGet("/health", () => Results.Ok(new { status = "ok", utc = DateTimeOffset.UtcNow }));

app.MapGet("/api/projects", async (bool? includeArchived, AppDbContext db, CancellationToken ct) =>
    await (includeArchived == true ? db.Projects : db.Projects.Where(p => p.Status == ProjectStatus.Active))
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync(ct));

app.MapPost("/api/projects", async (CreateProjectRequest request, ScrumService service, CancellationToken ct) =>
{
    var project = await service.CreateProjectAsync(request, ct);
    return Results.Created($"/api/projects/{project.Id}", project);
});

app.MapPatch("/api/projects/{projectId:guid}/config", async (Guid projectId, UpdateProjectConfigRequest request, AppDbContext db, CancellationToken ct) =>
{
    var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
    if (project is null)
        return Results.NotFound(new { error = "Project not found." });

    if (request.GitHubUrl is not null) project.GitHubUrl = request.GitHubUrl.Trim();
    if (request.LocalPath is not null) project.LocalPath = request.LocalPath.Trim();
    if (request.TechStack is not null) project.TechStack = request.TechStack.Trim();
    if (request.MainBranch is not null) project.MainBranch = request.MainBranch.Trim();

    await db.SaveChangesAsync(ct);
    return Results.Ok(project);
});

app.MapDelete("/api/projects/{projectId:guid}", async (Guid projectId, AppDbContext db, CancellationToken ct) =>
{
    var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
    if (project is null)
    {
        return Results.NotFound(new { error = "Project not found." });
    }

    var result = await ArchiveProjectAsync(db, project, ct);
    return Results.Ok(result);
});

app.MapGet("/api/projects/{projectId:guid}/dashboard", async (Guid projectId, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Ok(await service.GetDashboardAsync(projectId, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapGet("/api/projects/{projectId:guid}/backlog", async (Guid projectId, AppDbContext db, CancellationToken ct) =>
    Results.Ok(await db.BacklogItems.Where(b => b.ProjectId == projectId).OrderBy(b => b.Priority).ToListAsync(ct)));

app.MapPost("/api/projects/{projectId:guid}/backlog", async (Guid projectId, AddBacklogItemRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Created($"/api/projects/{projectId}/backlog", await service.AddBacklogItemAsync(projectId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapGet("/api/projects/{projectId:guid}/sprints", async (Guid projectId, AppDbContext db, CancellationToken ct) =>
{
    var sprints = await db.Sprints
        .Where(s => s.ProjectId == projectId)
        .OrderByDescending(s => s.StartDate)
        .Select(s => new
        {
            s.Id,
            s.Name,
            s.Goal,
            s.StartDate,
            s.EndDate,
            s.Status,
            s.CommitIds,
            WorkItems = db.WorkItems
                .Where(w => w.SprintId == s.Id)
                .OrderBy(w => w.CreatedAt)
                .Select(w => new
                {
                    w.Id,
                    w.BacklogItemId,
                    w.ParentWorkItemId,
                    w.Title,
                    w.Description,
                    w.Assignee,
                    w.TotalTokensSpent,
                    w.LastModelUsed,
                    w.LastIdeUsed,
                    w.Status,
                    w.Branch,
                    w.Tags,
                    w.CommitIds,
                    w.CreatedAt,
                    w.UpdatedAt,
                    Feedbacks = db.WorkItemFeedbacks
                        .Where(f => f.WorkItemId == w.Id)
                        .OrderByDescending(f => f.CreatedAt)
                        .Select(f => new
                        {
                            f.Id,
                            f.AgentName,
                            f.ModelUsed,
                            f.IdeUsed,
                            f.TokensUsed,
                            f.Feedback,
                            f.MetadataJson,
                            f.CreatedAt
                        })
                        .ToList()
                })
                .ToList()
        })
        .ToListAsync(ct);

    return Results.Ok(sprints);
});

app.MapPost("/api/projects/{projectId:guid}/sprints", async (Guid projectId, CreateSprintRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        var sprint = await service.CreateSprintAsync(projectId, request, ct);
        return Results.Created(
            $"/api/projects/{projectId}/sprints/{sprint.Id}",
            new
            {
                sprint.Id,
                sprint.ProjectId,
                sprint.Name,
                sprint.Goal,
                sprint.StartDate,
                sprint.EndDate,
                sprint.Status,
                sprint.CreatedAt
            });
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/api/work-items/{workItemId:guid}/status", async (Guid workItemId, UpdateWorkItemStatusRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        var workItem = await service.UpdateWorkItemStatusAsync(workItemId, request, ct);
        return Results.Ok(new
        {
            workItem.Id,
            workItem.ProjectId,
            workItem.SprintId,
            workItem.BacklogItemId,
            workItem.ParentWorkItemId,
            workItem.Title,
            workItem.Description,
            workItem.Assignee,
            workItem.Status,
            workItem.Branch,
            workItem.Tags,
            workItem.CommitIds,
            workItem.TotalTokensSpent,
            workItem.LastModelUsed,
            workItem.LastIdeUsed,
            workItem.CreatedAt,
            workItem.UpdatedAt
        });
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/api/work-items/{workItemId:guid}/sub-tasks", async (Guid workItemId, AddSubTaskRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        var subTask = await service.AddSubTaskAsync(workItemId, request, ct);
        return Results.Created($"/api/work-items/{workItemId}/sub-tasks/{subTask.Id}", new
        {
            subTask.Id,
            subTask.ProjectId,
            subTask.SprintId,
            subTask.BacklogItemId,
            subTask.ParentWorkItemId,
            subTask.Title,
            subTask.Description,
            subTask.Assignee,
            subTask.Status,
            subTask.Branch,
            subTask.Tags,
            subTask.CommitIds,
            subTask.CreatedAt
        });
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPatch("/api/backlog-items/{backlogItemId:guid}/context", async (Guid backlogItemId, UpdateBacklogItemContextRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Ok(await service.UpdateBacklogItemContextAsync(backlogItemId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapDelete("/api/backlog-items/{backlogItemId:guid}", async (Guid backlogItemId, ScrumService service, CancellationToken ct) =>
{
    try
    {
        await service.DeleteBacklogItemAsync(backlogItemId, ct);
        return Results.NoContent();
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPatch("/api/sprints/{sprintId:guid}/commits", async (Guid sprintId, UpdateSprintCommitIdsRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        var sprint = await service.UpdateSprintCommitIdsAsync(sprintId, request, ct);
        return Results.Ok(new
        {
            sprint.Id,
            sprint.ProjectId,
            sprint.Name,
            sprint.Goal,
            sprint.StartDate,
            sprint.EndDate,
            sprint.Status,
            sprint.CommitIds,
            sprint.CreatedAt
        });
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/api/sprints/{sprintId:guid}/reviews", async (Guid sprintId, AddReviewRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Created($"/api/sprints/{sprintId}/reviews", await service.AddReviewAsync(sprintId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapGet("/api/projects/{projectId:guid}/knowledge", async (Guid projectId, AppDbContext db, CancellationToken ct) =>
    Results.Ok(new
    {
        wikiPages = await db.WikiPages.Where(w => w.ProjectId == projectId).OrderByDescending(w => w.UpdatedAt).ToListAsync(ct),
        documentationPages = await db.DocumentationPages.Where(d => d.ProjectId == projectId).OrderBy(d => d.Category).ThenByDescending(d => d.UpdatedAt).ToListAsync(ct),
        checkpoints = await db.KnowledgeCheckpoints.Where(k => k.ProjectId == projectId).OrderByDescending(k => k.CreatedAt).ToListAsync(ct),
        agentRuns = await db.AgentRunLogs.Where(a => a.ProjectId == projectId).OrderByDescending(a => a.StartedAt).Take(100).ToListAsync(ct)
    }));

app.MapPost("/api/projects/{projectId:guid}/wiki", async (Guid projectId, AddWikiPageRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Created($"/api/projects/{projectId}/wiki", await service.AddWikiPageAsync(projectId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/api/projects/{projectId:guid}/checkpoints", async (Guid projectId, AddCheckpointRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Created($"/api/projects/{projectId}/checkpoints", await service.AddCheckpointAsync(projectId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/api/projects/{projectId:guid}/documentation", async (Guid projectId, AddDocumentationPageRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Created($"/api/projects/{projectId}/documentation", await service.AddDocumentationPageAsync(projectId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/api/projects/{projectId:guid}/agent-runs", async (Guid projectId, AddAgentRunLogRequest request, ScrumService service, DevLakeSyncService devLake, CancellationToken ct) =>
{
    try
    {
        var run = await service.AddAgentRunAsync(projectId, request, ct);
        await devLake.NotifyAgentRunAsync(run, ct);
        return Results.Created($"/api/projects/{projectId}/agent-runs", run);
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Human Evaluation endpoints (SP-03 BL-06)
app.MapPost("/api/agent-runs/{runId:guid}/evaluations", async (
    Guid runId,
    SubmitHumanEvaluationRequest request,
    AppDbContext db,
    CancellationToken ct) =>
{
    var run = await db.AgentRunLogs.FirstOrDefaultAsync(r => r.Id == runId, ct);
    if (run is null)
        return Results.NotFound(new { error = "Agent run not found." });

    // Composite score: Accuracy×0.30 + Relevance×0.25 + Completeness×0.25 + Safety×0.20, then ×5
    var composite = (request.AccuracyScore * 0.30f
                   + request.RelevanceScore * 0.25f
                   + request.CompletenessScore * 0.25f
                   + request.SafetyScore * 0.20f) * 5f;

    var eval = new HumanEvaluationEntity
    {
        AgentRunId = runId,
        ReviewerId = request.ReviewerId,
        AccuracyScore = request.AccuracyScore,
        RelevanceScore = request.RelevanceScore,
        CompletenessScore = request.CompletenessScore,
        SafetyScore = request.SafetyScore,
        Score = MathF.Round(composite, 2),
        FeedbackText = request.FeedbackText,
        RequiresEscalation = request.RequiresEscalation,
        ReviewTimeSeconds = request.ReviewTimeSeconds,
    };

    db.HumanEvaluations.Add(eval);
    await db.SaveChangesAsync(ct);

    return Results.Created($"/api/agent-runs/{runId}/evaluations/{eval.Id}",
        ToDto(eval));
});

app.MapGet("/api/agent-runs/{runId:guid}/evaluations", async (Guid runId, AppDbContext db, CancellationToken ct) =>
{
    var evals = (await db.HumanEvaluations
        .Where(e => e.AgentRunId == runId)
        .OrderByDescending(e => e.SubmittedAt)
        .ToListAsync(ct))
        .Select(ToDto)
        .ToList();
    return Results.Ok(evals);
});

app.MapGet("/api/projects/{projectId:guid}/evaluations/pending", async (Guid projectId, AppDbContext db, CancellationToken ct) =>
{
    // Work items with agent runs that have no evaluation in last 7 days
    var since = DateTimeOffset.UtcNow.AddDays(-7);
    var pendingRuns = await db.AgentRunLogs
        .Where(r => r.ProjectId == projectId && r.StartedAt >= since)
        .Where(r => !r.HumanEvaluations.Any())
        .OrderByDescending(r => r.StartedAt)
        .Select(r => new { r.Id, r.AgentName, r.EntryPoint, r.StartedAt, r.Success, r.ModelName })
        .ToListAsync(ct);
    return Results.Ok(pendingRuns);
});

// ── BL-07: Token & Cost Analytics Pipeline endpoints ─────────────────────
app.MapGet("/api/projects/{projectId:guid}/metrics/token-summary", async (
    Guid projectId, AppDbContext db, CancellationToken ct,
    int days = 30) =>
{
    var since = DateTimeOffset.UtcNow.AddDays(-days);
    var runs = await db.AgentRunLogs
        .Where(r => r.ProjectId == projectId && r.StartedAt >= since)
        .ToListAsync(ct);

    if (!runs.Any()) return Results.Ok(new
    {
        totalRuns = 0, successRate = 0.0, totalTokensInput = 0, totalTokensOutput = 0,
        totalCostUsd = 0.0, avgCostPerRun = 0.0, avgLatencyMs = 0L,
        byModel = new object[0], dailyRollup = new object[0]
    });

    var byModel = runs
        .GroupBy(r => r.ModelName)
        .Select(g => new
        {
            model = g.Key,
            runs = g.Count(),
            successRate = Math.Round(g.Count(r => r.Success) / (double)g.Count() * 100, 1),
            totalTokens = g.Sum(r => r.TokensInput + r.TokensOutput),
            totalCostUsd = Math.Round((double)g.Sum(r => r.CostUsd), 4),
            avgLatencyMs = (long)g.Average(r => r.LatencyMs)
        }).ToList();

    var dailyRollup = runs
        .GroupBy(r => r.StartedAt.Date)
        .OrderBy(g => g.Key)
        .Select(g => new
        {
            date = g.Key.ToString("yyyy-MM-dd"),
            runs = g.Count(),
            totalCostUsd = Math.Round((double)g.Sum(r => r.CostUsd), 4),
            totalTokens = g.Sum(r => r.TokensInput + r.TokensOutput),
            successRate = Math.Round(g.Count(r => r.Success) / (double)g.Count() * 100, 1)
        }).ToList();

    return Results.Ok(new
    {
        totalRuns = runs.Count,
        successRate = Math.Round(runs.Count(r => r.Success) / (double)runs.Count * 100, 1),
        totalTokensInput = runs.Sum(r => r.TokensInput),
        totalTokensOutput = runs.Sum(r => r.TokensOutput),
        totalCostUsd = Math.Round((double)runs.Sum(r => r.CostUsd), 4),
        avgCostPerRun = Math.Round((double)runs.Average(r => r.CostUsd), 6),
        avgLatencyMs = (long)runs.Average(r => r.LatencyMs),
        byModel,
        dailyRollup
    });
});

app.MapGet("/api/projects/{projectId:guid}/metrics/cost-budget", async (
    Guid projectId, AppDbContext db, IConfiguration cfg, CancellationToken ct) =>
{
    var budgetLimit = cfg.GetValue<double>($"Analytics:BudgetLimitUsd:{projectId}", 100.0);
    var monthStart = new DateTimeOffset(DateTimeOffset.UtcNow.Year, DateTimeOffset.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
    var spentThisMonth = await db.AgentRunLogs
        .Where(r => r.ProjectId == projectId && r.StartedAt >= monthStart)
        .SumAsync(r => r.CostUsd, ct);

    return Results.Ok(new
    {
        budgetUsd = budgetLimit,
        spentUsd = Math.Round((double)spentThisMonth, 4),
        remainingUsd = Math.Round(budgetLimit - (double)spentThisMonth, 4),
        usagePct = Math.Round((double)spentThisMonth / budgetLimit * 100, 1),
        alertLevel = (spentThisMonth / (decimal)budgetLimit) switch
        {
            >= 0.9m => "critical",
            >= 0.7m => "warning",
            _        => "ok"
        }
    });
});

// ── BL-14: Audit log endpoint (API-key protected) ─────────────────────────
app.MapGet("/api/projects/{projectId:guid}/audit-log", async (
    Guid projectId, HttpContext ctx, AppDbContext db,
    ApiKeyService apiKeys, CancellationToken ct) =>
{
    var key = ctx.Request.Headers["X-Pandora-Api-Key"].FirstOrDefault();
    if (!apiKeys.IsValid(key))
        return Results.Unauthorized();

    var entries = await db.AgentRunLogs
        .Where(r => r.ProjectId == projectId)
        .OrderByDescending(r => r.StartedAt)
        .Take(200)
        .Select(r => new
        {
            r.Id, r.AgentName, r.ModelName, r.StartedAt, r.Success,
            r.TokensInput, r.TokensOutput, r.CostUsd, r.LatencyMs, r.Environment
        })
        .ToListAsync(ct);

    return Results.Ok(new { projectId, count = entries.Count, entries });
});

// ── BL-15: Sync trigger + status endpoints ────────────────────────────────
app.MapPost("/api/devlake/sync", async (
    HttpContext ctx, ApiKeyService apiKeys, DevLakeSyncWorker worker, CancellationToken ct) =>
{
    var key = ctx.Request.Headers["X-Pandora-Api-Key"].FirstOrDefault();
    if (!apiKeys.IsValid(key))
        return Results.Unauthorized();

    var count = await worker.SyncAsync(ct);
    return Results.Ok(new { synced = count, triggeredAt = DateTimeOffset.UtcNow });
});

app.MapGet("/api/devlake/sync/status", (HttpContext ctx, ApiKeyService apiKeys, DevLakeSyncWorker worker) =>
{
    var key = ctx.Request.Headers["X-Pandora-Api-Key"].FirstOrDefault();
    if (!apiKeys.IsValid(key))
        return Results.Unauthorized();

    return Results.Ok(new
    {
        isEnabled = true,
        syncIntervalMinutes = worker.SyncIntervalMinutes,
        lastSyncAt = worker.LastSyncAt
    });
});

// ── BL-13: SSE endpoint /api/metrics/stream ──────────────────────────────
app.MapGet("/api/metrics/stream", async (MetricsEventService events, HttpContext ctx, CancellationToken ct) =>
{
    ctx.Response.Headers.ContentType = "text/event-stream";
    ctx.Response.Headers.CacheControl = "no-cache";
    ctx.Response.Headers.Connection = "keep-alive";

    var reader = events.Subscribe();
    try
    {
        // Send connection confirmation
        await ctx.Response.WriteAsync("event: connected\ndata: {\"status\":\"ok\"}\n\n", ct);
        await ctx.Response.Body.FlushAsync(ct);

        using var keepAliveTimer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        var keepAliveTask = Task.Run(async () =>
        {
            while (!ct.IsCancellationRequested)
            {
                await keepAliveTimer.WaitForNextTickAsync(ct);
                if (!ct.IsCancellationRequested)
                {
                    await ctx.Response.WriteAsync(": keep-alive\n\n", ct);
                    await ctx.Response.Body.FlushAsync(ct);
                }
            }
        }, ct);

        await foreach (var evt in reader.ReadAllAsync(ct))
        {
            var json = System.Text.Json.JsonSerializer.Serialize(evt.Data);
            await ctx.Response.WriteAsync($"event: {evt.EventType}\ndata: {json}\n\n", ct);
            await ctx.Response.Body.FlushAsync(ct);
        }
    }
    catch (OperationCanceledException) { /* client disconnected */ }
    finally
    {
        events.Unsubscribe(reader);
    }
});

// ── BL-16: Webhook endpoint /api/devlake/webhook ─────────────────────────
app.MapPost("/api/devlake/webhook", async (
    HttpContext ctx,
    MetricsEventService events,
    IConfiguration config,
    CancellationToken ct) =>
{
    var secret = config["DevLake:WebhookSecret"] ?? string.Empty;
    var signatureHeader = ctx.Request.Headers["X-Pandora-Signature-256"].FirstOrDefault() ?? string.Empty;

    if (string.IsNullOrEmpty(signatureHeader))
        return Results.Unauthorized();

    // Read body for HMAC verification
    ctx.Request.EnableBuffering();
    using var ms = new System.IO.MemoryStream();
    await ctx.Request.Body.CopyToAsync(ms, ct);
    var bodyBytes = ms.ToArray();
    ctx.Request.Body.Position = 0;

    // Verify HMAC-SHA256
    if (!string.IsNullOrEmpty(secret))
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secret));
        var expected = "sha256=" + Convert.ToHexString(hmac.ComputeHash(bodyBytes)).ToLowerInvariant();
        if (!System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(expected),
            System.Text.Encoding.UTF8.GetBytes(signatureHeader)))
            return Results.Unauthorized();
    }

    var payload = System.Text.Json.JsonDocument.Parse(bodyBytes).RootElement;
    var eventType = payload.TryGetProperty("eventType", out var et) ? et.GetString() ?? "" : "";

    var knownEvents = new[] { "agent_run_completed", "evaluation_submitted", "workitem_updated" };
    if (!knownEvents.Contains(eventType))
        return Results.UnprocessableEntity(new { error = $"Unknown event type: {eventType}" });

    // Fan out to SSE subscribers
    events.Publish(new MetricsEvent(eventType, payload));

    return Results.Ok(new { received = true, eventType });
});

app.Run();

static HumanEvaluationDto ToDto(HumanEvaluationEntity e) => new(
    e.Id, e.AgentRunId, e.ReviewerId, e.Score,
    e.AccuracyScore, e.RelevanceScore, e.CompletenessScore, e.SafetyScore,
    e.FeedbackText, e.RequiresEscalation, e.ReviewTimeSeconds, e.SubmittedAt);

static async Task<object> ArchiveProjectAsync(AppDbContext db, ProjectEntity project, CancellationToken ct)
{
    if (project.Status == ProjectStatus.Archived)
    {
        return new { archived = true, alreadyArchived = true, projectId = project.Id };
    }

    project.Status = ProjectStatus.Archived;
    project.ArchivedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(ct);

    return new { archived = true, alreadyArchived = false, projectId = project.Id, archivedAt = project.ArchivedAt };
}

public partial class Program;

