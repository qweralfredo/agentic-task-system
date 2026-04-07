# DuckDB JSON Processor - Pandora Integration Guide

This guide explains how to integrate DuckDB JSON processing into your Pandora Atomic Flow workflows and Todo List project.

## Quick Integration Checklist

- [ ] Install DuckDB dependencies
- [ ] Import utility classes/functions
- [ ] Set up JSON logging for MCP and Pandora API
- [ ] Configure DuckDB processor
- [ ] Create analysis pipelines
- [ ] Integrate results into Pandora work items
- [ ] Set up automated reports

## Installation

### Python Environment

```bash
pip install duckdb pandas numpy
```

### Node.js Environment

```bash
npm install @duckdb/wasm duckdb
```

### Backend (.NET/C#)

For .NET integration, consider using:
- DuckDB.NET bindings
- Or shell out to Python/Node.js DuckDB utilities

## Setup: Logging MCP and API Requests

### Option 1: Python Middleware

```python
# middleware/duckdb_logging.py
import json
from datetime import datetime
from typing import Any, Dict

class DuckDBLogger:
    def __init__(self, log_file: str = 'api_logs.jsonl'):
        self.log_file = log_file
    
    def log_request(self, method: str, uri: str, params: Dict[str, Any], duration_ms: int):
        """Log MCP or API request"""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': 'request',
            'method': method,
            'uri': uri,
            'params': params,
            'duration_ms': duration_ms
        }
        self._write_log(entry)
    
    def log_response(self, request_id: int, status: str, result: Dict[str, Any], duration_ms: int):
        """Log API response"""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': 'response',
            'request_id': request_id,
            'status': status,
            'result': result,
            'duration_ms': duration_ms
        }
        self._write_log(entry)
    
    def _write_log(self, entry: Dict[str, Any]):
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(entry) + '\n')

# Usage
logger = DuckDBLogger()

# In your API handler or MCP server
import time
start = time.time()
response = call_api(method, uri)
duration = int((time.time() - start) * 1000)
logger.log_response(request_id=123, status='success', result=response, duration_ms=duration)
```

### Option 2: Node.js Middleware

```javascript
// middleware/duckdb-logging.js
import fs from 'fs/promises';
import path from 'path';

class DuckDBLogger {
  constructor(logFile = 'api_logs.jsonl') {
    this.logFile = logFile;
  }

  async logRequest(method, uri, params, durationMs) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'request',
      method,
      uri,
      params,
      duration_ms: durationMs
    };
    await this._writeLog(entry);
  }

  async logResponse(requestId, status, result, durationMs) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'response',
      request_id: requestId,
      status,
      result,
      duration_ms: durationMs
    };
    await this._writeLog(entry);
  }

  async _writeLog(entry) {
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.logFile, line, 'utf-8');
  }
}

export default DuckDBLogger;

// Usage
const logger = new DuckDBLogger();
const startTime = performance.now();
const response = await callApi(method, uri);
const duration = Math.round(performance.now() - startTime);
await logger.logResponse(123, 'success', response, duration);
```

## Workflow: Pandora Atomic Flow Integration

### Step 1: Process MCP Request Logs

```python
from duckdb_utilities import DuckDBProcessor, MCPPayloadAnalyzer

# After running MCP operations
processor = DuckDBProcessor(memory_limit='4GB')
mcp_analyzer = MCPPayloadAnalyzer(processor)

# Analyze performance
performance = mcp_analyzer.analyze_method_performance('api_logs.jsonl')
print(performance)

# Find errors
errors = mcp_analyzer.find_errors('api_logs.jsonl')
print(f"Found {len(errors)} errors")

processor.close()
```

### Step 2: Process Pandora API Responses

```python
from duckdb_utilities import DuckDBProcessor, PandoraPayloadAnalyzer
import json

# Fetch all work items from Pandora
from mcp_pandora_client import PandoraClient

client = PandoraClient()
work_items = client.list_work_items(project_id='proj-001')

# Save to JSON for processing
with open('work_items.json', 'w') as f:
    for item in work_items:
        f.write(json.dumps(item) + '\n')

# Analyze
processor = DuckDBProcessor()
pandora_analyzer = PandoraPayloadAnalyzer(processor)

# Get sprint progress
progress = pandora_analyzer.analyze_sprint_progress('work_items.json')
print(progress)

# Calculate velocity
velocity = pandora_analyzer.calculate_velocity('work_items.json')
print(velocity)

# Identify blockers
blockers = pandora_analyzer.identify_blockers('work_items.json')
print(blockers)

processor.close()
```

### Step 3: Update Pandora Work Items with Analysis Results

```python
from mcp_pandora_client import PandoraClient
import duckdb

client = PandoraClient()
processor = duckdb.connect(':memory:')

# Query performance metrics
query = """
SELECT 
  COUNT(*) as total_requests,
  AVG(CAST(json_extract(data, '$.duration_ms') AS FLOAT)) as avg_duration,
  MAX(CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as max_duration
FROM read_json_auto('api_logs.jsonl')
WHERE json_extract(data, '$.type') = 'response'
"""

result = processor.execute(query).fetch_one()

# Update work item with analysis
work_item_id = 'work-123'
client.update_work_item(
    work_item_id=work_item_id,
    status='done',
    assignee='user@company.com',
    feedback=f"""
    Analysis complete:
    - Total requests processed: {result[0]}
    - Average response time: {result[1]:.2f}ms
    - Maximum response time: {result[2]}ms
    """,
    tokens_used=1500  # Actual token count from observability
)
```

### Step 4: Generate Reports and Export Data

```python
from duckdb_utilities import DuckDBProcessor, JSONExporter
import pandas as pd

processor = DuckDBProcessor()
pandora = PandoraPayloadAnalyzer(processor)

# Get velocity data
velocity_df = pandora.calculate_velocity('work_items.json')

# Export to CSV for dashboard
processor.export_csv(
    sql="SELECT * FROM velocity_metrics",
    filepath='velocity_report.csv'
)

# Export to JSON for archival
data = velocity_df.to_dict('records')
JSONExporter.save_json(data, 'velocity_report.json')

processor.close()
```

## Integration with Pandora Atomic Flow

### Workflow: Backlog → Sprint → Task → DuckDB Analysis

```
1. Create Backlog Item
   └─ backlog_add(title="Analyze API performance")
   
2. Create Sprint
   └─ sprint_create(goal="Establish performance monitoring")
   
3. Create Work Item
   └─ workitem_add(title="Run DuckDB analysis on MCP logs")
   
4. Execute Analysis (in_progress)
   ├─ Load MCP logs
   ├─ Query with DuckDB
   ├─ Export results
   └─ workitem_update(status="review")
   
5. Update Results
   └─ workitem_update(
       status="done",
       feedback="Generated performance report"
     )
   
6. Knowledge Checkpoint
   └─ knowledge_checkpoint(
       name="Analytics Checkpoint",
       decisions=["Use DuckDB for log analysis"],
       next_actions=["Set up automated weekly reports"]
     )
```

## Real-World Example: Monthly Performance Report

```python
import json
from duckdb_utilities import DuckDBProcessor, MCPPayloadAnalyzer, PandoraPayloadAnalyzer
from datetime import datetime, timedelta

# Configuration
MONTH_AGO = (datetime.now() - timedelta(days=30)).isoformat()
PROJECT_ID = 'proj-001'

# Initialize
processor = DuckDBProcessor()
mcp_analyzer = MCPPayloadAnalyzer(processor)
pandora_analyzer = PandoraPayloadAnalyzer(processor)

# 1. Analyze MCP request performance
print("=== MCP Performance ===")
mcp_perf = mcp_analyzer.analyze_method_performance('mcp_requests.jsonl')
print(mcp_perf)

# 2. Analyze Pandora work completion
print("\n=== Pandora Velocity ===")
velocity = pandora_analyzer.calculate_velocity('work_items.jsonl')
print(velocity)

# 3. Analyze agent token usage
print("\n=== Agent Performance ===")
agent_perf = pandora_analyzer.analyze_agent_performance('work_items.jsonl')
print(agent_perf)

# 4. Create report summary
report = {
    'generated_at': datetime.now().isoformat(),
    'period': f'{MONTH_AGO} to {datetime.now().isoformat()}',
    'mcp_metrics': mcp_perf.to_dict('records'),
    'velocity_metrics': velocity.to_dict('records'),
    'agent_metrics': agent_perf.to_dict('records')
}

# 5. Save report
with open(f'performance_report_{datetime.now().strftime("%Y%m%d")}.json', 'w') as f:
    json.dump(report, f, indent=2, default=str)

# 6. Update Pandora with summary
from mcp_pandora_client import PandoraClient
client = PandoraClient()

summary = f"""
## Performance Report - {datetime.now().strftime("%B %Y")}

### MCP Performance
- Average response time: {mcp_perf['avg_duration_ms'].mean():.2f}ms
- Slowest method: {mcp_perf.loc[mcp_perf['p95_duration_ms'].idxmax(), 'method']}

### Team Velocity
- Total story points completed: {velocity['velocity'].sum()}
- Days active: {len(velocity)}

### Agent Efficiency
- Top agent: {agent_perf.loc[agent_perf['total_tokens'].idxmin(), 'agent']}
- Total tokens used: {agent_perf['total_tokens'].sum()}
"""

client.create_documentation(
    project_id=PROJECT_ID,
    title='Monthly Performance Report',
    category='reports',
    content_markdown=summary,
    tags='report,analytics,monthly'
)

processor.close()
```

## Performance Optimization Tips

### 1. Batch Processing Large Files

```python
# Instead of loading entire file at once
def process_large_json_batches(filepath: str, batch_size: int = 10000):
    processor = DuckDBProcessor()
    conn = processor.conn
    
    conn.execute(f"""
    CREATE TABLE batched_data AS
    SELECT * FROM read_json_auto('{filepath}')
    """)
    
    offset = 0
    while True:
        batch = conn.execute(f"""
        SELECT * FROM batched_data
        LIMIT {batch_size} OFFSET {offset}
        """).fetch_all()
        
        if not batch:
            break
        
        # Process batch
        yield batch
        offset += batch_size
```

### 2. Use Indexes on Frequent Queries

```sql
-- Create index on commonly filtered JSON path
CREATE INDEX idx_method ON mcp_logs(json_extract(data, '$.method'));

-- Now queries using this path will be faster
SELECT COUNT(*) FROM mcp_logs
WHERE json_extract(data, '$.method') = 'resources/read';
```

### 3. Partition by Date

```python
import os
from datetime import datetime, timedelta

# Create daily log files instead of one large file
def log_daily_rotation(entry: dict, base_dir: str = 'logs'):
    today = datetime.now().strftime('%Y-%m-%d')
    log_file = os.path.join(base_dir, f'{today}_logs.jsonl')
    
    os.makedirs(base_dir, exist_ok=True)
    with open(log_file, 'a') as f:
        f.write(json.dumps(entry) + '\n')

# Query specific date range efficiently
processor = duckdb.connect(':memory:')
result = processor.execute("""
SELECT * FROM read_json_auto('logs/2024-04-01_logs.jsonl')
UNION ALL
SELECT * FROM read_json_auto('logs/2024-04-02_logs.jsonl')
""").fetch_all()
```

## Troubleshooting

### Issue: Out of Memory

**Solution**: Reduce `memory_limit` or process in smaller batches

```python
processor = DuckDBProcessor(memory_limit='2GB')  # Default is 4GB
```

### Issue: Slow Queries on Large Files

**Solution**: Create indexes or use partitioning

```sql
-- Pre-filter before aggregation
SELECT COUNT(*) FROM data
WHERE json_extract(data, '$.status') = 'done'
LIMIT 100000;  -- Process subset first
```

### Issue: JSON Parse Errors

**Solution**: Validate JSON format before loading

```python
import json

def validate_jsonl(filepath: str) -> bool:
    with open(filepath, 'r') as f:
        for i, line in enumerate(f, 1):
            try:
                json.loads(line)
            except json.JSONDecodeError as e:
                print(f"Error on line {i}: {e}")
                return False
    return True
```

## Next Steps

1. Set up logging middleware for your MCP server
2. Schedule daily DuckDB analysis runs
3. Create dashboards from exported CSV/Parquet files
4. Integrate insights into Pandora sprint planning
5. Document findings in project wiki

## References

- [DuckDB Documentation](https://duckdb.org/docs/)
- [JSON Functions](https://duckdb.org/docs/extensions/json)
- [Performance Tuning](https://duckdb.org/docs/guides/performance_tuning)
