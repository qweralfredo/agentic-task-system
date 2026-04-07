# MCP Payload Schema Reference

This document describes the typical structure of MCP (Model Context Protocol) request and response payloads that can be processed with DuckDB.

## Standard MCP Request Structure

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/read",
  "params": {
    "uri": "file:///path/to/resource",
    "range": {
      "start": {"line": 0, "character": 0},
      "end": {"line": 100, "character": 0}
    }
  },
  "timestamp": "2024-04-04T10:30:00Z",
  "duration_ms": 45
}
```

### Request Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `jsonrpc` | string | Protocol version (always "2.0") |
| `id` | integer | Unique request identifier |
| `method` | string | RPC method name |
| `params` | object | Method-specific parameters |
| `timestamp` | string | ISO 8601 request timestamp |
| `duration_ms` | integer | Processing time in milliseconds |

## Common MCP Methods

### 1. resources/read
```json
{
  "method": "resources/read",
  "params": {
    "uri": "file:///project/src/main.ts",
    "range": {
      "start": {"line": 10, "character": 0},
      "end": {"line": 20, "character": 80}
    }
  }
}
```

### 2. tools/list
```json
{
  "method": "tools/list",
  "params": {
    "filter": "code_generation"
  }
}
```

### 3. prompts/get
```json
{
  "method": "prompts/get",
  "params": {
    "name": "code_review",
    "arguments": {
      "file_path": "src/handler.ts",
      "language": "typescript"
    }
  }
}
```

### 4. tools/call
```json
{
  "method": "tools/call",
  "params": {
    "name": "git_commit",
    "arguments": {
      "message": "feat: add json processor",
      "files": ["src/processor.ts", "tests/processor.test.ts"]
    }
  }
}
```

## Standard MCP Response Structure

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "success",
    "data": {
      "content": "...resource content...",
      "mimeType": "text/plain",
      "size": 1024
    },
    "metadata": {
      "cached": false,
      "source": "local"
    }
  },
  "timestamp": "2024-04-04T10:30:00.045Z"
}
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `jsonrpc` | string | Protocol version |
| `id` | integer | Matches request ID |
| `result` | object | Success result data |
| `error` | object | Error details (if failed) |
| `timestamp` | string | ISO 8601 response timestamp |

## Error Response Structure

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": {
      "details": "The method 'invalid_method' is not recognized"
    }
  }
}
```

### Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Malformed request |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Parameters don't match method |
| -32603 | Internal error | Server error |
| -32000 to -32099 | Server error | Custom error |

## Batch Request/Response

```json
[
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {"uri": "file:///file1.ts"}
  },
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {"uri": "file:///file2.ts"}
  }
]
```

## Sample DuckDB Queries for MCP Payloads

### Query 1: Analyze Method Performance
```sql
SELECT 
  json_extract(payload, '$.method') as method,
  COUNT(*) as request_count,
  AVG(CAST(json_extract(payload, '$.duration_ms') AS FLOAT)) as avg_duration_ms,
  MAX(CAST(json_extract(payload, '$.duration_ms') AS INTEGER)) as max_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(payload, '$.duration_ms') AS INTEGER)) as p95_duration_ms
FROM read_json_auto('mcp_requests.json')
GROUP BY method
ORDER BY avg_duration_ms DESC;
```

### Query 2: Find Slow Requests
```sql
SELECT 
  json_extract(payload, '$.id') as request_id,
  json_extract(payload, '$.method') as method,
  json_extract(payload, '$.timestamp') as timestamp,
  CAST(json_extract(payload, '$.duration_ms') AS INTEGER) as duration_ms,
  json_extract(payload, '$.params.uri') as uri
FROM read_json_auto('mcp_requests.json')
WHERE CAST(json_extract(payload, '$.duration_ms') AS INTEGER) > 1000
ORDER BY duration_ms DESC
LIMIT 100;
```

### Query 3: Error Analysis
```sql
SELECT 
  json_extract(response, '$.error.code') as error_code,
  json_extract(response, '$.error.message') as error_message,
  json_extract(request, '$.method') as method_called,
  COUNT(*) as error_count
FROM read_json_auto('mcp_responses.json') response
JOIN read_json_auto('mcp_requests.json') request
  ON json_extract(response, '$.id') = json_extract(request, '$.id')
WHERE json_extract(response, '$.error') IS NOT NULL
GROUP BY error_code, error_message, method_called
ORDER BY error_count DESC;
```

### Query 4: Request/Response Correlation
```sql
SELECT 
  json_extract(req, '$.id') as request_id,
  json_extract(req, '$.method') as method,
  json_extract(req, '$.timestamp') as request_time,
  json_extract(resp, '$.timestamp') as response_time,
  EXTRACT(EPOCH FROM (CAST(json_extract(resp, '$.timestamp') AS TIMESTAMP) - CAST(json_extract(req, '$.timestamp') AS TIMESTAMP))) as latency_sec,
  json_extract(resp, '$.result.status') as result_status
FROM read_json_auto('mcp_requests.json') req
LEFT JOIN read_json_auto('mcp_responses.json') resp
  ON json_extract(req, '$.id') = json_extract(resp, '$.id');
```

## Tool-Specific Payload Examples

### Git Command Tools
```json
{
  "method": "tools/call",
  "params": {
    "name": "git_status",
    "arguments": {
      "path": "/project"
    }
  },
  "result": {
    "stdout": "On branch main\nYour branch is up to date...",
    "stderr": "",
    "exit_code": 0
  }
}
```

### File Operation Tools
```json
{
  "method": "tools/call",
  "params": {
    "name": "file_read",
    "arguments": {
      "path": "/project/src/handler.ts"
    }
  },
  "result": {
    "content": "export async function handler() { ... }",
    "size": 2048,
    "encoding": "utf-8"
  }
}
```

### Code Analysis Tools
```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_code",
    "arguments": {
      "file_path": "src/processor.ts",
      "analysis_type": "complexity"
    }
  },
  "result": {
    "complexity_score": 8.5,
    "issues": [
      {"line": 45, "type": "complexity", "message": "Function too complex"}
    ]
  }
}
```

## Nested Parameter Structures

### File Range Notation
```json
{
  "range": {
    "start": {"line": 10, "character": 0},
    "end": {"line": 20, "character": 80}
  }
}
```

### Selection/Highlight Notation
```json
{
  "selection": {
    "start": {"line": 5, "character": 10},
    "end": {"line": 5, "character": 20}
  }
}
```

### Environment Context
```json
{
  "context": {
    "workspace_path": "/home/user/project",
    "active_file": "src/main.ts",
    "selected_text": "function handler() {}",
    "git_branch": "feature/new-handler"
  }
}
```
