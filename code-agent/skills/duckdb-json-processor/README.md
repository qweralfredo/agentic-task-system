# DuckDB JSON Processor Skill

A comprehensive skill for processing, analyzing, and transforming JSON payloads from MCP (Model Context Protocol) and Pandora API using DuckDB's powerful SQL engine.

## 📋 What's Included

### Core Files
- **SKILL.md** - Main skill documentation with overview and quick start guides
- **README.md** - This file

### Reference Documentation
- **duckdb_examples.md** - Advanced SQL examples and real-world use cases
- **mcp_payload_schema.md** - MCP request/response structure and query examples
- **pandora_api_schema.md** - Pandora API payload structure and integration patterns
- **integration_guide.md** - Step-by-step integration with Pandora Atomic Flow

### Code Libraries
- **duckdb_utilities.py** - Python utilities and analyzer classes
  - `DuckDBProcessor` - Core processor for JSON operations
  - `MCPPayloadAnalyzer` - Analyze MCP request/response patterns
  - `PandoraPayloadAnalyzer` - Analyze Pandora API payloads
  - `JSONExporter` - Export results to multiple formats

- **duckdb_utilities.js** - Node.js/JavaScript utilities
  - Same classes as Python version
  - Full async/await support
  - Browser and Node.js compatible

### Dependency Files
- **requirements.txt** - Python dependencies
- **package.json** - Node.js dependencies

## 🚀 Quick Start

### Python

```python
from references.duckdb_utilities import DuckDBProcessor, PandoraPayloadAnalyzer

# Initialize
processor = DuckDBProcessor(memory_limit='4GB')
analyzer = PandoraPayloadAnalyzer(processor)

# Analyze sprint progress
progress = analyzer.analyze_sprint_progress('work_items.json')
print(progress)

# Get velocity metrics
velocity = analyzer.calculate_velocity('work_items.json')
print(velocity)

processor.close()
```

### JavaScript

```javascript
import { DuckDBProcessor, PandoraPayloadAnalyzer } from './references/duckdb_utilities.js';

// Initialize
const processor = new DuckDBProcessor();
await processor.initialize();

const analyzer = new PandoraPayloadAnalyzer(processor);

// Analyze sprint progress
const progress = await analyzer.analyzeSprintProgress('work_items.json');
console.log(progress);

await processor.close();
```

## 📊 Key Features

### For MCP Request Analysis
- Performance metrics by method
- Latency distribution and percentiles
- Error rate analysis
- Request/response correlation
- Batch request processing

### For Pandora API Integration
- Sprint progress tracking
- Agent performance analysis
- Team velocity calculation
- Blocker identification
- Work item status distribution
- Token usage analytics

### Data Export
- CSV for dashboards
- Parquet for big data pipelines
- JSON/JSONL for archival
- DataFrame for in-memory processing

## 🔧 Common Use Cases

### Use Case 1: Weekly Performance Report
```python
# See integration_guide.md for full example
processor = DuckDBProcessor()
mcp_analyzer = MCPPayloadAnalyzer(processor)
perf = mcp_analyzer.analyze_method_performance('api_logs.jsonl')
# Export to CSV for team dashboard
```

### Use Case 2: Sprint Health Check
```python
pandora_analyzer = PandoraPayloadAnalyzer(processor)

# Get sprint progress
progress = await analyzer.analyzeSprintProgress('sprints.json')

# Identify blockers
blockers = await analyzer.identifyBlockers('work_items.json')

# Calculate velocity trend
velocity = await analyzer.calculateVelocity('work_items.json')
```

### Use Case 3: Agent Efficiency Analysis
```python
# Track token usage and completion rates
perf = await analyzer.analyzeAgentPerformance('work_items.json')

# Update Pandora with insights
client.create_documentation(
    title='Agent Performance Report',
    content=summarize_performance(perf)
)
```

## 📂 File Organization

```
duckdb-json-processor/
├── SKILL.md                          # Main skill definition
├── README.md                         # This file
└── references/                       # Support documentation and code
    ├── duckdb_examples.md           # Advanced examples
    ├── duckdb_utilities.py          # Python library
    ├── duckdb_utilities.js          # JavaScript library
    ├── integration_guide.md         # Integration instructions
    ├── mcp_payload_schema.md        # MCP payload documentation
    ├── pandora_api_schema.md        # Pandora API documentation
    ├── package.json                 # Node.js dependencies
    └── requirements.txt             # Python dependencies
```

## 🔌 Integration with Pandora Atomic Flow

This skill integrates seamlessly with:
- **Pandora Atomic Flow** - Use for analytics tasks in your atomic flows
- **Pandora SDD Task Manager** - Track analysis work items and results
- **MCP Servers** - Process request/response payloads
- **Code Agent** - Leverage for data processing tasks

### Workflow Example

```
Backlog Item: "Implement API performance analytics"
  ├─ Task 1: "Set up JSON logging for MCP"
  ├─ Task 2: "Create DuckDB analysis pipeline" [USE THIS SKILL]
  └─ Task 3: "Generate weekly reports"
        ├─ Subtask: "Load MCP logs into DuckDB"
        ├─ Subtask: "Run performance analysis queries"
        └─ Subtask: "Export results to CSV"
```

## 🛠️ Installation

### Python
```bash
pip install -r references/requirements.txt
```

### Node.js
```bash
npm install --prefix references
```

## 📚 Documentation Structure

1. **Start here**: SKILL.md for overview
2. **Learn patterns**: duckdb_examples.md for common queries
3. **Understand data**: mcp_payload_schema.md and pandora_api_schema.md
4. **Implement**: integration_guide.md for step-by-step setup
5. **Code**: duckdb_utilities.py/.js for actual implementation

## 🤝 Integration Examples

### Example 1: Process MCP Logs and Update Pandora
See `integration_guide.md` → "Step 1-3"

### Example 2: Generate Monthly Reports
See `integration_guide.md` → "Real-World Example"

### Example 3: Batch Process Large Files
See `duckdb_examples.md` → "Batch Processing"

## 🚨 Performance Considerations

- **Memory**: Default 4GB, adjust for large datasets
- **Indexing**: Create indexes on frequently queried JSON paths
- **Partitioning**: Use daily/weekly partitions for large log files
- **Streaming**: Process large files in batches

See `integration_guide.md` → "Performance Optimization Tips"

## 🔍 Troubleshooting

Common issues and solutions:

- **Out of Memory**: Reduce memory_limit or process smaller batches
- **Slow Queries**: Add indexes or filter before aggregation
- **JSON Parse Errors**: Validate JSONL format before loading

See `integration_guide.md` → "Troubleshooting"

## 📖 Quick Reference

### Python Quick Commands
```python
processor = DuckDBProcessor()
processor.load_json_file('data.json', 'table_name')
results = processor.query('SELECT * FROM table_name', fetch_type='df')
processor.export_csv('SELECT * FROM table_name', 'output.csv')
processor.close()
```

### JavaScript Quick Commands
```javascript
const processor = new DuckDBProcessor();
await processor.initialize();
await processor.loadJsonFile('data.json', 'table_name');
const results = await processor.query('SELECT * FROM table_name', 'df');
await processor.exportJson('SELECT * FROM table_name', 'output.json');
await processor.close();
```

## 🎯 Next Steps

1. Choose your language (Python or JavaScript)
2. Install dependencies from requirements.txt or package.json
3. Follow integration_guide.md for your use case
4. Set up JSON logging for your MCP/API
5. Create your first analysis pipeline
6. Schedule automated reports using Pandora Atomic Flow

## 📞 Support

For issues or questions:
- Check duckdb_examples.md for similar patterns
- Review integration_guide.md for setup help
- Consult mcp_payload_schema.md / pandora_api_schema.md for data structures

## 📄 License

See LICENSE file in project root.

---

**Version**: 1.0.0  
**Last Updated**: 2024-04-04  
**Skill Category**: Backend Analytics, Data Processing
