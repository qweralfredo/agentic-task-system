/**
 * DuckDB JSON Processing Utilities for Node.js
 *
 * Provides reusable functions for processing MCP and Pandora API payloads
 */

import * as duckdb from '@duckdb/wasm';
import * as fs from 'fs/promises';
import * as path from 'path';


/**
 * Main DuckDB processor for JSON payloads
 */
class DuckDBProcessor {
  constructor() {
    this.db = null;
    this.connection = null;
  }

  /**
   * Initialize DuckDB database
   */
  async initialize() {
    const bundle = await duckdb.getJsDelivrBundle();
    const logger = new duckdb.ConsoleLogger();
    const worker = await duckdb.initializeWorker(bundle);
    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate();
    this.connection = await this.db.connect();
  }

  /**
   * Load JSON file into a DuckDB table
   * @param {string} filepath - Path to JSON file
   * @param {string} tableName - Name of the table to create
   * @returns {Promise<number>} - Number of rows loaded
   */
  async loadJsonFile(filepath, tableName = 'data') {
    try {
      const query = `
        CREATE TABLE ${tableName} AS
        SELECT * FROM read_json_auto('${filepath}')
      `;
      await this.connection.query(query);

      const countResult = await this.connection.query(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );

      return countResult.toArray()[0]['count'] ?? 0;
    } catch (error) {
      console.error(`Error loading JSON file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute SQL query on loaded data
   * @param {string} sql - SQL query string
   * @param {string} fetchType - 'all' (array), 'df' (DataFrame), 'one' (single row)
   * @returns {Promise<any>} - Query results
   */
  async query(sql, fetchType = 'all') {
    try {
      const result = await this.connection.query(sql);

      if (fetchType === 'df') {
        return result.toArray();
      } else if (fetchType === 'one') {
        const rows = result.toArray();
        return rows.length > 0 ? rows[0] : null;
      } else {
        return result.toArray();
      }
    } catch (error) {
      console.error(`Error executing query: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export query results to CSV file
   * @param {string} sql - SQL query to export
   * @param {string} filepath - Output CSV file path
   * @returns {Promise<boolean>} - Success status
   */
  async exportCsv(sql, filepath) {
    try {
      const query = `COPY (${sql}) TO '${filepath}' WITH (FORMAT CSV, HEADER TRUE)`;
      await this.connection.query(query);
      return true;
    } catch (error) {
      console.error(`Error exporting CSV: ${error.message}`);
      return false;
    }
  }

  /**
   * Export query results to JSON file
   * @param {string} sql - SQL query to export
   * @param {string} filepath - Output JSON file path
   * @returns {Promise<boolean>} - Success status
   */
  async exportJson(sql, filepath) {
    try {
      const query = `COPY (${sql}) TO '${filepath}' WITH (FORMAT JSON)`;
      await this.connection.query(query);
      return true;
    } catch (error) {
      console.error(`Error exporting JSON: ${error.message}`);
      return false;
    }
  }

  /**
   * Close DuckDB connection
   */
  async close() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}


/**
 * Analyzer for MCP request/response payloads
 */
class MCPPayloadAnalyzer {
  constructor(processor) {
    this.processor = processor;
  }

  /**
   * Analyze performance metrics by MCP method
   * @param {string} jsonFile - Path to MCP logs JSON file
   * @returns {Promise<Array>} - Array of method performance statistics
   */
  async analyzeMethodPerformance(jsonFile) {
    await this.processor.loadJsonFile(jsonFile, 'mcp_logs');

    const query = `
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
    `;

    return this.processor.query(query, 'df');
  }

  /**
   * Find error responses in MCP logs
   * @param {string} jsonFile - Path to MCP logs JSON file
   * @param {number} limit - Maximum number of errors to return
   * @returns {Promise<Array>} - Array with error details
   */
  async findErrors(jsonFile, limit = 100) {
    await this.processor.loadJsonFile(jsonFile, 'mcp_responses');

    const query = `
      SELECT
        json_extract(data, '$.id') as request_id,
        json_extract(data, '$.error.code') as error_code,
        json_extract(data, '$.error.message') as error_message,
        json_extract(data, '$.timestamp') as timestamp
      FROM mcp_responses
      WHERE json_extract(data, '$.error') IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return this.processor.query(query, 'df');
  }

  /**
   * Calculate latency distribution percentiles
   * @param {string} jsonFile - Path to MCP logs JSON file
   * @returns {Promise<Object>} - Object with latency statistics
   */
  async analyzeLatencyDistribution(jsonFile) {
    await this.processor.loadJsonFile(jsonFile, 'mcp_logs');

    const query = `
      SELECT
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p50_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p95_ms,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as p99_ms,
        MAX(CAST(json_extract(data, '$.duration_ms') AS INTEGER)) as max_ms,
        AVG(CAST(json_extract(data, '$.duration_ms') AS FLOAT)) as avg_ms
      FROM mcp_logs
    `;

    const result = await this.processor.query(query, 'one');

    return {
      p50Ms: result.p50_ms,
      p95Ms: result.p95_ms,
      p99Ms: result.p99_ms,
      maxMs: result.max_ms,
      avgMs: result.avg_ms
    };
  }
}


/**
 * Analyzer for Pandora API payloads
 */
class PandoraPayloadAnalyzer {
  constructor(processor) {
    this.processor = processor;
  }

  /**
   * Analyze work progress within sprints
   * @param {string} jsonFile - Path to sprints JSON file
   * @returns {Promise<Array>} - Array with sprint progress metrics
   */
  async analyzeSprintProgress(jsonFile) {
    await this.processor.loadJsonFile(jsonFile, 'sprints');

    const query = `
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
    `;

    return this.processor.query(query, 'df');
  }

  /**
   * Analyze work item completion by agent and model
   * @param {string} jsonFile - Path to work items JSON file
   * @returns {Promise<Array>} - Array with agent performance metrics
   */
  async analyzeAgentPerformance(jsonFile) {
    await this.processor.loadJsonFile(jsonFile, 'work_items');

    const query = `
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
    `;

    return this.processor.query(query, 'df');
  }

  /**
   * Calculate sprint velocity (story points completed per sprint)
   * @param {string} jsonFile - Path to work items JSON file
   * @returns {Promise<Array>} - Array with velocity metrics
   */
  async calculateVelocity(jsonFile) {
    await this.processor.loadJsonFile(jsonFile, 'work_items');

    const query = `
      SELECT
        DATE(CAST(json_extract(data, '$.updated_at') AS TIMESTAMP)) as completion_date,
        COUNT(*) as items_completed,
        SUM(CAST(json_extract(data, '$.story_points') AS INTEGER)) as velocity
      FROM work_items
      WHERE json_extract(data, '$.status') = 'done'
      GROUP BY completion_date
      ORDER BY completion_date DESC
    `;

    return this.processor.query(query, 'df');
  }

  /**
   * Identify blocked work items and their dependencies
   * @param {string} jsonFile - Path to work items JSON file
   * @returns {Promise<Array>} - Array with blocker information
   */
  async identifyBlockers(jsonFile) {
    await this.processor.loadJsonFile(jsonFile, 'work_items');

    const query = `
      SELECT
        json_extract(data, '$.id') as work_item_id,
        json_extract(data, '$.title') as title,
        json_extract(data, '$.status') as status,
        json_extract(data, '$.constraints') as constraint,
        json_extract(data, '$.updated_at') as last_update
      FROM work_items
      WHERE json_extract(data, '$.status') = 'blocked'
      ORDER BY json_extract(data, '$.updated_at') DESC
    `;

    return this.processor.query(query, 'df');
  }
}


/**
 * Utilities for exporting processed data
 */
class JSONExporter {
  /**
   * Save data to JSON file
   * @param {any} data - Data to save
   * @param {string} filepath - Output file path
   * @returns {Promise<boolean>} - Success status
   */
  static async saveJson(data, filepath) {
    try {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error saving JSON: ${error.message}`);
      return false;
    }
  }

  /**
   * Save records to JSONL file (one JSON object per line)
   * @param {Array<Object>} records - Array of records
   * @param {string} filepath - Output file path
   * @returns {Promise<boolean>} - Success status
   */
  static async saveJsonl(records, filepath) {
    try {
      const lines = records.map(record => JSON.stringify(record)).join('\n');
      await fs.writeFile(filepath, lines + '\n', 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error saving JSONL: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse CSV data from DuckDB export
   * @param {string} csvFilepath - Path to CSV file
   * @returns {Promise<Array<Object>>} - Array of parsed records
   */
  static async loadCsv(csvFilepath) {
    try {
      const content = await fs.readFile(csvFilepath, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length < 2) return [];

      const headers = lines[0].split(',');
      const records = lines.slice(1).map(line => {
        const values = line.split(',');
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        return record;
      });

      return records;
    } catch (error) {
      console.error(`Error loading CSV: ${error.message}`);
      return [];
    }
  }
}


// Example usage
async function main() {
  try {
    // Initialize processor
    const processor = new DuckDBProcessor();
    await processor.initialize();

    // Example: Analyze MCP logs
    const mcpAnalyzer = new MCPPayloadAnalyzer(processor);
    // const performance = await mcpAnalyzer.analyzeMethodPerformance('mcp_requests.json');
    // console.log('MCP Performance:', performance);

    // Example: Analyze Pandora payloads
    const pandoraAnalyzer = new PandoraPayloadAnalyzer(processor);
    // const progress = await pandoraAnalyzer.analyzeSprintProgress('sprints.json');
    // console.log('Sprint Progress:', progress);

    // const velocity = await pandoraAnalyzer.calculateVelocity('work_items.json');
    // console.log('Velocity:', velocity);

    await processor.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export classes for use as module
export { DuckDBProcessor, MCPPayloadAnalyzer, PandoraPayloadAnalyzer, JSONExporter };

// Run example if executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main();
// }
