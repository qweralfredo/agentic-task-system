using AgenticTodoList.Api.Contracts;
using AgenticTodoList.Api.Domain;

namespace AgenticTodoList.Api.Tests;

public class DomainContractsDefaultsTests
{
    [Fact]
    public void DomainEntities_ShouldInitializeDefaultValues()
    {
        var project = new ProjectEntity();
        var backlog = new BacklogItemEntity();
        var sprint = new SprintEntity();
        var workItem = new WorkItemEntity();
        var review = new ReviewEntity();
        var wiki = new WikiPageEntity();
        var checkpoint = new KnowledgeCheckpointEntity();
        var run = new AgentRunLogEntity();

        Assert.NotEqual(Guid.Empty, project.Id);
        Assert.NotEqual(Guid.Empty, backlog.Id);
        Assert.NotEqual(Guid.Empty, sprint.Id);
        Assert.NotEqual(Guid.Empty, workItem.Id);
        Assert.NotEqual(Guid.Empty, review.Id);
        Assert.NotEqual(Guid.Empty, wiki.Id);
        Assert.NotEqual(Guid.Empty, checkpoint.Id);
        Assert.NotEqual(Guid.Empty, run.Id);

        Assert.Equal(string.Empty, project.Name);
        Assert.Equal(string.Empty, backlog.Title);
        Assert.Equal(string.Empty, sprint.Name);
        Assert.Equal(string.Empty, workItem.Title);
        Assert.Equal(string.Empty, review.Type);
        Assert.Equal(string.Empty, wiki.Title);
        Assert.Equal(string.Empty, checkpoint.Name);
        Assert.Equal(string.Empty, run.AgentName);

        Assert.Equal(BacklogItemStatus.New, backlog.Status);
        Assert.Equal(WorkItemStatus.Todo, workItem.Status);
        Assert.Equal(SprintStatus.Planned, sprint.Status);
    }

    [Fact]
    public void DtoRecords_ShouldBindValues()
    {
        var createProject = new CreateProjectRequest("N", "D");
        var backlog = new AddBacklogItemRequest("T", "D", 3, 1);
        var sprint = new CreateSprintRequest("S", "G", DateOnly.FromDateTime(DateTime.UtcNow), DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)), []);
        var update = new UpdateWorkItemStatusRequest(WorkItemStatus.Done, "agent");
        var review = new AddReviewRequest("review", "sum", "notes");
        var wiki = new AddWikiPageRequest("wiki", "body", "tag");
        var checkpoint = new AddCheckpointRequest("cp", "ctx", "dec", "risk", "next");
        var run = new AddAgentRunLogRequest("a", "mcp", "in", "out", "ok", DateTimeOffset.UtcNow, null);
        var dashboard = new DashboardDto(Guid.NewGuid(), "Proj", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
        var mcpReq = new McpRequest("2.0", "tools/list", null, "1");
        var mcpResp = new McpResponse("2.0", "1", new { ok = true }, null);

        Assert.Equal("N", createProject.Name);
        Assert.Equal(3, backlog.StoryPoints);
        Assert.Equal("S", sprint.Name);
        Assert.Equal(WorkItemStatus.Done, update.Status);
        Assert.Equal("review", review.Type);
        Assert.Equal("wiki", wiki.Title);
        Assert.Equal("cp", checkpoint.Name);
        Assert.Equal("a", run.AgentName);
        Assert.Equal("Proj", dashboard.ProjectName);
        Assert.Equal("tools/list", mcpReq.Method);
        Assert.Equal("1", mcpResp.Id);
    }

    [Fact]
    public void Enums_ShouldExposeExpectedValues()
    {
        Assert.Equal(0, (int)BacklogItemStatus.New);
        Assert.Equal(4, (int)BacklogItemStatus.Blocked);
        Assert.Equal(0, (int)WorkItemStatus.Todo);
        Assert.Equal(4, (int)WorkItemStatus.Blocked);
        Assert.Equal(0, (int)SprintStatus.Planned);
        Assert.Equal(2, (int)SprintStatus.Closed);
    }
}
