using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PandoraTodoList.Api.Contracts;

namespace PandoraTodoList.Api.Tests;

public class McpErrorPathsTests : IClassFixture<TestAppFactory>
{
    private readonly HttpClient _client;

    public McpErrorPathsTests(TestAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Mcp_InvalidJsonRpcVersion_ShouldReturnBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "1.0",
            id = "err-1",
            method = "tools/list"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Mcp_InvalidMethod_ShouldReturnBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "err-2",
            method = "unknown.method"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Mcp_UnknownTool_ShouldReturnBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "err-3",
            method = "tools/call",
            @params = new
            {
                name = "tool.not.exists",
                arguments = new { }
            }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Mcp_ProjectListTool_ShouldReturnContent()
    {
        await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("MCP Project", "Desc"));

        var response = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "ok-1",
            method = "tools/call",
            @params = new
            {
                name = "project.list",
                arguments = new { }
            }
        });

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var content = json.GetProperty("result").GetProperty("content").GetString();
        Assert.False(string.IsNullOrWhiteSpace(content));
    }

    [Fact]
    public async Task Mcp_BacklogAndCheckpointTools_ShouldReturnOk()
    {
        var project = await (await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("MCP P2", "Desc")))
            .Content.ReadFromJsonAsync<JsonElement>();

        var projectId = project.GetProperty("id").GetGuid();

        var backlogResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "ok-2",
            method = "tools/call",
            @params = new
            {
                name = "backlog.add",
                arguments = new
                {
                    projectId = projectId.ToString(),
                    title = "Story MCP",
                    description = "Desc",
                    storyPoints = 8,
                    priority = 1
                }
            }
        });

        var checkpointResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "ok-3",
            method = "tools/call",
            @params = new
            {
                name = "knowledge.checkpoint",
                arguments = new
                {
                    projectId = projectId.ToString(),
                    name = "CP-MCP",
                    contextSnapshot = "ctx",
                    decisions = "dec",
                    risks = "risk",
                    nextActions = "next"
                }
            }
        });

        Assert.Equal(HttpStatusCode.OK, backlogResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, checkpointResponse.StatusCode);
    }
}

