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
    await db.Projects.Where(p => p.Status == ProjectStatus.Active).OrderByDescending(p => p.CreatedAt).ToListAsync(ct));

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
                    w.TotalTokensSpent,
                    w.LastModelUsed,
                    w.LastIdeUsed,
                    w.Status,
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
            workItem.Title,
            workItem.Description,
            workItem.Assignee,
            workItem.Status,
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

app.MapPost("/mcp", async (JsonElement payload, ScrumService service, AppDbContext db, CancellationToken ct) =>
{
    async Task<McpResponse?> HandleSingleRequestAsync(JsonElement request)
    {
        if (request.ValueKind != JsonValueKind.Object)
        {
            return CreateMcpErrorResponse(null, -32600, "Invalid Request.");
        }

        var hasId = request.TryGetProperty("id", out var requestIdRaw);
        JsonElement? requestId = hasId ? requestIdRaw.Clone() : null;
        var isNotification = !hasId;

        if (!request.TryGetProperty("jsonrpc", out var jsonRpcVersion)
            || jsonRpcVersion.ValueKind != JsonValueKind.String
            || !string.Equals(jsonRpcVersion.GetString(), "2.0", StringComparison.Ordinal))
        {
            return isNotification ? null : CreateMcpErrorResponse(requestId, -32600, "Invalid JSON-RPC version.");
        }

        if (!request.TryGetProperty("method", out var methodProperty)
            || methodProperty.ValueKind != JsonValueKind.String)
        {
            return isNotification ? null : CreateMcpErrorResponse(requestId, -32600, "Invalid Request.");
        }

        var method = methodProperty.GetString() ?? string.Empty;
        var requestParams = request.TryGetProperty("params", out var paramsProperty)
            ? paramsProperty
            : default;

        try
        {
            object resultPayload = method switch
            {
                "initialize" => BuildInitializeResult(),
                "initialized" => new { acknowledged = true },
                "tools/list" => BuildToolsListResult(),
                "prompts/list" => BuildPromptsListResult(),
                "prompts/get" => BuildPromptGetResult(requestParams),
                "tools/call" => BuildToolCallResult(
                    await ExecuteToolAsync(service, db, requestParams, ct)),
                _ => throw new MissingMethodException("Method not found.")
            };

            return isNotification ? null : new McpResponse("2.0", requestId, Result: resultPayload);
        }
        catch (MissingMethodException ex)
        {
            return isNotification ? null : CreateMcpErrorResponse(requestId, -32601, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return isNotification ? null : CreateMcpErrorResponse(requestId, -32602, ex.Message);
        }
        catch (Exception ex)
        {
            return isNotification ? null : CreateMcpErrorResponse(requestId, -32000, ex.Message);
        }
    }

    if (payload.ValueKind == JsonValueKind.Array)
    {
        var responses = new List<McpResponse>();
        foreach (var batchRequest in payload.EnumerateArray())
        {
            var response = await HandleSingleRequestAsync(batchRequest);
            if (response is not null)
            {
                responses.Add(response);
            }
        }

        return responses.Count == 0 ? Results.NoContent() : Results.Ok(responses);
    }

    if (payload.ValueKind == JsonValueKind.Object)
    {
        var response = await HandleSingleRequestAsync(payload);
        return response is null ? Results.NoContent() : Results.Ok(response);
    }

    return Results.BadRequest(CreateMcpErrorResponse(null, -32600, "Invalid Request."));
});

app.Run();

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

static McpResponse CreateMcpErrorResponse(JsonElement? id, int code, string message)
    => new("2.0", id, Error: new McpError(code, message));

static object BuildInitializeResult() => new
{
    protocolVersion = "2025-03-26",
    serverInfo = new
    {
        name = "pandora-todo-list-mcp",
        version = "1.0.0"
    },
    capabilities = new
    {
        tools = new { listChanged = false },
        prompts = new { listChanged = false }
    }
};

static object BuildToolsListResult() => new
{
    tools = new object[]
    {
        new { name = "project.list", description = "List software projects", inputSchema = new { type = "object", properties = new { includeArchived = new { type = "boolean" } } } },
        new { name = "project.create", description = "Create project", inputSchema = new { type = "object", properties = new { name = new { type = "string" }, description = new { type = "string" } }, required = new[] { "name", "description" } } },
        new { name = "project.delete", description = "Archive a project by id (soft delete)", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" } }, required = new[] { "projectId" } } },
        new { name = "backlog.add", description = "Add backlog item", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, title = new { type = "string" }, description = new { type = "string" }, storyPoints = new { type = "integer" }, priority = new { type = "integer" } }, required = new[] { "projectId", "title", "description", "storyPoints", "priority" } } },
        new { name = "backlog.list", description = "List backlog items from a project", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" } }, required = new[] { "projectId" } } },
        new { name = "sprint.create", description = "Create sprint from backlog items", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, name = new { type = "string" }, goal = new { type = "string" }, startDate = new { type = "string" }, endDate = new { type = "string" }, backlogItemIds = new { type = "array", items = new { type = "string" } } }, required = new[] { "projectId", "name", "goal", "startDate", "endDate", "backlogItemIds" } } },
        new { name = "workitem.update", description = "Update work item and register token usage feedback", inputSchema = new { type = "object", properties = new { workItemId = new { type = "string" }, status = new { type = "integer" }, assignee = new { type = "string" }, tokensUsed = new { type = "integer" }, agentName = new { type = "string" }, modelUsed = new { type = "string" }, ideUsed = new { type = "string" }, feedback = new { type = "string" }, metadataJson = new { type = "string" } }, required = new[] { "workItemId", "status", "assignee", "tokensUsed" } } },
        new { name = "workitem.list", description = "List work items from a project and optional sprint", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, sprintId = new { type = "string" } }, required = new[] { "projectId" } } },
        new { name = "knowledge.checkpoint", description = "Create knowledge checkpoint", inputSchema = new { type = "object", properties = new { projectId = new { type = "string" }, name = new { type = "string" }, contextSnapshot = new { type = "string" }, decisions = new { type = "string" }, risks = new { type = "string" }, nextActions = new { type = "string" } }, required = new[] { "projectId", "name", "contextSnapshot", "decisions", "risks", "nextActions" } } }
    }
};

static object BuildPromptsListResult() => new
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

static object BuildPromptGetResult(JsonElement requestParams)
{
    if (requestParams.ValueKind != JsonValueKind.Object || !requestParams.TryGetProperty("name", out var promptNameJson))
    {
        throw new InvalidOperationException("Invalid params.");
    }

    var promptName = promptNameJson.GetString() ?? string.Empty;
    var promptArgs = requestParams.TryGetProperty("arguments", out var promptArgumentsJson)
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

    return promptName switch
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
}

static object BuildToolCallResult(object responsePayload)
{
    var rawText = JsonSerializer.Serialize(responsePayload);
    return new
    {
        content = new object[]
        {
            new
            {
                type = "text",
                text = rawText
            }
        },
        structuredContent = responsePayload
    };
}

static async Task<object> ExecuteToolAsync(ScrumService service, AppDbContext db, JsonElement requestParams, CancellationToken ct)
{
    if (requestParams.ValueKind != JsonValueKind.Object || !requestParams.TryGetProperty("name", out var toolNameJson))
    {
        throw new InvalidOperationException("Invalid params.");
    }

    var toolName = toolNameJson.GetString() ?? string.Empty;
    var args = requestParams.TryGetProperty("arguments", out var argumentsJson)
        ? argumentsJson
        : default;

    return toolName switch
    {
        "project.list" => await (
            args.TryGetProperty("includeArchived", out var includeArchivedJson)
            && includeArchivedJson.ValueKind is JsonValueKind.True or JsonValueKind.False
            && includeArchivedJson.GetBoolean()
                ? db.Projects
                : db.Projects.Where(p => p.Status == ProjectStatus.Active))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new { p.Id, p.Name, p.Description, p.Status, p.ArchivedAt, p.CreatedAt })
            .ToListAsync(ct),
        "project.create" => await service.CreateProjectAsync(
            new CreateProjectRequest(
                args.GetProperty("name").GetString() ?? string.Empty,
                args.GetProperty("description").GetString() ?? string.Empty),
            ct),
        "project.delete" => await (args.GetProperty("projectId").GetString() is string projectIdRaw
                && Guid.TryParse(projectIdRaw, out var projectId)
            ? db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct)
            : throw new InvalidOperationException("Invalid projectId.")) switch
            {
                var project when project is not null => await ArchiveProjectAsync(db, project, ct),
                _ => throw new InvalidOperationException("Project not found.")
            },
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
                .Select(w => new
                {
                    w.Id,
                    w.ProjectId,
                    w.SprintId,
                    w.BacklogItemId,
                    w.Title,
                    w.Description,
                    w.Assignee,
                    w.TotalTokensSpent,
                    w.LastModelUsed,
                    w.LastIdeUsed,
                    w.Status,
                    w.CreatedAt,
                    w.UpdatedAt,
                    Feedbacks = db.WorkItemFeedbacks
                        .Where(f => f.WorkItemId == w.Id)
                        .OrderByDescending(f => f.CreatedAt)
                        .Select(f => new { f.Id, f.AgentName, f.ModelUsed, f.IdeUsed, f.TokensUsed, f.Feedback, f.MetadataJson, f.CreatedAt })
                        .ToList()
                })
                .ToListAsync(ct)
            : db.WorkItems
                .AsNoTracking()
                .Where(w => w.ProjectId == Guid.Parse(args.GetProperty("projectId").GetString() ?? string.Empty))
                .OrderBy(w => w.Status)
                .ThenBy(w => w.CreatedAt)
                .Select(w => new
                {
                    w.Id,
                    w.ProjectId,
                    w.SprintId,
                    w.BacklogItemId,
                    w.Title,
                    w.Description,
                    w.Assignee,
                    w.TotalTokensSpent,
                    w.LastModelUsed,
                    w.LastIdeUsed,
                    w.Status,
                    w.CreatedAt,
                    w.UpdatedAt,
                    Feedbacks = db.WorkItemFeedbacks
                        .Where(f => f.WorkItemId == w.Id)
                        .OrderByDescending(f => f.CreatedAt)
                        .Select(f => new { f.Id, f.AgentName, f.ModelUsed, f.IdeUsed, f.TokensUsed, f.Feedback, f.MetadataJson, f.CreatedAt })
                        .ToList()
                })
                .ToListAsync(ct)),
        "workitem.update" => await service.UpdateWorkItemStatusAsync(
                Guid.Parse(args.GetProperty("workItemId").GetString() ?? string.Empty),
                new UpdateWorkItemStatusRequest(
                    args.GetProperty("status").ValueKind == JsonValueKind.String
                        ? Enum.Parse<WorkItemStatus>(args.GetProperty("status").GetString() ?? nameof(WorkItemStatus.Todo), true)
                        : (WorkItemStatus)args.GetProperty("status").GetInt32(),
                    args.GetProperty("assignee").GetString() ?? string.Empty,
                    args.TryGetProperty("tokensUsed", out var tokensUsedJson) ? tokensUsedJson.GetInt32() : 0,
                    args.TryGetProperty("agentName", out var agentNameJson) ? agentNameJson.GetString() ?? string.Empty : string.Empty,
                    args.TryGetProperty("modelUsed", out var modelUsedJson) ? modelUsedJson.GetString() ?? string.Empty : string.Empty,
                    args.TryGetProperty("ideUsed", out var ideUsedJson) ? ideUsedJson.GetString() ?? string.Empty : string.Empty,
                    args.TryGetProperty("feedback", out var feedbackJson) ? feedbackJson.GetString() ?? string.Empty : string.Empty,
                    args.TryGetProperty("metadataJson", out var metadataJson) ? metadataJson.GetString() ?? string.Empty : string.Empty),
                ct)
            .ContinueWith(task =>
            {
                var w = task.Result;
                return new
                {
                    w.Id,
                    w.ProjectId,
                    w.SprintId,
                    w.BacklogItemId,
                    w.Status,
                    w.Assignee,
                    w.TotalTokensSpent,
                    w.LastModelUsed,
                    w.LastIdeUsed,
                    w.UpdatedAt
                };
            }, ct),
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
}

public partial class Program;

