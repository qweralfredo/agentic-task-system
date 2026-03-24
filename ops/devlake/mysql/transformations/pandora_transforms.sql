-- =============================================================================
-- pandora_transforms.sql — Transformation views for Grafana dashboards (BL-18)
-- Normaliza dados Pandora → schema compatível com DevLake para visualização
-- =============================================================================

-- View: Sprint velocity + burndown aggregated
CREATE OR REPLACE VIEW `v_pandora_sprint_velocity` AS
SELECT
  sm.sprint_id,
  sm.project_id,
  sm.sprint_name,
  sm.start_date,
  sm.end_date,
  sm.total_points,
  sm.done_points,
  sm.in_progress_pts,
  sm.velocity,
  sm.completion_rate,
  sm.total_workitems,
  sm.done_workitems,
  DATEDIFF(sm.end_date, sm.start_date) + 1     AS sprint_days,
  sm.done_points / NULLIF(DATEDIFF(sm.end_date, sm.start_date) + 1, 0)
                                                AS points_per_day,
  sm.collected_at
FROM `pandora_sprint_metrics` sm;

-- View: Model performance aggregated by day
CREATE OR REPLACE VIEW `v_pandora_model_performance` AS
SELECT
  DATE(arm.started_at)                          AS metric_date,
  arm.project_id,
  arm.model_name,
  COUNT(*)                                      AS total_runs,
  SUM(arm.success)                              AS successful_runs,
  ROUND(AVG(CASE WHEN arm.success = 1 THEN 1 ELSE 0 END) * 100, 2)
                                                AS success_rate_pct,
  SUM(arm.tokens_input)                         AS total_tokens_input,
  SUM(arm.tokens_output)                        AS total_tokens_output,
  SUM(arm.tokens_total)                         AS total_tokens,
  ROUND(SUM(arm.cost_usd), 6)                   AS total_cost_usd,
  ROUND(AVG(arm.cost_usd), 6)                   AS avg_cost_per_run,
  ROUND(AVG(arm.latency_ms), 0)                 AS avg_latency_ms,
  ROUND(
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY arm.latency_ms)
    OVER (PARTITION BY DATE(arm.started_at), arm.model_name),
    0
  )                                             AS p50_latency_ms,
  ROUND(
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY arm.latency_ms)
    OVER (PARTITION BY DATE(arm.started_at), arm.model_name),
    0
  )                                             AS p95_latency_ms
FROM `pandora_agent_run_metrics` arm
GROUP BY DATE(arm.started_at), arm.project_id, arm.model_name;

-- View: Human evaluation quality summary by day and category
CREATE OR REPLACE VIEW `v_pandora_eval_quality` AS
SELECT
  he.eval_date,
  he.project_id,
  COUNT(*)                                      AS total_evaluations,
  ROUND(AVG(he.accuracy_score) * 5, 2)          AS avg_accuracy,
  ROUND(AVG(he.relevance_score) * 5, 2)         AS avg_relevance,
  ROUND(AVG(he.completeness_score) * 5, 2)      AS avg_completeness,
  ROUND(AVG(he.safety_score) * 5, 2)            AS avg_safety,
  -- Weighted composite (accuracy 30% + relevance 25% + completeness 25% + safety 20%)
  ROUND(
    (AVG(he.accuracy_score) * 0.30 +
     AVG(he.relevance_score) * 0.25 +
     AVG(he.completeness_score) * 0.25 +
     AVG(he.safety_score) * 0.20) * 5, 2
  )                                             AS avg_composite_score,
  SUM(he.requires_escalation)                   AS escalation_count,
  ROUND(AVG(he.review_time_sec) / 60, 1)        AS avg_review_minutes,
  COUNT(DISTINCT he.reviewer_id)                AS active_reviewers
FROM `pandora_human_eval_summary` he
GROUP BY he.eval_date, he.project_id;

-- View: Cost analytics daily rollup (for Grafana token cost dashboard)
CREATE OR REPLACE VIEW `v_pandora_cost_daily` AS
SELECT
  arm.run_date                                  AS metric_date,
  arm.project_id,
  arm.model_name,
  arm.environment,
  COUNT(*)                                      AS run_count,
  SUM(arm.tokens_total)                         AS total_tokens,
  ROUND(SUM(arm.cost_usd), 4)                   AS total_cost_usd,
  ROUND(SUM(arm.cost_usd) / NULLIF(COUNT(*), 0), 6) AS cost_per_run,
  ROUND(SUM(arm.cost_usd) / NULLIF(SUM(arm.tokens_total), 0) * 1000, 6)
                                                AS cost_per_1k_tokens
FROM `pandora_agent_run_metrics` arm
GROUP BY arm.run_date, arm.project_id, arm.model_name, arm.environment;
