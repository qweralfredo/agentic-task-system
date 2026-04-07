# DuckDB JSON Processor - Usage Examples

Complete working examples for integrating DuckDB JSON processing into Pandora Atomic Flow workflows.

## Example 1: Weekly Performance Dashboard

**Goal**: Analyze MCP performance metrics and update Pandora with insights

**Files Modified**:
- `SKILL.md` - Use DuckDB JSON Processor skill
- `work_items.json` - Track analysis progress
- `api_logs.jsonl` - Input data (MCP logs)

**Workflow**:

```python
#!/usr/bin/env python3
"""
Weekly Performance Dashboard Generation
For Pandora Atomic Flow - Backlog Item: "Analytics Foundation"
"""

from datetime import datetime, timedelta
from pathlib import Path
from references.duckdb_utilities import (
    DuckDBProcessor, 
    MCPPayloadAnalyzer,
    JSONExporter
)
import json

def generate_weekly_dashboard():
    """Generate performance metrics for the past 7 days"""
    
    # Initialize
    processor = DuckDBProcessor(memory_limit='4GB')
    analyzer = MCPPayloadAnalyzer(processor)
    
    print("📊 Generating weekly performance dashboard...")
    
    # Step 1: Load MCP request logs
    print("  ✓ Loading MCP logs...")
    log_count = processor.load_json_file('api_logs.jsonl', 'mcp_logs')
    print(f"    Loaded {log_count} log entries")
    
    # Step 2: Analyze performance by method
    print("  ✓ Analyzing method performance...")
    method_perf = analyzer.analyze_method_performance('api_logs.jsonl')
    print(method_perf)
    
    # Step 3: Analyze latency distribution
    print("  ✓ Calculating latency percentiles...")
    latency = analyzer.analyze_latency_distribution('api_logs.jsonl')
    print(f"    P50: {latency['p50_ms']:.2f}ms")
    print(f"    P95: {latency['p95_ms']:.2f}ms")
    print(f"    P99: {latency['p99_ms']:.2f}ms")
    
    # Step 4: Find errors
    print("  ✓ Identifying errors...")
    errors = analyzer.find_errors('api_logs.jsonl', limit=10)
    print(f"    Found {len(errors)} error records")
    
    # Step 5: Export results
    print("  ✓ Exporting results...")
    processor.export_csv(
        "SELECT * FROM mcp_logs",
        'weekly_report.csv'
    )
    
    # Step 6: Create summary
    summary = {
        'generated_at': datetime.now().isoformat(),
        'period': 'last_7_days',
        'total_requests': log_count,
        'performance': {
            'avg_latency_ms': float(latency['avg_ms']),
            'p95_latency_ms': float(latency['p95_ms']),
            'p99_latency_ms': float(latency['p99_ms'])
        },
        'errors': len(errors)
    }
    
    JSONExporter.save_json(summary, 'weekly_summary.json')
    
    # Step 7: Close processor
    processor.close()
    
    print("✅ Dashboard generation complete!")
    return summary

# Integration with Pandora
def update_pandora_work_item(summary):
    """Update Pandora work item with analysis results"""
    from mcp_pandora_client import PandoraClient
    
    client = PandoraClient()
    
    # Create documentation
    feedback = f"""
## Weekly Performance Report

Generated: {summary['generated_at']}

### Summary
- Total requests: {summary['total_requests']}
- Error count: {summary['errors']}

### Latency Metrics
- P50: {summary['performance']['avg_latency_ms']:.2f}ms
- P95: {summary['performance']['p95_latency_ms']:.2f}ms  
- P99: {summary['performance']['p99_latency_ms']:.2f}ms

### Results
- CSV Report: weekly_report.csv
- JSON Summary: weekly_summary.json

See integration_guide.md for detailed analysis patterns.
"""
    
    # Update work item
    client.update_work_item(
        work_item_id='work-analytics-123',
        status='done',
        assignee='analytics-bot',
        feedback=feedback,
        tokens_used=2500  # Estimated
    )

if __name__ == '__main__':
    summary = generate_weekly_dashboard()
    update_pandora_work_item(summary)
```

## Example 2: Sprint Health Check

**Goal**: Monitor sprint progress and identify blockers

```python
#!/usr/bin/env python3
"""
Sprint Health Check Analysis
For Pandora Atomic Flow - Task: "Monitor Sprint Progress"
"""

from references.duckdb_utilities import (
    DuckDBProcessor,
    PandoraPayloadAnalyzer
)
import json

async def check_sprint_health(sprint_id: str):
    """Analyze current sprint health"""
    
    processor = DuckDBProcessor()
    analyzer = PandoraPayloadAnalyzer(processor)
    
    print(f"🏥 Checking health of {sprint_id}...")
    
    # Get sprint progress
    progress = analyzer.analyze_sprint_progress('sprints.json')
    current_sprint = progress[progress['sprint_name'].str.contains('Sprint 2', na=False)]
    
    if current_sprint.empty:
        print("  ⚠️ No active sprint found")
        return None
    
    sprint_data = current_sprint.iloc[0]
    
    print(f"  Sprint: {sprint_data['sprint_name']}")
    print(f"  Status: {sprint_data['sprint_status']}")
    print(f"  Progress: {sprint_data['completed_items']}/{sprint_data['work_item_count']} items")
    print(f"  Velocity: {sprint_data['total_story_points']} points")
    
    # Identify blockers
    blockers = analyzer.identify_blockers('work_items.json')
    
    if not blockers.empty:
        print(f"\n  🚧 Blockers found: {len(blockers)}")
        for _, blocker in blockers.iterrows():
            print(f"    - {blocker['title']} (since {blocker['last_update']})")
    else:
        print("  ✅ No blockers detected")
    
    processor.close()
    
    return {
        'sprint': sprint_data.to_dict(),
        'blockers': blockers.to_dict('records') if not blockers.empty else []
    }

# Usage in Pandora task
async def run_sprint_health_check():
    health = await check_sprint_health('sprint-456')
    
    if health:
        # Update Pandora work item
        from mcp_pandora_client import PandoraClient
        client = PandoraClient()
        
        blocker_text = ""
        if health['blockers']:
            blocker_text = "\n### Blockers:\n"
            for blocker in health['blockers']:
                blocker_text += f"- {blocker['title']}\n"
        
        client.create_documentation(
            project_id='proj-001',
            title='Sprint Health Report',
            content_markdown=f"""
## Sprint Status: {health['sprint']['sprint_name']}

**Status**: {health['sprint']['sprint_status']}

### Progress
- Completed: {health['sprint']['completed_items']}/{health['sprint']['work_item_count']}
- In Progress: {health['sprint']['in_progress_items']}
- Remaining: {health['sprint']['todo_items']}
- Total Points: {health['sprint']['total_story_points']}

{blocker_text}

Generated: {datetime.now().isoformat()}
""",
            category='reports',
            tags='sprint,health,monitoring'
        )
```

## Example 3: Agent Performance Comparison

**Goal**: Compare agent efficiency and token usage

```python
#!/usr/bin/env python3
"""
Agent Performance Analysis
For Pandora Atomic Flow - Task: "Compare Agent Efficiency"
"""

from references.duckdb_utilities import (
    DuckDBProcessor,
    PandoraPayloadAnalyzer
)
from datetime import datetime

def analyze_agents():
    """Compare performance across agents and models"""
    
    processor = DuckDBProcessor()
    analyzer = PandoraPayloadAnalyzer(processor)
    
    print("🤖 Analyzing agent performance...")
    
    # Get performance metrics
    perf = analyzer.analyze_agent_performance('work_items.json')
    
    print("\n📊 Agent Performance Summary:")
    print("=" * 80)
    
    for _, row in perf.iterrows():
        efficiency = row['items_completed'] / (row['total_tokens'] / 1000)  # items per 1K tokens
        
        print(f"\nAgent: {row['agent']}")
        print(f"  Model: {row['model']}")
        print(f"  Items Completed: {row['items_completed']}")
        print(f"  Avg Tokens/Item: {row['avg_tokens']:.0f}")
        print(f"  Total Tokens: {row['total_tokens']}")
        print(f"  P95 Tokens: {row['p95_tokens']}")
        print(f"  Efficiency: {efficiency:.3f} items/1K tokens")
    
    processor.close()
    
    # Export for analysis
    perf.to_csv('agent_performance.csv', index=False)
    print("\n✅ Results exported to agent_performance.csv")
    
    return perf

# Create Pandora documentation
def create_agent_report(perf_df):
    from mcp_pandora_client import PandoraClient
    
    client = PandoraClient()
    
    # Calculate rankings
    perf_df['efficiency'] = perf_df['items_completed'] / (perf_df['total_tokens'] / 1000)
    top_agent = perf_df.loc[perf_df['efficiency'].idxmax()]
    
    content = f"""
# Agent Performance Analysis Report

**Date**: {datetime.now().strftime('%Y-%m-%d')}

## Summary Statistics

| Agent | Model | Items | Avg Tokens | Efficiency |
|-------|-------|-------|-----------|-----------|
"""
    
    for _, row in perf_df.iterrows():
        eff = row['items_completed'] / (row['total_tokens'] / 1000)
        content += f"| {row['agent']} | {row['model']} | {row['items_completed']} | {row['avg_tokens']:.0f} | {eff:.3f} |\n"
    
    content += f"""

## Top Performer
**{top_agent['agent']}** using {top_agent['model']}
- Completed {top_agent['items_completed']} items
- Efficiency: {top_agent['efficiency']:.3f} items/1K tokens

## Recommendations
1. Consider using top performing agent for complex tasks
2. Investigate outlier token usage in slower agents
3. Monitor model updates for performance improvements
"""
    
    client.create_documentation(
        project_id='proj-001',
        title='Agent Performance Analysis',
        content_markdown=content,
        category='analysis',
        tags='agents,performance,efficiency'
    )

if __name__ == '__main__':
    perf_df = analyze_agents()
    create_agent_report(perf_df)
```

## Example 4: Token Usage Tracking

**Goal**: Monitor and report on API token consumption

```sql
-- DuckDB Query for Token Analysis
-- Use from references/duckdb_utilities.py

WITH daily_usage AS (
  SELECT
    DATE(CAST(json_extract(item, '$.updated_at') AS TIMESTAMP)) as date,
    json_extract(item, '$.agent_name') as agent,
    json_extract(item, '$.model_used') as model,
    SUM(CAST(json_extract(item, '$.tokens_used') AS INTEGER)) as daily_tokens,
    COUNT(*) as items_completed
  FROM read_json_auto('work_items.jsonl')
  WHERE json_extract(item, '$.status') = 'done'
  GROUP BY date, agent, model
)

SELECT
  date,
  agent,
  model,
  daily_tokens,
  items_completed,
  ROUND(CAST(daily_tokens AS FLOAT) / items_completed, 0) as avg_tokens_per_item,
  SUM(daily_tokens) OVER (PARTITION BY agent ORDER BY date) as cumulative_tokens
FROM daily_usage
ORDER BY date DESC, daily_tokens DESC
```

## Example 5: Pandora Integration - Full Workflow

**Goal**: Complete Pandora Atomic Flow workflow using DuckDB

```
📋 Backlog Item: "Setup API Analytics Infrastructure"
   status: planned
   priority: 4
   story_points: 13

├─ 🎯 Sprint: "Sprint 2 - Analytics Foundation"
│  goal: "Establish data processing pipeline"
│  start_date: 2024-04-01
│  end_date: 2024-04-15
│
├─ 📌 Task 1: "Set up JSON logging"
│  status: done
│  story_points: 3
│
├─ 📌 Task 2: "Implement DuckDB processor"
│  status: in_progress
│  story_points: 5
│  branch: feature/duckdb-processor
│
│  ├─ 🔹 Subtask: "Create processor classes"
│  │  status: done
│  │
│  ├─ 🔹 Subtask: "Add MCP analyzer"
│  │  status: in_progress
│  │  tokens_used: 3500
│  │
│  └─ 🔹 Subtask: "Add Pandora analyzer"
│     status: todo
│
├─ 📌 Task 3: "Generate analysis reports"
│  status: todo
│  story_points: 5
│
└─ ✅ Knowledge Checkpoint
   "DuckDB Integration Phase 1 Complete"
   decisions:
     - Use DuckDB for JSON processing
     - Create reusable utility classes
     - Support Python and JavaScript
   risks:
     - Memory optimization for large files
   next_actions:
     - Performance testing
     - Create automated report scheduling
```

## Example 6: Custom Analysis Query

**Goal**: Create a custom query for project-specific metrics

```python
from references.duckdb_utilities import DuckDBProcessor
import duckdb

def custom_analysis():
    processor = DuckDBProcessor()
    
    # Load data
    processor.load_json_file('work_items.jsonl', 'items')
    
    # Custom query: Find items completed above average
    query = """
    WITH stats AS (
        SELECT 
            AVG(CAST(json_extract(item, '$.story_points') AS FLOAT)) as avg_points
        FROM items item
    )
    SELECT 
        json_extract(item, '$.title') as title,
        CAST(json_extract(item, '$.story_points') AS INTEGER) as points,
        json_extract(item, '$.assignee') as assignee,
        json_extract(item, '$.updated_at') as completed_date
    FROM items item, stats
    WHERE 
        json_extract(item, '$.status') = 'done'
        AND CAST(json_extract(item, '$.story_points') AS FLOAT) > stats.avg_points
    ORDER BY json_extract(item, '$.story_points') DESC
    """
    
    results = processor.query(query, fetch_type='df')
    print(results)
    
    processor.close()
    return results
```

## Integration Checklist

Use this when setting up DuckDB for your Pandora projects:

```markdown
- [ ] Install DuckDB and dependencies
- [ ] Review SKILL.md and README.md
- [ ] Set up JSON logging (see integration_guide.md)
- [ ] Create first analysis pipeline
- [ ] Test with sample MCP logs
- [ ] Test with sample Pandora API data
- [ ] Create Pandora work items for tracking
- [ ] Set up automated analysis schedules
- [ ] Create documentation for team
- [ ] Monitor performance and optimize
```

## Next Steps

1. Choose an example above that matches your use case
2. Copy the code and adapt to your data
3. Test with sample JSON files
4. Integrate into Pandora Atomic Flow
5. Set up automated scheduling

See `integration_guide.md` for detailed setup instructions.
