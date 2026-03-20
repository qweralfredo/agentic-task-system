using PandoraTodoList.Api.Contracts;
using PandoraTodoList.Api.Data;
using PandoraTodoList.Api.Domain;
using PandoraTodoList.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]
    ?? builder.Configuration["FRONTEND_ORIGINS"]
    ?? "http://localhost:53000";
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
                new { name = "backlog.list", description = "List backlog items from a project", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" } }, required = new[] { "projectId" } } },
                new { name = "sprint.create", description = "Create sprint from backlog items", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, name = new { type = "string" }, goal = new { type = "string" }, startDate = new { type = "string" }, endDate = new { type = "string" }, backlogItemIds = new { type = "array", items = new { type = "string" } } }, required = new[] { "projectId", "name", "goal", "startDate", "endDate", "backlogItemIds" } } },
                new { name = "workitem.list", description = "List work items from a project and optional sprint", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, sprintId = new { type = "string" } }, required = new[] { "projectId" } } },
                new { name = "knowledge.checkpoint", description = "Create knowledge checkpoint", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, name = new { type = "string" }, contextSnapshot = new { type = "string" }, decisions = new { type = "string" }, risks = new { type = "string" }, nextActions = new { type = "string" } }, required = new[] { "projectId", "name", "contextSnapshot", "decisions", "risks", "nextActions" } } }
            }
        };

        return Results.Ok(new McpResponse("2.0", mcpRequest.Id, Result: result));
    }

    if (mcpRequest.Method == "prompts/list")
    {
        var result = new
        {
            prompts = new object[]
            {
                new
                {
                    name = "pandora.project.create",
                    description = "Guia para criar um projeto no Pandora via MCP tool.",
                    arguments = new[]
                    {
                        new { name = "name", description = "Nome do projeto.", required = true },
                        new { name = "description", description = "Descricao do projeto.", required = true }
                    }
                },
                new
                {
                    name = "pandora.backlog.add",
                    description = "Guia para adicionar item de backlog a um projeto.",
                    arguments = new[]
                    {
                        new { name = "projectId", description = "Id do projeto.", required = true },
                        new { name = "title", description = "Titulo da story.", required = true },
                        new { name = "description", description = "Descricao da story.", required = true },
                        new { name = "storyPoints", description = "Story points (inteiro).", required = true },
                        new { name = "priority", description = "Prioridade (inteiro).", required = true }
                    }
                },
                new
                {
                    name = "pandora.sprint.create",
                    description = "Guia para criar sprint a partir de backlog items.",
                    arguments = new[]
                    {
                        new { name = "projectId", description = "Id do projeto.", required = true },
                        new { name = "name", description = "Nome da sprint.", required = true },
                        new { name = "goal", description = "Objetivo da sprint.", required = true },
                        new { name = "startDate", description = "Data inicio (YYYY-MM-DD).", required = true },
                        new { name = "endDate", description = "Data fim (YYYY-MM-DD).", required = true },
                        new { name = "backlogItemIds", description = "Lista de ids do backlog.", required = true }
                    }
                },
                new
                {
                    name = "pandora.knowledge.checkpoint",
                    description = "Guia para registrar knowledge checkpoint no projeto.",
                    arguments = new[]
                    {
                        new { name = "projectId", description = "Id do projeto.", required = true },
                        new { name = "name", description = "Nome do checkpoint.", required = true },
                        new { name = "contextSnapshot", description = "Contexto atual.", required = true },
                        new { name = "decisions", description = "Decisoes tomadas.", required = true },
                        new { name = "risks", description = "Riscos identificados.", required = true },
                        new { name = "nextActions", description = "Proximas acoes.", required = true }
                    }
                },
                new
                {
                    name = "pandora.project.status",
                    description = "Guia para consultar projetos e obter status operacional.",
                    arguments = Array.Empty<object>()
                }
            }
        };

        return Results.Ok(new McpResponse("2.0", mcpRequest.Id, Result: result));
    }

    if (mcpRequest.Method == "prompts/get")
    {
        if (mcpRequest.Params is null || !mcpRequest.Params.Value.TryGetProperty("name", out var promptNameJson))
        {
            return Results.BadRequest(new McpResponse("2.0", mcpRequest.Id, Error: new { code = -32602, message = "Invalid params." }));
        }

        var promptName = promptNameJson.GetString() ?? string.Empty;
        var promptArgs = mcpRequest.Params.Value.TryGetProperty("arguments", out var promptArgumentsJson)
            ? promptArgumentsJson
            : default;

        string GetPromptArg(string name, string fallback)
        {
            if (promptArgs.ValueKind == JsonValueKind.Object
                && promptArgs.TryGetProperty(name, out var value)
                && value.ValueKind == JsonValueKind.String)
            {
                return value.GetString() ?? fallback;
            }

            return fallback;
        }

        try
        {
            var promptResult = promptName switch
            {
                "pandora.project.create" => new
                {
                    description = "Criar projeto no Pandora via MCP tool.",
                    messages = new object[]
                    {
                        new
                        {
                            role = "user",
                            content = new
                            {
                                type = "text",
                                text = $"Use a tool project.create com name='{GetPromptArg("name", "Novo Projeto")}' e description='{GetPromptArg("description", "Projeto criado via prompt MCP")}'."
                            }
                        }
                    }
                },
                "pandora.backlog.add" => new
                {
                    description = "Adicionar story no backlog do projeto.",
                    messages = new object[]
                    {
                        new
                        {
                            role = "user",
                            content = new
                            {
                                type = "text",
                                text = $"Use a tool backlog.add com projectId='{GetPromptArg("projectId", "<project-id>")}', title='{GetPromptArg("title", "Nova story")}', description='{GetPromptArg("description", "Descricao da story")}', storyPoints={GetPromptArg("storyPoints", "3")} e priority={GetPromptArg("priority", "1")}."
                            }
                        }
                    }
                },
                "pandora.sprint.create" => new
                {
                    description = "Criar sprint com itens do backlog.",
                    messages = new object[]
                    {
                        new
                        {
                            role = "user",
                            content = new
                            {
                                type = "text",
                                text = $"Use a tool sprint.create com projectId='{GetPromptArg("projectId", "<project-id>")}', name='{GetPromptArg("name", "Sprint 1")}', goal='{GetPromptArg("goal", "Entregar funcionalidades prioritarias")}', startDate='{GetPromptArg("startDate", DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"))}', endDate='{GetPromptArg("endDate", DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)).ToString("yyyy-MM-dd"))}' e backlogItemIds={GetPromptArg("backlogItemIds", "[\"<backlog-item-id>\"]")}."
                            }
                        }
                    }
                },
                "pandora.knowledge.checkpoint" => new
                {
                    description = "Registrar checkpoint de conhecimento do projeto.",
                    messages = new object[]
                    {
                        new
                        {
                            role = "user",
                            content = new
                            {
                                type = "text",
                                text = $"Use a tool knowledge.checkpoint com projectId='{GetPromptArg("projectId", "<project-id>")}', name='{GetPromptArg("name", "Checkpoint")}', contextSnapshot='{GetPromptArg("contextSnapshot", "Contexto atual")}', decisions='{GetPromptArg("decisions", "Decisoes registradas")}', risks='{GetPromptArg("risks", "Riscos mapeados")}' e nextActions='{GetPromptArg("nextActions", "Proximos passos")}'."
                            }
                        }
                    }
                },
                "pandora.project.status" => new
                {
                    description = "Consultar status de projetos no Pandora.",
                    messages = new object[]
                    {
                        new
                        {
                            role = "user",
                            content = new
                            {
                                type = "text",
                                text = "Use a tool project.list e responda com nome, id e data de criacao dos projetos."
                            }
                        }
                    }
                },
                _ => throw new InvalidOperationException("Prompt not found.")
            };

            return Results.Ok(new McpResponse("2.0", mcpRequest.Id, Result: promptResult));
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new McpResponse("2.0", mcpRequest.Id, Error: new { code = -32000, message = ex.Message }));
        }
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
            "backlog.list" => await db.BacklogItems
                .Where(b => b.ProjectId == Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty))
                .OrderBy(b => b.Priority)
                .ThenBy(b => b.CreatedAt)
                .Select(b => new { b.Id, b.ProjectId, b.Title, b.Description, b.StoryPoints, b.Priority, b.Status, b.CreatedAt })
                .ToListAsync(ct),
            "sprint.create" => await service.CreateSprintAsync(
                Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty),
                new CreateSprintRequest(
                    args.GetProperty("name").GetString() ?? string.Empty,
                    args.GetProperty("goal").GetString() ?? string.Empty,
                    DateOnly.Parse(args.GetProperty("startDate").GetString() ?? string.Empty),
                    DateOnly.Parse(args.GetProperty("endDate").GetString() ?? string.Empty),
                    args.GetProperty("backlogItemIds").EnumerateArray().Select(p => Guid.Parse(p.GetString() ?? string.Empty)).ToArray()),
                ct),
            "workitem.list" => await (args.TryGetProperty("sprintId", out var sprintIdJson)
                    && sprintIdJson.ValueKind == JsonValueKind.String
                    && Guid.TryParse(sprintIdJson.GetString(), out var sprintId)
                ? db.WorkItems
                    .AsNoTracking()
                    .Where(w => w.ProjectId == Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty)
                        && w.SprintId == sprintId)
                    .OrderBy(w => w.Status)
                    .ThenBy(w => w.CreatedAt)
                    .Select(w => new { w.Id, w.ProjectId, w.SprintId, w.BacklogItemId, w.Title, w.Description, w.Assignee, w.Status, w.CreatedAt, w.UpdatedAt })
                    .ToListAsync(ct)
                : db.WorkItems
                    .AsNoTracking()
                    .Where(w => w.ProjectId == Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty))
                    .OrderBy(w => w.Status)
                    .ThenBy(w => w.CreatedAt)
                    .Select(w => new { w.Id, w.ProjectId, w.SprintId, w.BacklogItemId, w.Title, w.Description, w.Assignee, w.Status, w.CreatedAt, w.UpdatedAt })
                    .ToListAsync(ct)),
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

