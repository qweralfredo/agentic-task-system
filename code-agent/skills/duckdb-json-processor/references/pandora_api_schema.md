# Pandora API Schema Reference

This document describes the structure of Pandora API request and response payloads for project management, backlog tracking, sprints, work items, and knowledge checkpoints.

## Core API Response Structures

### 1. Project Response

```json
{
  "id": "proj-001",
  "name": "AgenticTodoList",
  "description": "AI-powered task management system",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-04-04T15:30:00Z",
  "status": "active",
  "tech_stack": "Python, TypeScript, DuckDB",
  "github_url": "https://github.com/org/project",
  "local_path": "/home/user/projects/todolist",
  "main_branch": "develop"
}
```

### 2. Backlog Item Response

```json
{
  "id": "backlog-123",
  "project_id": "proj-001",
  "title": "Implement DuckDB JSON processing",
  "description": "Add capability to process JSON payloads using DuckDB for analytics",
  "status": "planned",
  "priority": 4,
  "story_points": 8,
  "created_at": "2024-03-15T09:00:00Z",
  "updated_at": "2024-04-04T14:20:00Z",
  "tags": "backend,analytics,duckdb",
  "wiki_refs": "wiki:DuckDB-Integration",
  "constraints": "Must be completed before Sprint 3"
}
```

### 3. Sprint Response

```json
{
  "id": "sprint-456",
  "project_id": "proj-001",
  "name": "Sprint 2 - Analytics Foundation",
  "goal": "Establish data processing pipeline with DuckDB integration",
  "status": "active",
  "start_date": "2024-04-01",
  "end_date": "2024-04-15",
  "created_at": "2024-03-28T10:00:00Z",
  "backlog_item_count": 12,
  "total_story_points": 55,
  "backlog_items": [
    {
      "id": "backlog-123",
      "title": "Implement DuckDB JSON processing",
      "status": "in_sprint"
    }
  ]
}
```

### 4. Work Item Response

```json
{
  "id": "work-789",
  "sprint_id": "sprint-456",
  "backlog_item_id": "backlog-123",
  "title": "Add DuckDB processing utility",
  "description": "Create reusable DuckDB processor for JSON payloads",
  "status": "in_progress",
  "assignee": "developer@company.com",
  "branch": "feature/duckdb-processor",
  "created_at": "2024-04-01T10:00:00Z",
  "updated_at": "2024-04-04T14:00:00Z",
  "tags": "backend,python,feature",
  "agent_name": "code-agent",
  "model_used": "claude-opus-4.6",
  "ide_used": "vscode",
  "tokens_used": 45000,
  "feedback": "Implementation complete, awaiting review"
}
```

### 5. Work Item with Subtasks

```json
{
  "id": "work-789",
  "title": "Add DuckDB processing utility",
  "status": "in_progress",
  "subtasks": [
    {
      "id": "subtask-001",
      "title": "Design DuckDB processor architecture",
      "status": "done",
      "branch": "task/duckdb-processor/design"
    },
    {
      "id": "subtask-002",
      "title": "Implement core processor functions",
      "status": "in_progress",
      "branch": "task/duckdb-processor/implementation"
    },
    {
      "id": "subtask-003",
      "title": "Add unit tests (80% coverage)",
      "status": "todo",
      "branch": "task/duckdb-processor/tests"
    }
  ]
}
```

### 6. Knowledge Checkpoint Response

```json
{
  "id": "checkpoint-001",
  "project_id": "proj-001",
  "sprint_id": "sprint-456",
  "name": "DuckDB Integration Checkpoint",
  "created_at": "2024-04-04T16:00:00Z",
  "context_snapshot": "Completed DuckDB skill creation and integrated into Pandora Atomic Flow",
  "decisions": [
    "Use DuckDB for in-memory JSON processing instead of Pandas",
    "Create reusable skill module for DuckDB operations",
    "Support Python, JavaScript, and .NET implementations"
  ],
  "risks": [
    "Memory constraints for payloads > 10GB",
    "Need to optimize query performance for large datasets"
  ],
  "next_actions": [
    "Performance testing with 100MB+ JSON files",
    "Create dashboard for DuckDB query analytics",
    "Document integration patterns for teams"
  ]
}
```

### 7. Documentation/Wiki Page Response

```json
{
  "id": "wiki-001",
  "project_id": "proj-001",
  "title": "DuckDB Integration Guide",
  "category": "backend",
  "content_markdown": "# DuckDB Integration\n\n## Overview\n...",
  "tags": "duckdb,analytics,backend",
  "created_at": "2024-04-04T10:00:00Z",
  "updated_at": "2024-04-04T15:30:00Z"
}
```

## API Request Patterns

### Create Backlog Item
```json
{
  "endpoint": "POST /api/projects/{project_id}/backlog",
  "body": {
    "title": "Implement DuckDB JSON processing",
    "description": "Add capability to process JSON payloads using DuckDB",
    "priority": 4,
    "story_points": 8
  }
}
```

### Update Work Item
```json
{
  "endpoint": "POST /api/work-items/{work_item_id}",
  "body": {
    "status": "in_progress",
    "assignee": "developer@company.com",
    "branch": "feature/duckdb-processor",
    "agent_name": "code-agent",
    "model_used": "claude-opus-4.6",
    "ide_used": "vscode",
    "tokens_used": 45000,
    "feedback": "Implementation in progress"
  }
}
```

### Create Sprint
```json
{
  "endpoint": "POST /api/projects/{project_id}/sprints",
  "body": {
    "name": "Sprint 2 - Analytics Foundation",
    "goal": "Establish data processing pipeline with DuckDB integration",
    "start_date": "2024-04-01",
    "end_date": "2024-04-15",
    "backlog_item_ids": ["backlog-123", "backlog-124", "backlog-125"]
  }
}
```

### Create Knowledge Checkpoint
```json
{
  "endpoint": "POST /api/projects/{project_id}/checkpoints",
  "body": {
    "name": "Sprint 2 Checkpoint",
    "context_snapshot": "Completed DuckDB integration and testing",
    "decisions": ["Used DuckDB for JSON processing"],
    "risks": ["Memory optimization needed"],
    "next_actions": ["Performance testing"]
  }
}
```

## Common Status Values

### Work Item Status
- `todo` - Not started
- `in_progress` - Currently being worked on
- `review` - Awaiting review/approval
- `done` - Completed
- `blocked` - Cannot proceed (blocked by dependency)

### Sprint Status
- `planned` - Scheduled but not started
- `active` - Currently in progress
- `closed` - Completed

### Project Status
- `active` - Project is ongoing
- `archived` - Project is archived
- `paused` - Project is temporarily paused

## Sample DuckDB Queries for Pandora API Responses

### Query 1: Sprint Progress Tracking
```sql
SELECT 
  json_extract(sprint, '$.name') as sprint_name,
  json_extract(sprint, '$.goal') as goal,
  json_extract(item, '$.status') as work_status,
  COUNT(*) as item_count,
  SUM(CAST(json_extract(item, '$.story_points') AS INTEGER)) as total_points
FROM read_json_auto('sprints.json') sprint,
  json_array_elements(json_extract(sprint, '$.backlog_items')) item
GROUP BY sprint_name, goal, work_status
ORDER BY sprint_name, work_status;
```

### Query 2: Agent Performance Analysis
```sql
SELECT 
  json_extract(item, '$.agent_name') as agent,
  json_extract(item, '$.model_used') as model,
  COUNT(*) as work_items_completed,
  AVG(CAST(json_extract(item, '$.tokens_used') AS FLOAT)) as avg_tokens,
  SUM(CAST(json_extract(item, '$.tokens_used') AS INTEGER)) as total_tokens,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(item, '$.tokens_used') AS INTEGER)) as p95_tokens
FROM read_json_auto('work_items.json')
WHERE json_extract(item, '$.status') = 'done'
GROUP BY agent, model
ORDER BY total_tokens DESC;
```

### Query 3: Project Velocity
```sql
WITH item_completion AS (
  SELECT 
    DATE(CAST(json_extract(item, '$.updated_at') AS TIMESTAMP)) as completion_date,
    CAST(json_extract(item, '$.story_points') AS INTEGER) as points
  FROM read_json_auto('work_items.json')
  WHERE json_extract(item, '$.status') = 'done'
)
SELECT 
  completion_date,
  COUNT(*) as items_completed,
  SUM(points) as velocity
FROM item_completion
GROUP BY completion_date
ORDER BY completion_date DESC;
```

### Query 4: Risk Identification
```sql
SELECT 
  json_extract(checkpoint, '$.name') as checkpoint,
  json_extract(risk, '$') as identified_risk,
  COUNT(*) OVER (PARTITION BY json_extract(risk, '$')) as risk_frequency
FROM read_json_auto('checkpoints.json') checkpoint,
  json_array_elements(json_extract(checkpoint, '$.risks')) risk
ORDER BY risk_frequency DESC;
```

### Query 5: Backlog Health
```sql
SELECT 
  json_extract(item, '$.status') as status,
  json_extract(item, '$.priority') as priority,
  COUNT(*) as count,
  AVG(CAST(json_extract(item, '$.story_points') AS FLOAT)) as avg_points,
  MIN(json_extract(item, '$.created_at')) as oldest_item,
  MAX(json_extract(item, '$.updated_at')) as newest_update
FROM read_json_auto('backlog_items.json')
GROUP BY status, priority
ORDER BY status, priority DESC;
```

## Integration Patterns

### Pattern 1: Log API Responses
```python
# Capture all API responses in JSON format
import json
from datetime import datetime

api_responses = []

def log_api_response(endpoint, method, request_body, response_body, duration_ms):
    api_responses.append({
        "timestamp": datetime.utcnow().isoformat(),
        "endpoint": endpoint,
        "method": method,
        "request": request_body,
        "response": response_body,
        "duration_ms": duration_ms
    })
    
    # Save to JSON file
    with open('api_responses.json', 'a') as f:
        f.write(json.dumps(api_responses[-1]) + '\n')
```

### Pattern 2: Query and Export
```python
def export_sprint_data(sprint_id):
    # Query Pandora API
    sprint_response = requests.get(f"/api/sprints/{sprint_id}").json()
    
    # Process with DuckDB
    conn = duckdb.connect(':memory:')
    result = conn.execute(f"""
    SELECT * FROM read_json_auto('sprint_data.json')
    WHERE json_extract(data, '$.sprint_id') = '{sprint_id}'
    """).fetch_df()
    
    # Export to CSV
    result.to_csv(f'sprint_{sprint_id}_export.csv', index=False)
```

## Field Mapping for Analytics

| Pandora Field | DuckDB JSON Path | Data Type | Purpose |
|---------------|------------------|-----------|---------|
| id | $.id | string | Unique identifier |
| status | $.status | string | Item status tracking |
| priority | $.priority | integer | Priority level (1-5) |
| story_points | $.story_points | integer | Effort estimation |
| tokens_used | $.tokens_used | integer | API usage tracking |
| agent_name | $.agent_name | string | Agent identification |
| model_used | $.model_used | string | AI model version |
| created_at | $.created_at | timestamp | Creation time |
| updated_at | $.updated_at | timestamp | Last modification |
