using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PandoraTodoList.Api.Contracts;
using PandoraTodoList.Api.Domain;

namespace PandoraTodoList.Api.Tests;

public class ApiEndpointsTests : IClassFixture<TestAppFactory>
{
    private readonly HttpClient _client;

    public ApiEndpointsTests(TestAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CorsPreflight_ShouldAllowFrontendOrigin()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/projects");
        request.Headers.Add("Origin", "http://localhost:53000");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:53000", origins!);
    }

    [Fact]
    public async Task ProjectFlow_ShouldCreateAndListProject()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto VSCode", "Fluxo agentico"));
        createResponse.EnsureSuccessStatusCode();

        var list = await _client.GetFromJsonAsync<List<JsonElement>>("/api/projects");
        Assert.NotNull(list);
        Assert.True(list!.Count > 0);
    }

    [Fact]
    public async Task BacklogAndSprintFlow_ShouldReturnDashboardData()
    {
        var project = await (await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto Scrum", "Descricao")))
            .Content.ReadFromJsonAsync<JsonElement>();

        var projectId = project.GetProperty("id").GetGuid();

        var backlog1Response = await _client.PostAsJsonAsync($"/api/projects/{projectId}/backlog", new AddBacklogItemRequest("Story 1", "Desc", 5, 1));
        backlog1Response.EnsureSuccessStatusCode();
        var backlog1 = await backlog1Response.Content.ReadFromJsonAsync<JsonElement>();

        var backlog2Response = await _client.PostAsJsonAsync($"/api/projects/{projectId}/backlog", new AddBacklogItemRequest("Story 2", "Desc", 3, 2));
        backlog2Response.EnsureSuccessStatusCode();
        var backlog2 = await backlog2Response.Content.ReadFromJsonAsync<JsonElement>();

        var sprintRequest = new
        {
            name = "Sprint 1",
            goal = "Entregar MVP",
            startDate = DateOnly.FromDateTime(DateTime.UtcNow),
            endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
            backlogItemIds = new[] { backlog1.GetProperty("id").GetGuid(), backlog2.GetProperty("id").GetGuid() }
        };

        var sprintResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/sprints", sprintRequest);
        sprintResponse.EnsureSuccessStatusCode();

        var dashboardResponse = await _client.GetAsync($"/api/projects/{projectId}/dashboard");
        dashboardResponse.EnsureSuccessStatusCode();

        var dashboard = await dashboardResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, dashboard.GetProperty("backlogTotal").GetInt32());
        Assert.Equal(1, dashboard.GetProperty("activeSprints").GetInt32());
    }

    [Fact]
    public async Task KnowledgeEndpoints_ShouldStoreKnowledgeArtifacts()
    {
        var project = await (await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto Knowledge", "Descricao")))
            .Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var wikiResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/wiki", new AddWikiPageRequest("Onboarding", "## Steps", "wiki,onboarding", "How-To"));
        wikiResponse.EnsureSuccessStatusCode();

        var checkpointResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/checkpoints", new AddCheckpointRequest("CP-1", "ctx", "dec", "risk", "next", "Release"));
        checkpointResponse.EnsureSuccessStatusCode();

        var docsResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/documentation", new AddDocumentationPageRequest("Arquitetura", "# ADR", "Arquitetura", "adr,design"));
        docsResponse.EnsureSuccessStatusCode();

        var runResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/agent-runs", new AddAgentRunLogRequest("vscode", "mcp", "in", "out", "success", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow));
        runResponse.EnsureSuccessStatusCode();

        var knowledgeResponse = await _client.GetAsync($"/api/projects/{projectId}/knowledge");
        knowledgeResponse.EnsureSuccessStatusCode();

        var knowledge = await knowledgeResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, knowledge.GetProperty("wikiPages").GetArrayLength());
        Assert.Equal("How-To", knowledge.GetProperty("wikiPages")[0].GetProperty("category").GetString());
        Assert.Equal(1, knowledge.GetProperty("checkpoints").GetArrayLength());
        Assert.Equal("Release", knowledge.GetProperty("checkpoints")[0].GetProperty("category").GetString());
        Assert.Equal(1, knowledge.GetProperty("documentationPages").GetArrayLength());
        Assert.Equal(1, knowledge.GetProperty("agentRuns").GetArrayLength());
    }

    [Fact]
    public async Task WorkItemStatusUpdates_ShouldAccumulateTokensAndExposeFeedbacks()
    {
        var project = await (await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto Tokens", "Descricao")))
            .Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var backlogResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/backlog", new AddBacklogItemRequest("Story Token", "Desc", 3, 1));
        backlogResponse.EnsureSuccessStatusCode();
        var backlog = await backlogResponse.Content.ReadFromJsonAsync<JsonElement>();

        var sprintResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/sprints", new
        {
            name = "Sprint Tokens",
            goal = "Validar tracking",
            startDate = DateOnly.FromDateTime(DateTime.UtcNow),
            endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            backlogItemIds = new[] { backlog.GetProperty("id").GetGuid() }
        });
        sprintResponse.EnsureSuccessStatusCode();

        var sprints = await _client.GetFromJsonAsync<JsonElement>($"/api/projects/{projectId}/sprints");
        var workItemId = sprints[0].GetProperty("workItems")[0].GetProperty("id").GetGuid();

        var update1 = await _client.PostAsJsonAsync(
            $"/api/work-items/{workItemId}/status",
            new UpdateWorkItemStatusRequest(WorkItemStatus.InProgress, "dev-agent", 100, "copilot", "GPT-5.3-Codex", "VS Code", "Implementacao iniciada", "{}"));
        update1.EnsureSuccessStatusCode();

        var update2 = await _client.PostAsJsonAsync(
            $"/api/work-items/{workItemId}/status",
            new UpdateWorkItemStatusRequest(WorkItemStatus.Review, "qa-agent", 50, "copilot", "GPT-5.3-Codex", "VS Code", "Pronto para revisao", "{}"));
        update2.EnsureSuccessStatusCode();

        var updatedSprints = await _client.GetFromJsonAsync<JsonElement>($"/api/projects/{projectId}/sprints");
        var workItem = updatedSprints[0].GetProperty("workItems")[0];

        Assert.Equal(150, workItem.GetProperty("totalTokensSpent").GetInt32());
        Assert.Equal("GPT-5.3-Codex", workItem.GetProperty("lastModelUsed").GetString());
        Assert.Equal("VS Code", workItem.GetProperty("lastIdeUsed").GetString());
        Assert.Equal(2, workItem.GetProperty("feedbacks").GetArrayLength());
        Assert.Equal(50, workItem.GetProperty("feedbacks")[0].GetProperty("tokensUsed").GetInt32());
    }

    [Fact]
    public async Task McpTools_ShouldListAndCall()
    {
        var listResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "1",
            method = "tools/list"
        });
        listResponse.EnsureSuccessStatusCode();

        var listJson = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(listJson.GetProperty("result").GetProperty("tools").GetArrayLength() >= 8);

        var callResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "2",
            method = "tools/call",
            @params = new
            {
                name = "project.create",
                arguments = new
                {
                    name = "Projeto via MCP",
                    description = "Criacao por ferramenta"
                }
            }
        });
        callResponse.EnsureSuccessStatusCode();

        var callJson = await callResponse.Content.ReadFromJsonAsync<JsonElement>();
        var content = callJson.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString();
        Assert.False(string.IsNullOrWhiteSpace(content));
    }

    [Fact]
    public async Task McpReadTools_ShouldListBacklogAndWorkItems()
    {
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto MCP Read", "Descricao"));
        projectResponse.EnsureSuccessStatusCode();
        var project = await projectResponse.Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var backlogResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/backlog", new AddBacklogItemRequest("Story Read", "Desc", 3, 1));
        backlogResponse.EnsureSuccessStatusCode();
        var backlog = await backlogResponse.Content.ReadFromJsonAsync<JsonElement>();

        var sprintRequest = new
        {
            name = "Sprint Read",
            goal = "Validar listagem MCP",
            startDate = DateOnly.FromDateTime(DateTime.UtcNow),
            endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            backlogItemIds = new[] { backlog.GetProperty("id").GetGuid() }
        };

        var sprintResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/sprints", sprintRequest);
        sprintResponse.EnsureSuccessStatusCode();
        var sprint = await sprintResponse.Content.ReadFromJsonAsync<JsonElement>();
        var sprintId = sprint.GetProperty("id").GetGuid();

        var backlogListResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "read-1",
            method = "tools/call",
            @params = new
            {
                name = "backlog.list",
                arguments = new { projectId = projectId.ToString() }
            }
        });

        backlogListResponse.EnsureSuccessStatusCode();
        var backlogListJson = await backlogListResponse.Content.ReadFromJsonAsync<JsonElement>();
        var backlogListContent = backlogListJson.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString() ?? "[]";
        Assert.Contains("Story Read", backlogListContent, StringComparison.Ordinal);

        var workItemListResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "read-2",
            method = "tools/call",
            @params = new
            {
                name = "workitem.list",
                arguments = new { projectId = projectId.ToString(), sprintId = sprintId.ToString() }
            }
        });

        workItemListResponse.EnsureSuccessStatusCode();
        var workItemListJson = await workItemListResponse.Content.ReadFromJsonAsync<JsonElement>();
        var workItemListContent = workItemListJson.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString() ?? "[]";
        Assert.Contains("Story Read", workItemListContent, StringComparison.Ordinal);
        Assert.Contains("TotalTokensSpent", workItemListContent, StringComparison.Ordinal);
    }

    [Fact]
    public async Task McpWorkItemUpdateTool_ShouldTrackTokensAndMetadata()
    {
        var projectResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto MCP Token", "Desc"));
        projectResponse.EnsureSuccessStatusCode();
        var project = await projectResponse.Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var backlogResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/backlog", new AddBacklogItemRequest("Story MCP", "Desc", 5, 1));
        backlogResponse.EnsureSuccessStatusCode();
        var backlog = await backlogResponse.Content.ReadFromJsonAsync<JsonElement>();

        var sprintResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/sprints", new
        {
            name = "Sprint MCP",
            goal = "Track token",
            startDate = DateOnly.FromDateTime(DateTime.UtcNow),
            endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
            backlogItemIds = new[] { backlog.GetProperty("id").GetGuid() }
        });
        sprintResponse.EnsureSuccessStatusCode();

        var sprints = await _client.GetFromJsonAsync<JsonElement>($"/api/projects/{projectId}/sprints");
        var workItemId = sprints[0].GetProperty("workItems")[0].GetProperty("id").GetGuid();

        var updateResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "mcp-update-1",
            method = "tools/call",
            @params = new
            {
                name = "workitem.update",
                arguments = new
                {
                    workItemId = workItemId.ToString(),
                    status = (int)WorkItemStatus.InProgress,
                    assignee = "copilot-agent",
                    tokensUsed = 210,
                    agentName = "copilot",
                    modelUsed = "GPT-5.3-Codex",
                    ideUsed = "VS Code",
                    feedback = "Atualizacao MCP",
                    metadataJson = "{\"source\":\"mcp\"}"
                }
            }
        });
        updateResponse.EnsureSuccessStatusCode();

        var workItemListResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "mcp-update-2",
            method = "tools/call",
            @params = new
            {
                name = "workitem.list",
                arguments = new { projectId = projectId.ToString() }
            }
        });
        workItemListResponse.EnsureSuccessStatusCode();

        var workItemListJson = await workItemListResponse.Content.ReadFromJsonAsync<JsonElement>();
        var content = workItemListJson.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString() ?? "[]";

        Assert.Contains("GPT-5.3-Codex", content, StringComparison.Ordinal);
        Assert.Contains("VS Code", content, StringComparison.Ordinal);
        Assert.Contains("\"TokensUsed\":210", content, StringComparison.Ordinal);
    }

    [Fact]
    public async Task McpProjectDelete_ShouldArchiveProjectAndHideFromDefaultList()
    {
        var createResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "archive-1",
            method = "tools/call",
            @params = new
            {
                name = "project.create",
                arguments = new { name = "Projeto Archive", description = "Soft delete" }
            }
        });
        createResponse.EnsureSuccessStatusCode();

        var createdJson = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var createdProject = createdJson.GetProperty("result").GetProperty("structuredContent");
        var projectId = createdProject.GetProperty("id").GetGuid();

        var deleteResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "archive-2",
            method = "tools/call",
            @params = new
            {
                name = "project.delete",
                arguments = new { projectId = projectId.ToString() }
            }
        });
        deleteResponse.EnsureSuccessStatusCode();

        var defaultListResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "archive-3",
            method = "tools/call",
            @params = new
            {
                name = "project.list",
                arguments = new { }
            }
        });
        defaultListResponse.EnsureSuccessStatusCode();

        var defaultListJson = await defaultListResponse.Content.ReadFromJsonAsync<JsonElement>();
        var defaultListContent = defaultListJson.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString() ?? "[]";
        Assert.DoesNotContain(projectId.ToString(), defaultListContent, StringComparison.OrdinalIgnoreCase);

        var allListResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "archive-4",
            method = "tools/call",
            @params = new
            {
                name = "project.list",
                arguments = new { includeArchived = true }
            }
        });
        allListResponse.EnsureSuccessStatusCode();

        var allListJson = await allListResponse.Content.ReadFromJsonAsync<JsonElement>();
        var allListContent = allListJson.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString() ?? "[]";
        Assert.Contains(projectId.ToString(), allListContent, StringComparison.OrdinalIgnoreCase);
    }
}

