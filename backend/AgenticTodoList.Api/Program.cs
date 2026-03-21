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

public partial class Program;

