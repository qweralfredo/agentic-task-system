"""
DuckDB JSON Processing Utilities

Provides reusable functions for processing MCP and Pandora API payloads
"""

import duckdb
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import pandas as pd


class DuckDBProcessor:
    """Main processor for JSON payloads using DuckDB"""

    def __init__(self, memory_limit: str = '4GB'):
        """
        Initialize DuckDB connection

        Args:
            memory_limit: Maximum memory to allocate (e.g., '4GB', '2GB')
        """
        self.conn = duckdb.connect(':memory:', config={
            'max_memory': memory_limit,
            'threads': 4
        })

    def load_json_file(self, filepath: str, table_name: str = 'data') -> int:
        """
        Load JSON file into a DuckDB table

        Args:
            filepath: Path to JSON file
            table_name: Name of the table to create

        Returns:
            Number of rows loaded
        """
        query = f"""
        CREATE TABLE IF NOT EXISTS {table_name} AS
        SELECT * FROM read_json_auto('{filepath}')
        """
        self.conn.execute(query)

        count_result = self.conn.execute(
            f"SELECT COUNT(*) as count FROM {table_name}"
        ).fetch_one()

        return count_result[0] if count_result else 0

    def query(self, sql: str, fetch_type: str = 'all') -> Union[List, pd.DataFrame]:
        """
        Execute SQL query on loaded data

        Args:
            sql: SQL query string
            fetch_type: 'all' (list), 'df' (pandas DataFrame), 'one' (single row)

        Returns:
            Query results in requested format
        """
        result = self.conn.execute(sql)

        if fetch_type == 'df':
            return result.fetch_df()
        elif fetch_type == 'one':
            return result.fetch_one()
        else:
            return result.fetch_all()

    def export_csv(self, sql: str, filepath: str) -> bool:
        """
        Export query results to CSV file

        Args:
            sql: SQL query to export
            filepath: Output CSV file path

        Returns:
            Success status
        """
        try:
            self.conn.execute(f"COPY ({sql}) TO '{filepath}' WITH (FORMAT CSV, HEADER TRUE)")
            return True
        except Exception as e:
            print(f"Error exporting CSV: {e}")
            return False

    def export_parquet(self, sql: str, filepath: str) -> bool:
        """
        Export query results to Parquet file

        Args:
            sql: SQL query to export
            filepath: Output Parquet file path

        Returns:
            Success status
        """
        try:
            self.conn.execute(f"COPY ({sql}) TO '{filepath}' WITH (FORMAT PARQUET)")
            return True
        except Exception as e:
            print(f"Error exporting Parquet: {e}")
            return False

    def close(self):
        """Close DuckDB connection"""
        self.conn.close()


class MCPPayloadAnalyzer:
    """Analyzer for MCP request/response payloads"""

    def __init__(self, processor: DuckDBProcessor):
        self.processor = processor

    def analyze_method_performance(self, json_file: str) -> pd.DataFrame:
        """
        Analyze performance metrics by MCP method

        Returns:
            DataFrame with method performance statistics
        """
        self.processor.load_json_file(json_file, 'mcp_logs')

        query = """
        SELECT
            json_extract(data, '$.method') as method,
            COUNT(*) as request_count,
            AVG(CAST(json_extract(data, '$.duration_ms') AS FLOAT)) as avg_duration_ms,
            MAX(CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as max_duration_ms,
            MIN(CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as min_duration_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p95_duration_ms
        FROM mcp_logs
        WHERE json_extract(data, '$.method') IS NOT NULL
        GROUP BY method
        ORDER BY avg_duration_ms DESC
        """

        return self.processor.query(query, fetch_type='df')

    def find_errors(self, json_file: str, limit: int = 100) -> pd.DataFrame:
        """
        Find error responses in MCP logs

        Args:
            json_file: Path to MCP logs JSON file
            limit: Maximum number of errors to return

        Returns:
            DataFrame with error details
        """
        self.processor.load_json_file(json_file, 'mcp_responses')

        query = f"""
        SELECT
            json_extract(data, '$.id') as request_id,
            json_extract(data, '$.error.code') as error_code,
            json_extract(data, '$.error.message') as error_message,
            json_extract(data, '$.timestamp') as timestamp
        FROM mcp_responses
        WHERE json_extract(data, '$.error') IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT {limit}
        """

        return self.processor.query(query, fetch_type='df')

    def analyze_latency_distribution(self, json_file: str) -> Dict[str, Any]:
        """
        Calculate latency distribution percentiles

        Returns:
            Dictionary with latency statistics
        """
        self.processor.load_json_file(json_file, 'mcp_logs')

        query = """
        SELECT
            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p50_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p95_ms,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p99_ms,
            MAX(CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as max_ms,
            AVG(CAST(json_extract(data, '$.duration_ms') AS FLOAT)) as avg_ms
        FROM mcp_logs
        """

        result = self.processor.query(query, fetch_type='one')

        return {
            'p50_ms': result[0],
            'p95_ms': result[1],
            'p99_ms': result[2],
            'max_ms': result[3],
            'avg_ms': result[4]
        }


class PandoraPayloadAnalyzer:
    """Analyzer for Pandora API payloads"""

    def __init__(self, processor: DuckDBProcessor):
        self.processor = processor

    def analyze_sprint_progress(self, json_file: str) -> pd.DataFrame:
        """
        Analyze work progress within sprints

        Returns:
            DataFrame with sprint progress metrics
        """
        self.processor.load_json_file(json_file, 'sprints')

        query = """
        SELECT
            json_extract(data, '$.name') as sprint_name,
            json_extract(data, '$.status') as sprint_status,
            COUNT(*) as work_item_count,
            COUNTIF(json_extract(item, '$.status') = 'done') as completed_items,
            COUNTIF(json_extract(item, '$.status') = 'in_progress') as in_progress_items,
            COUNTIF(json_extract(item, '$.status') = 'todo') as todo_items,
            SUM(CAST(json_extract(item, '$.story_points') AS INTEGER)) as total_story_points
        FROM sprints,
            LATERAL json_array_elements(json_extract(data, '$.backlog_items')) as item
        GROUP BY sprint_name, sprint_status
        ORDER BY sprint_name
        """

        return self.processor.query(query, fetch_type='df')

    def analyze_agent_performance(self, json_file: str) -> pd.DataFrame:
        """
        Analyze work item completion by agent and model

        Returns:
            DataFrame with agent performance metrics
        """
        self.processor.load_json_file(json_file, 'work_items')

        query = """
        SELECT
            json_extract(data, '$.agent_name') as agent,
            json_extract(data, '$.model_used') as model,
            COUNT(*) as items_completed,
            AVG(CAST(json_extract(data, '$.tokens_used') AS FLOAT)) as avg_tokens,
            SUM(CAST(json_extract(data, '$.tokens_used') AS INTEGER)) as total_tokens,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.tokens_used') AS INTEGER)) as p95_tokens
        FROM work_items
        WHERE json_extract(data, '$.status') = 'done'
        GROUP BY agent, model
        ORDER BY total_tokens DESC
        """

        return self.processor.query(query, fetch_type='df')

    def calculate_velocity(self, json_file: str) -> pd.DataFrame:
        """
        Calculate sprint velocity (story points completed per sprint)

        Returns:
            DataFrame with velocity metrics
        """
        self.processor.load_json_file(json_file, 'work_items')

        query = """
        SELECT
            DATE(CAST(json_extract(data, '$.updated_at') AS TIMESTAMP)) as completion_date,
            COUNT(*) as items_completed,
            SUM(CAST(json_extract(data, '$.story_points') AS INTEGER)) as velocity
        FROM work_items
        WHERE json_extract(data, '$.status') = 'done'
        GROUP BY completion_date
        ORDER BY completion_date DESC
        """

        return self.processor.query(query, fetch_type='df')

    def identify_blockers(self, json_file: str) -> pd.DataFrame:
        """
        Identify blocked work items and their dependencies

        Returns:
            DataFrame with blocker information
        """
        self.processor.load_json_file(json_file, 'work_items')

        query = """
        SELECT
            json_extract(data, '$.id') as work_item_id,
            json_extract(data, '$.title') as title,
            json_extract(data, '$.status') as status,
            json_extract(data, '$.constraints') as constraint,
            json_extract(data, '$.updated_at') as last_update
        FROM work_items
        WHERE json_extract(data, '$.status') = 'blocked'
        ORDER BY json_extract(data, '$.updated_at') DESC
        """

        return self.processor.query(query, fetch_type='df')


class JSONExporter:
    """Utilities for exporting processed data"""

    @staticmethod
    def save_json(data: Union[List, Dict], filepath: str) -> bool:
        """Save data to JSON file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            return True
        except Exception as e:
            print(f"Error saving JSON: {e}")
            return False

    @staticmethod
    def save_jsonl(records: List[Dict], filepath: str) -> bool:
        """Save records to JSONL file (one JSON object per line)"""
        try:
            with open(filepath, 'w') as f:
                for record in records:
                    f.write(json.dumps(record, default=str) + '\n')
            return True
        except Exception as e:
            print(f"Error saving JSONL: {e}")
            return False


# Example usage
if __name__ == "__main__":
    # Initialize processor
    processor = DuckDBProcessor(memory_limit='4GB')

    # Example: Analyze MCP logs
    mcp_analyzer = MCPPayloadAnalyzer(processor)

    # Load and analyze
    # mcp_analyzer.processor.load_json_file('mcp_requests.json', 'mcp_logs')
    # performance = mcp_analyzer.analyze_method_performance('mcp_requests.json')
    # print(performance)

    # Example: Analyze Pandora payloads
    pandora_analyzer = PandoraPayloadAnalyzer(processor)

    # Analyze sprint progress
    # progress = pandora_analyzer.analyze_sprint_progress('sprints.json')
    # print(progress)

    # Analyze agent performance
    # perf = pandora_analyzer.analyze_agent_performance('work_items.json')
    # print(perf)

    processor.close()
