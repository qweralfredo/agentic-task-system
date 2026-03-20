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

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(-32600, json.GetProperty("error").GetProperty("code").GetInt32());
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

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(-32601, json.GetProperty("error").GetProperty("code").GetInt32());
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

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(-32602, json.GetProperty("error").GetProperty("code").GetInt32());
    }

    [Fact]
    public async Task Mcp_UnknownPrompt_ShouldReturnBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "err-4",
            method = "prompts/get",
            @params = new
            {
                name = "prompt.not.exists",
                arguments = new { }
            }
        });

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(-32602, json.GetProperty("error").GetProperty("code").GetInt32());
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
        var content = json.GetProperty("result").GetProperty("content")[0].GetProperty("text").GetString();
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

    [Fact]
    public async Task Mcp_PromptsListAndGet_ShouldReturnOk()
    {
        var listResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "ok-4",
            method = "prompts/list"
        });

        listResponse.EnsureSuccessStatusCode();
        var listJson = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(listJson.GetProperty("result").GetProperty("prompts").GetArrayLength() >= 5);

        var getResponse = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "ok-5",
            method = "prompts/get",
            @params = new
            {
                name = "pandora.project.status",
                arguments = new { }
            }
        });

        getResponse.EnsureSuccessStatusCode();
        var getJson = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(getJson.GetProperty("result").GetProperty("messages").GetArrayLength() > 0);
    }

    [Fact]
    public async Task Mcp_Initialize_ShouldReturnCapabilities()
    {
        var response = await _client.PostAsJsonAsync("/mcp", new
        {
            jsonrpc = "2.0",
            id = "init-1",
            method = "initialize",
            @params = new
            {
                protocolVersion = "2025-03-26",
                capabilities = new { },
                clientInfo = new { name = "tests", version = "1.0.0" }
            }
        });

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("2025-03-26", json.GetProperty("result").GetProperty("protocolVersion").GetString());
        Assert.True(json.GetProperty("result").GetProperty("capabilities").TryGetProperty("prompts", out _));
    }

    [Fact]
    public async Task Mcp_Batch_ShouldReturnResponsesForRequestsOnly()
    {
        var payload = new object[]
        {
            new { jsonrpc = "2.0", id = "batch-1", method = "tools/list" },
            new { jsonrpc = "2.0", method = "initialized" },
            new { jsonrpc = "2.0", id = "batch-2", method = "prompts/list" }
        };

        var response = await _client.PostAsJsonAsync("/mcp", payload);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, json.ValueKind);
        Assert.Equal(2, json.GetArrayLength());
    }
}

