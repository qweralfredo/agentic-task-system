# DuckDB Advanced Examples

## Real-World Use Cases for Pandora + MCP Integration

### 1. Processing Pandora API Work Item Payloads

```python
import duckdb
import json
from datetime import datetime

def analyze_work_items(json_file: str):
    """Analyze work item status distribution and metrics"""
    conn = duckdb.connect(':memory:')
    
    query = """
    SELECT 
        json_extract(item, '$.status') as status,
        json_extract(item, '$.priority') as priority,
        CAST(json_extract(item, '$.story_points') AS INTEGER) as story_points,
        COUNT(*) as count,
        AVG(CAST(json_extract(item, '$.story_points') AS FLOAT)) as avg_points,
        SUM(CAST(json_extract(item, '$.story_points') AS INTEGER)) as total_points
    FROM read_json_auto(?)
    WHERE json_extract(item, '$.status') IS NOT NULL
    GROUP BY status, priority, story_points
    ORDER BY status, priority DESC
    """
    
    result = conn.execute(query, [json_file]).fetch_all()
    return result
```

### 2. Correlating MCP Requests with Pandora Updates

```sql
WITH mcp_requests AS (
  SELECT 
    json_extract(req, '$.timestamp') as req_time,
    json_extract(req, '$.method') as mcp_method,
    json_extract(req, '$.uri') as endpoint,
    CAST(json_extract(req, '$.duration_ms') AS INTEGER) as latency,
    json_extract(req, '$.params.work_item_id') as work_item_id
  FROM read_json_auto('mcp_logs.json')
),
pandora_updates AS (
  SELECT 
    json_extract(upd, '$.timestamp') as update_time,
    json_extract(upd, '$.work_item_id') as item_id,
    json_extract(upd, '$.status') as new_status,
    CAST(json_extract(upd, '$.tokens_used') AS INTEGER) as tokens
  FROM read_json_auto('pandora_updates.json')
)
SELECT 
  mcp_requests.work_item_id,
  mcp_requests.mcp_method,
  mcp_requests.latency,
  pandora_updates.new_status,
  pandora_updates.tokens,
  EXTRACT(EPOCH FROM (pandora_updates.update_time - mcp_requests.req_time)) as sync_delay_sec
FROM mcp_requests
INNER JOIN pandora_updates 
  ON mcp_requests.work_item_id = pandora_updates.item_id
WHERE abs(EXTRACT(EPOCH FROM (pandora_updates.update_time - mcp_requests.req_time))) < 60
ORDER BY sync_delay_sec DESC;
```

### 3. Performance Analysis: Response Time Distribution

```python
def analyze_response_times(json_file: str):
    """Percentile analysis of API response times"""
    conn = duckdb.connect(':memory:')
    
    query = """
    WITH response_times AS (
      SELECT 
        json_extract(resp, '$.endpoint') as endpoint,
        CAST(json_extract(resp, '$.duration_ms') AS INTEGER) as duration_ms
      FROM read_json_auto(?)
    )
    SELECT 
        endpoint,
        COUNT(*) as request_count,
        MIN(duration_ms) as min_ms,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) as p50_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_ms,
        MAX(duration_ms) as max_ms,
        STDDEV(duration_ms) as stddev_ms
    FROM response_times
    GROUP BY endpoint
    ORDER BY p95_ms DESC
    """
    
    df = conn.execute(query, [json_file]).fetch_df()
    return df
```

### 4. Nested Array Processing: Sprint Tasks

```sql
-- Extract all tasks from a sprint payload containing nested arrays
SELECT 
  json_extract(sprint, '$.id') as sprint_id,
  json_extract(sprint, '$.name') as sprint_name,
  json_extract(task, '$.id') as task_id,
  json_extract(task, '$.title') as task_title,
  json_extract(task, '$.assignee') as assignee,
  json_extract(task, '$.status') as status,
  CAST(json_extract(task, '$.estimated_hours') AS FLOAT) as hours
FROM read_json_auto('sprints.json') sprint,
  json_array_elements(json_extract(sprint, '$.tasks')) task
WHERE json_extract(sprint, '$.status') = 'active'
ORDER BY sprint_id, task_id;
```

### 5. Error Rate and Recovery Analysis

```sql
-- Identify error patterns and recovery times
WITH error_events AS (
  SELECT 
    json_extract(event, '$.timestamp')::TIMESTAMP as ts,
    json_extract(event, '$.work_item_id') as item_id,
    json_extract(event, '$.error_code') as error_code,
    json_extract(event, '$.error_message') as error_msg
  FROM read_json_auto('error_logs.json')
  WHERE json_extract(event, '$.error_code') IS NOT NULL
),
recovery_events AS (
  SELECT 
    json_extract(event, '$.timestamp')::TIMESTAMP as ts,
    json_extract(event, '$.work_item_id') as item_id,
    'success' as event_type
  FROM read_json_auto('success_logs.json')
  WHERE json_extract(event, '$.status') = 'completed'
)
SELECT 
  e.item_id,
  e.error_code,
  e.error_msg,
  e.ts as error_time,
  r.ts as recovery_time,
  EXTRACT(EPOCH FROM (r.ts - e.ts)) as recovery_seconds,
  CASE 
    WHEN EXTRACT(EPOCH FROM (r.ts - e.ts)) < 60 THEN 'fast'
    WHEN EXTRACT(EPOCH FROM (r.ts - e.ts)) < 300 THEN 'medium'
    ELSE 'slow'
  END as recovery_speed
FROM error_events e
LEFT JOIN recovery_events r 
  ON e.item_id = r.item_id AND r.ts > e.ts
ORDER BY recovery_seconds DESC NULLS LAST;
```

### 6. Batch Processing: Large Payload Streaming

```python
def stream_process_large_json(json_file: str, batch_size: int = 10000):
    """Process large JSON files in batches"""
    conn = duckdb.connect(':memory:')
    
    # Create table with streaming results
    conn.execute(f"""
    CREATE TABLE processed_data AS
    SELECT 
        json_extract(item, '$.id') as id,
        json_extract(item, '$.name') as name,
        json_extract(item, '$.priority') as priority,
        CAST(json_extract(item, '$.value') AS FLOAT) as value
    FROM read_json_auto('{json_file}')
    WHERE json_extract(item, '$.id') IS NOT NULL
    """)
    
    # Process in batches
    offset = 0
    while True:
        batch = conn.execute(f"""
        SELECT * FROM processed_data
        LIMIT {batch_size} OFFSET {offset}
        """).fetch_all()
        
        if not batch:
            break
            
        # Process batch
        yield batch
        offset += batch_size
```

### 7. Aggregation: Token Usage Analysis

```sql
-- Analyze token usage across work items and agents
SELECT 
  json_extract(log, '$.agent_name') as agent,
  json_extract(log, '$.model_used') as model,
  DATE(CAST(json_extract(log, '$.timestamp') AS TIMESTAMP)) as date,
  COUNT(*) as execution_count,
  SUM(CAST(json_extract(log, '$.tokens_used') AS INTEGER)) as total_tokens,
  AVG(CAST(json_extract(log, '$.tokens_used') AS FLOAT)) as avg_tokens,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(log, '$.tokens_used') AS INTEGER)) as p95_tokens
FROM read_json_auto('token_logs.json')
GROUP BY agent, model, DATE(CAST(json_extract(log, '$.timestamp') AS TIMESTAMP))
ORDER BY date DESC, total_tokens DESC;
```

### 8. Complex Transformation: Flatten Nested Metadata

```python
def flatten_nested_payload(json_file: str):
    """Convert nested JSON to flat structure for CSV export"""
    conn = duckdb.connect(':memory:')
    
    query = """
    SELECT 
        json_extract(payload, '$.id') as id,
        json_extract(payload, '$.name') as name,
        json_extract(payload, '$.metadata.created_at') as created_at,
        json_extract(payload, '$.metadata.owner.id') as owner_id,
        json_extract(payload, '$.metadata.owner.name') as owner_name,
        json_extract(payload, '$.metadata.tags[0]') as primary_tag,
        json_array_length(json_extract(payload, '$.metadata.tags')) as tag_count,
        json_typeof(json_extract(payload, '$.metadata.attributes')) as has_attributes
    FROM read_json_auto(?)
    WHERE json_extract(payload, '$.status') = 'active'
    """
    
    df = conn.execute(query, [json_file]).fetch_df()
    
    # Export to CSV
    conn.execute("COPY (SELECT * FROM df) TO 'flattened_output.csv' WITH (FORMAT CSV, HEADER TRUE)")
    
    return df
```

## Tips for Large-Scale Processing

1. **Memory Management**: Use streaming for files > 1GB
2. **Indexing**: Create indexes on frequently filtered JSON paths
3. **Partitioning**: Split by date or category before loading
4. **Caching**: Store intermediate results as Parquet for reuse
5. **Parallel Processing**: Load multiple JSON files in parallel queries
