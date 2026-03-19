using AgenticTodoList.Api.Contracts;
using AgenticTodoList.Api.Data;
using AgenticTodoList.Api.Domain;
using AgenticTodoList.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgenticTodoList.Api.Tests;

public class ScrumServiceTests
{
    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateProjectAndBacklog_ShouldPersistData()
    {
        await using var db = CreateDbContext();
        var service = new ScrumService(db);

        var project = await service.CreateProjectAsync(new CreateProjectRequest("Agentic Core", "Plataforma scrum"), CancellationToken.None);
        var backlog = await service.AddBacklogItemAsync(project.Id, new AddBacklogItemRequest("Story A", "Descricao", 5, 1), CancellationToken.None);

        Assert.NotEqual(Guid.Empty, project.Id);
        Assert.Equal(project.Id, backlog.ProjectId);
        Assert.Equal(BacklogItemStatus.Planned, backlog.Status);
    }

    [Fact]
    public async Task CreateSprint_ShouldCreateWorkItemsAndMarkBacklogInSprint()
    {
        await using var db = CreateDbContext();
        var service = new ScrumService(db);

        var project = await service.CreateProjectAsync(new CreateProjectRequest("Agentic", "Descricao"), CancellationToken.None);
        var b1 = await service.AddBacklogItemAsync(project.Id, new AddBacklogItemRequest("Task 1", "Desc", 3, 1), CancellationToken.None);
        var b2 = await service.AddBacklogItemAsync(project.Id, new AddBacklogItemRequest("Task 2", "Desc", 2, 2), CancellationToken.None);

        var sprint = await service.CreateSprintAsync(
            project.Id,
            new CreateSprintRequest("Sprint 1", "Entregar MVP", DateOnly.FromDateTime(DateTime.UtcNow), DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)), [b1.Id, b2.Id]),
            CancellationToken.None);

        var workItems = await db.WorkItems.Where(w => w.SprintId == sprint.Id).ToListAsync();
        Assert.Equal(2, workItems.Count);
        Assert.All(workItems, w => Assert.Equal(WorkItemStatus.Todo, w.Status));

        var reloaded = await db.BacklogItems.Where(b => b.ProjectId == project.Id).ToListAsync();
        Assert.All(reloaded, b => Assert.Equal(BacklogItemStatus.InSprint, b.Status));
    }

    [Fact]
    public async Task UpdateWorkItemStatus_Done_ShouldMarkBacklogDone()
    {
        await using var db = CreateDbContext();
        var service = new ScrumService(db);

        var project = await service.CreateProjectAsync(new CreateProjectRequest("Project", "Desc"), CancellationToken.None);
        var backlog = await service.AddBacklogItemAsync(project.Id, new AddBacklogItemRequest("Story", "Desc", 8, 1), CancellationToken.None);
        var sprint = await service.CreateSprintAsync(
            project.Id,
            new CreateSprintRequest("Sprint", "Goal", DateOnly.FromDateTime(DateTime.UtcNow), DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), [backlog.Id]),
            CancellationToken.None);

        var item = await db.WorkItems.FirstAsync(w => w.SprintId == sprint.Id);
        var updated = await service.UpdateWorkItemStatusAsync(item.Id, new UpdateWorkItemStatusRequest(WorkItemStatus.Done, "agent-1"), CancellationToken.None);

        Assert.Equal(WorkItemStatus.Done, updated.Status);
        Assert.Equal("agent-1", updated.Assignee);

        var backlogReloaded = await db.BacklogItems.FirstAsync(b => b.Id == backlog.Id);
        Assert.Equal(BacklogItemStatus.Done, backlogReloaded.Status);
    }

    [Fact]
    public async Task KnowledgeAndAgentRun_ShouldBeIncludedInDashboard()
    {
        await using var db = CreateDbContext();
        var service = new ScrumService(db);

        var project = await service.CreateProjectAsync(new CreateProjectRequest("Knowledge", "Desc"), CancellationToken.None);
        await service.AddWikiPageAsync(project.Id, new AddWikiPageRequest("Onboarding", "## Steps", "onboarding,docs"), CancellationToken.None);
        await service.AddCheckpointAsync(project.Id, new AddCheckpointRequest("Checkpoint 1", "Contexto", "Decisao", "Risco", "Proximas acoes"), CancellationToken.None);
        await service.AddAgentRunAsync(project.Id, new AddAgentRunLogRequest("vscode-agent", "mcp", "entrada", "saida", "success", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow), CancellationToken.None);

        var dashboard = await service.GetDashboardAsync(project.Id, CancellationToken.None);

        Assert.Equal(1, dashboard.KnowledgeCheckpoints);
        Assert.Equal(1, dashboard.WikiPages);
        Assert.Equal(1, dashboard.AgentRuns);
    }
}
