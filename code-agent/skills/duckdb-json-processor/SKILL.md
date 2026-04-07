---
name: duckdb-json-processor
description: Process, analyze, and transform JSON payloads from MCP and Pandora API using DuckDB. Enables SQL-based queries, aggregations, and transformations on structured request/response data.
---

# DuckDB JSON Processor

A powerful skill for processing, analyzing, and transforming JSON payloads from MCP (Model Context Protocol) requests and Pandora API responses using DuckDB's SQL capabilities.

## Overview

DuckDB provides fast, in-memory SQL processing of JSON data without requiring server setup. Use this skill when you need to:

- **Extract and filter** nested JSON structures from API payloads
- **Aggregate** request/response metrics and statistics
- **Transform** payloads for storage or downstream processing
- **Analyze** MCP request patterns and performance metrics
- **Join** multiple API responses for correlation analysis
- **Export** processed data to CSV, Parquet, or other formats

## Quick Start

### Python Implementation

```python
import duckdb
import json

# Read JSON payload
payload = json.loads(request_body)

# Query with SQL
conn = duckdb.connect(':memory:')
result = conn.execute(f"""
  SELECT 
    method,
    path,
    status_code,
    response_time_ms,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time
  FROM read_json_auto('payload.json')
  WHERE status_code >= 400
  GROUP BY method, path, status_code
  ORDER BY avg_response_time DESC
""").fetch_df()

print(result)
```

### JavaScript/Node.js Implementation

```javascript
import duckdb from '@duckdb/wasm';

const payload = JSON.stringify(apiResponse);
const db = new duckdb.Database();
const conn = db.connect();

const result = conn.query(`
  SELECT 
    json_extract(data, '$.status') as status,
    json_extract(data, '$.timestamp') as timestamp,
    COUNT(*) as events
  FROM read_json_auto('data.json')
  GROUP BY status, timestamp
`);

console.log(result.toArray());
```

## Common Patterns

### 1. Extract Nested Fields from MCP Payloads

```sql
SELECT 
  json_extract(payload, '$.request.method') as method,
  json_extract(payload, '$.request.uri') as uri,
  json_extract(payload, '$.response.status') as status,
  json_extract(payload, '$.response.body') as body
FROM read_json_auto('mcp_requests.json')
WHERE json_extract(payload, '$.response.status') >= 400;
```

### 2. Analyze Pandora API Response Times

```sql
SELECT 
  json_extract(response, '$.endpoint') as endpoint,
  json_extract(response, '$.method') as http_method,
  CAST(json_extract(response, '$.duration_ms') AS INTEGER) as duration_ms,
  COUNT(*) as request_count,
  AVG(CAST(json_extract(response, '$.duration_ms') AS FLOAT)) as avg_duration,
  MAX(CAST(json_extract(response, '$.duration_ms') AS FLOAT)) as max_duration
FROM read_json_auto('api_responses.json')
GROUP BY endpoint, http_method
ORDER BY avg_duration DESC;
```

### 3. Flatten and Transform Nested Structures

```sql
SELECT 
  json_extract(record, '$.id') as id,
  json_extract(record, '$.name') as name,
  json_extract(record, '$.tags[0]') as primary_tag,
  json_array_length(json_extract(record, '$.tags')) as tag_count,
  json_typeof(json_extract(record, '$.metadata')) as metadata_type
FROM read_json_auto('records.json');
```

### 4. Aggregate Errors and Performance Metrics

```sql
WITH error_summary AS (
  SELECT 
    json_extract(event, '$.error_code') as error_code,
    json_extract(event, '$.error_message') as error_message,
    COUNT(*) as occurrence_count,
    MAX(CAST(json_extract(event, '$.timestamp') AS TIMESTAMP)) as last_seen
  FROM read_json_auto('error_logs.json')
  GROUP BY error_code, error_message
)
SELECT 
  error_code,
  error_message,
  occurrence_count,
  last_seen,
  ROUND(100.0 * occurrence_count / SUM(occurrence_count) OVER (), 2) as percentage
FROM error_summary
ORDER BY occurrence_count DESC;
```

## Integration with Pandora Atomic Flow

### Workflow: Processing MCP Request Logs

1. **Capture**: Store MCP request/response payloads to JSON files
2. **Process**: Query payloads using DuckDB SQL patterns above
3. **Analyze**: Generate statistics and identify bottlenecks
4. **Report**: Export results to CSV for dashboard visualization
5. **Update**: Use insights to update `workitem_update` with performance metrics

### Example: Task Tracking with DuckDB

```python
# Load API request logs
logs = conn.execute("""
  SELECT 
    json_extract(log, '$.work_item_id') as work_item_id,
    json_extract(log, '$.status') as status,
    json_extract(log, '$.duration_ms') as duration,
    json_extract(log, '$.timestamp') as timestamp
  FROM read_json_auto('work_item_logs.json')
  WHERE json_extract(log, '$.status') IN ('todo', 'in_progress', 'done')
""").fetch_df()

# Use for workitem_update tracking
for _, row in logs.iterrows():
    # Update work item in Pandora
    update_work_item(
        work_item_id=row['work_item_id'],
        status=row['status'],
        tokens_used=int(row['duration'])
    )
```

## Output Formats

DuckDB supports multiple output formats for processed data:

### Export to CSV
```python
conn.execute("COPY result_query TO 'output.csv' WITH (FORMAT CSV, HEADER TRUE)")
```

### Export to Parquet
```python
conn.execute("COPY result_query TO 'output.parquet' WITH (FORMAT PARQUET)")
```

### Export to JSON
```python
conn.execute("COPY result_query TO 'output.json' WITH (FORMAT JSON)")
```

### In-Memory DataFrame
```python
df = conn.execute("SELECT * FROM result_query").fetch_df()
```

## Performance Tips

1. **Use JSON indexes** for frequently queried fields:
   ```sql
   CREATE INDEX idx_status ON payloads(json_extract(data, '$.status'));
   ```

2. **Pre-filter before aggregation** to reduce memory usage
3. **Use `DISTINCT`** on large result sets
4. **Partition queries** by time windows for large datasets
5. **Cache compiled queries** when processing similar payloads repeatedly

## Dependencies

### Python
```bash
pip install duckdb pandas numpy
```

### Node.js
```bash
npm install @duckdb/wasm
```

### Backend (C#/.NET)
- Consider using DuckDB.NET or equivalent bindings for .NET integration

## References

See [references/duckdb_examples.md](references/duckdb_examples.md) for advanced patterns and real-world examples.
See [references/mcp_payload_schema.md](references/mcp_payload_schema.md) for typical MCP request/response structures.
See [references/pandora_api_schema.md](references/pandora_api_schema.md) for Pandora API response formats.
