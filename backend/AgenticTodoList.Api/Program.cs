using AgenticTodoList.Api.Contracts;
using AgenticTodoList.Api.Data;
using AgenticTodoList.Api.Domain;
using AgenticTodoList.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));
builder.Services.AddScoped<ScrumService>();

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

app.MapGet("/health", () => Results.Ok(new { status = "ok", utc = DateTimeOffset.UtcNow }));

app.MapGet("/api/projects", async (AppDbContext db, CancellationToken ct) =>
    await db.Projects.OrderByDescending(p => p.CreatedAt).ToListAsync(ct));

app.MapPost("/api/projects", async (CreateProjectRequest request, ScrumService service, CancellationToken ct) =>
{
    var project = await service.CreateProjectAsync(request, ct);
    return Results.Created($"/api/projects/{project.Id}", project);
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
            WorkItems = db.WorkItems
                .Where(w => w.SprintId == s.Id)
                .OrderBy(w => w.CreatedAt)
                .Select(w => new
                {
                    w.Id,
                    w.Title,
                    w.Description,
                    w.Assignee,
                    w.Status,
                    w.CreatedAt,
                    w.UpdatedAt
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
        return Results.Ok(await service.UpdateWorkItemStatusAsync(workItemId, request, ct));
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

app.MapPost("/api/projects/{projectId:guid}/agent-runs", async (Guid projectId, AddAgentRunLogRequest request, ScrumService service, CancellationToken ct) =>
{
    try
    {
        return Results.Created($"/api/projects/{projectId}/agent-runs", await service.AddAgentRunAsync(projectId, request, ct));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.MapPost("/mcp", async (McpRequest mcpRequest, ScrumService service, AppDbContext db, CancellationToken ct) =>
{
    if (!string.Equals(mcpRequest.Jsonrpc, "2.0", StringComparison.Ordinal))
    {
        return Results.BadRequest(new McpResponse("2.0", mcpRequest.Id, Error: new { code = -32600, message = "Invalid JSON-RPC version." }));
    }

    if (mcpRequest.Method == "tools/list")
    {
        var result = new
        {
            tools = new object[]
            {
                new { name = "project.list", description = "List software projects", inputSchema = new { type = "object", properties = new { } } },
                new { name = "project.create", description = "Create project", inputSchema = new { type = "object", properties = new { name = new { type = "string" }, description = new { type = "string" } }, required = new[] { "name", "description" } } },
                new { name = "backlog.add", description = "Add backlog item", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, title = new { type = "string" }, description = new { type = "string" }, storyPoints = new { type = "integer" }, priority = new { type = "integer" } }, required = new[] { "projectId", "title", "description", "storyPoints", "priority" } } },
                new { name = "sprint.create", description = "Create sprint from backlog items", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, name = new { type = "string" }, goal = new { type = "string" }, startDate = new { type = "string" }, endDate = new { type = "string" }, backlogItemIds = new { type = "array", items = new { type = "string" } } }, required = new[] { "projectId", "name", "goal", "startDate", "endDate", "backlogItemIds" } } },
                new { name = "knowledge.checkpoint", description = "Create knowledge checkpoint", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, name = new { type = "string" }, contextSnapshot = new { type = "string" }, decisions = new { type = "string" }, risks = new { type = "string" }, nextActions = new { type = "string" } }, required = new[] { "projectId", "name", "contextSnapshot", "decisions", "risks", "nextActions" } } }
            }
        };

        return Results.Ok(new McpResponse("2.0", mcpRequest.Id, Result: result));
    }

    if (mcpRequest.Method != "tools/call" || mcpRequest.Params is null)
    {
        return Results.BadRequest(new McpResponse("2.0", mcpRequest.Id, Error: new { code = -32601, message = "Method not found." }));
    }

    var toolName = mcpRequest.Params.Value.GetProperty("name").GetString() ?? string.Empty;
    var args = mcpRequest.Params.Value.TryGetProperty("arguments", out var argumentsJson)
        ? argumentsJson
        : default;

    try
    {
        object responsePayload = toolName switch
        {
            "project.list" => await db.Projects.OrderByDescending(p => p.CreatedAt).Select(p => new { p.Id, p.Name, p.Description, p.CreatedAt }).ToListAsync(ct),
            "project.create" => await service.CreateProjectAsync(
                new CreateProjectRequest(
                    args.GetProperty("name").GetString() ?? string.Empty,
                    args.GetProperty("description").GetString() ?? string.Empty),
                ct),
            "backlog.add" => await service.AddBacklogItemAsync(
                Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty),
                new AddBacklogItemRequest(
                    args.GetProperty("title").GetString() ?? string.Empty,
                    args.GetProperty("description").GetString() ?? string.Empty,
                    args.GetProperty("storyPoints").GetInt32(),
                    args.GetProperty("priority").GetInt32()),
                ct),
            "sprint.create" => await service.CreateSprintAsync(
                Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty),
                new CreateSprintRequest(
                    args.GetProperty("name").GetString() ?? string.Empty,
                    args.GetProperty("goal").GetString() ?? string.Empty,
                    DateOnly.Parse(args.GetProperty("startDate").GetString() ?? string.Empty),
                    DateOnly.Parse(args.GetProperty("endDate").GetString() ?? string.Empty),
                    args.GetProperty("backlogItemIds").EnumerateArray().Select(p => Guid.Parse(p.GetString() ?? string.Empty)).ToArray()),
                ct),
            "knowledge.checkpoint" => await service.AddCheckpointAsync(
                Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty),
                new AddCheckpointRequest(
                    args.GetProperty("name").GetString() ?? string.Empty,
                    args.GetProperty("contextSnapshot").GetString() ?? string.Empty,
                    args.GetProperty("decisions").GetString() ?? string.Empty,
                    args.GetProperty("risks").GetString() ?? string.Empty,
                    args.GetProperty("nextActions").GetString() ?? string.Empty),
                ct),
            _ => throw new InvalidOperationException("Tool not found.")
        };

        return Results.Ok(new McpResponse("2.0", mcpRequest.Id, Result: new { content = JsonSerializer.Serialize(responsePayload) }));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new McpResponse("2.0", mcpRequest.Id, Error: new { code = -32000, message = ex.Message }));
    }
});

app.Run();

public partial class Program;
