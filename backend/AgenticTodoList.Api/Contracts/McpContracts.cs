using System.Text.Json;

namespace AgenticTodoList.Api.Contracts;

public record McpRequest(string Jsonrpc, string Method, JsonElement? Params, string Id);
public record McpResponse(string Jsonrpc, string Id, object? Result = null, object? Error = null);
