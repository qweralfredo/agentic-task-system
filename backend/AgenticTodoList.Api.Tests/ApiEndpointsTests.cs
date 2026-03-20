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
        request.Headers.Add("Origin", "http://localhost:8400");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:8400", origins!);
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
    public async Task ProjectDelete_ShouldArchiveAndSupportIncludeArchivedFlag()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto Archive", "Soft delete"));
        createResponse.EnsureSuccessStatusCode();
        var project = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var deleteResponse = await _client.DeleteAsync($"/api/projects/{projectId}");
        deleteResponse.EnsureSuccessStatusCode();

        var activeProjects = await _client.GetFromJsonAsync<List<JsonElement>>("/api/projects");
        Assert.NotNull(activeProjects);
        Assert.DoesNotContain(activeProjects!, p => p.GetProperty("id").GetGuid() == projectId);

        var allProjects = await _client.GetFromJsonAsync<List<JsonElement>>("/api/projects?includeArchived=true");
        Assert.NotNull(allProjects);
        Assert.Contains(allProjects!, p => p.GetProperty("id").GetGuid() == projectId);
    }

    [Fact]
    public async Task ProjectConfig_CreateWithConfig_ShouldPersistConfigFields()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest(
            "Projeto Config",
            "Teste de configuracoes",
            GitHubUrl: "https://github.com/qweralfredo/todolist",
            LocalPath: "c:/projetos/todolist",
            TechStack: ".NET 10, React, PostgreSQL",
            MainBranch: "main"));
        createResponse.EnsureSuccessStatusCode();

        var project = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var list = await _client.GetFromJsonAsync<List<JsonElement>>("/api/projects");
        var found = list!.First(p => p.GetProperty("id").GetGuid() == projectId);

        Assert.Equal("https://github.com/qweralfredo/todolist", found.GetProperty("gitHubUrl").GetString());
        Assert.Equal("c:/projetos/todolist", found.GetProperty("localPath").GetString());
        Assert.Equal(".NET 10, React, PostgreSQL", found.GetProperty("techStack").GetString());
        Assert.Equal("main", found.GetProperty("mainBranch").GetString());
    }

    [Fact]
    public async Task ProjectConfig_PatchConfig_ShouldUpdateConfigFields()
    {
        var project = await (await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Projeto Patch Config", "Desc")))
            .Content.ReadFromJsonAsync<JsonElement>();
        var projectId = project.GetProperty("id").GetGuid();

        var patchResponse = await _client.PatchAsJsonAsync(
            $"/api/projects/{projectId}/config",
            new UpdateProjectConfigRequest(
                GitHubUrl: "https://github.com/org/repo",
                LocalPath: "c:/projetos/repo",
                TechStack: "Python, FastAPI",
                MainBranch: "develop"));
        patchResponse.EnsureSuccessStatusCode();

        var list = await _client.GetFromJsonAsync<List<JsonElement>>("/api/projects");
        var updated = list!.First(p => p.GetProperty("id").GetGuid() == projectId);

        Assert.Equal("https://github.com/org/repo", updated.GetProperty("gitHubUrl").GetString());
        Assert.Equal("c:/projetos/repo", updated.GetProperty("localPath").GetString());
        Assert.Equal("Python, FastAPI", updated.GetProperty("techStack").GetString());
        Assert.Equal("develop", updated.GetProperty("mainBranch").GetString());
    }

    [Fact]
    public async Task ProjectConfig_PatchConfigOnUnknownProject_ShouldReturn404()
    {
        var response = await _client.PatchAsJsonAsync(
            $"/api/projects/{Guid.NewGuid()}/config",
            new UpdateProjectConfigRequest("https://github.com/x", null, null, null));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

}

