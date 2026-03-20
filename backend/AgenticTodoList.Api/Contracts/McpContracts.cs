using System.Text.Json;

namespace PandoraTodoList.Api.Contracts;

public sealed record McpRequest(string Jsonrpc, string Method, JsonElement? Params, JsonElement? Id);
public sealed record McpResponse(string Jsonrpc, JsonElement? Id, object? Result = null, McpError? Error = null);
public sealed record McpError(int Code, string Message);

