-- =============================================================================
-- 01_pandora_schema.sql — Custom Pandora tables in DevLake MySQL (BL-18)
-- Aplicar em: devlake-mysql, banco `lake`
-- Idempotente: usa IF NOT EXISTS / ON DUPLICATE KEY
-- =============================================================================

-- Sprint velocity & burndown metrics (from Pandora API)
CREATE TABLE IF NOT EXISTS `pandora_sprint_metrics` (
  `id`               VARCHAR(36)    NOT NULL,
  `sprint_id`        VARCHAR(36)    NOT NULL,
  `project_id`       VARCHAR(36)    NOT NULL,
  `sprint_name`      VARCHAR(255)   NOT NULL DEFAULT '',
  `start_date`       DATE           NOT NULL,
  `end_date`         DATE           NOT NULL,
  `total_points`     INT            NOT NULL DEFAULT 0,
  `done_points`      INT            NOT NULL DEFAULT 0,
  `in_progress_pts`  INT            NOT NULL DEFAULT 0,
  `velocity`         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `completion_rate`  DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  `total_workitems`  INT            NOT NULL DEFAULT 0,
  `done_workitems`   INT            NOT NULL DEFAULT 0,
  `collected_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sprint_metrics` (`sprint_id`),
  KEY `idx_project_sprint` (`project_id`, `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent run metrics (synced from Pandora PostgreSQL)
CREATE TABLE IF NOT EXISTS `pandora_agent_run_metrics` (
  `id`              VARCHAR(36)    NOT NULL,
  `project_id`      VARCHAR(36)    NOT NULL,
  `agent_name`      VARCHAR(255)   NOT NULL,
  `model_name`      VARCHAR(120)   NOT NULL DEFAULT '',
  `tokens_input`    INT            NOT NULL DEFAULT 0,
  `tokens_output`   INT            NOT NULL DEFAULT 0,
  `tokens_total`    INT            GENERATED ALWAYS AS (`tokens_input` + `tokens_output`) STORED,
  `cost_usd`        DECIMAL(10,6)  NOT NULL DEFAULT 0.000000,
  `latency_ms`      BIGINT         NOT NULL DEFAULT 0,
  `success`         TINYINT(1)     NOT NULL DEFAULT 1,
  `error_message`   TEXT,
  `environment`     VARCHAR(50)    NOT NULL DEFAULT 'production',
  `started_at`      DATETIME       NOT NULL,
  `finished_at`     DATETIME,
  `run_date`        DATE           GENERATED ALWAYS AS (DATE(`started_at`)) STORED,
  `collected_at`    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_agent_date` (`project_id`, `agent_name`, `run_date`),
  KEY `idx_model_date` (`model_name`, `run_date`),
  KEY `idx_started_at` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Human evaluation summary (aggregated per agent run)
CREATE TABLE IF NOT EXISTS `pandora_human_eval_summary` (
  `id`                  VARCHAR(36)   NOT NULL,
  `agent_run_id`        VARCHAR(36)   NOT NULL,
  `project_id`          VARCHAR(36)   NOT NULL,
  `reviewer_id`         VARCHAR(200)  NOT NULL,
  `accuracy_score`      FLOAT         NOT NULL DEFAULT 0,
  `relevance_score`     FLOAT         NOT NULL DEFAULT 0,
  `completeness_score`  FLOAT         NOT NULL DEFAULT 0,
  `safety_score`        FLOAT         NOT NULL DEFAULT 0,
  `composite_score`     FLOAT         NOT NULL DEFAULT 0,
  `requires_escalation` TINYINT(1)    NOT NULL DEFAULT 0,
  `review_time_sec`     BIGINT        NOT NULL DEFAULT 0,
  `submitted_at`        DATETIME      NOT NULL,
  `eval_date`           DATE          GENERATED ALWAYS AS (DATE(`submitted_at`)) STORED,
  `collected_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_run_reviewer` (`agent_run_id`, `reviewer_id`),
  KEY `idx_eval_date` (`eval_date`),
  KEY `idx_project_eval` (`project_id`, `submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Metric type registry (maps Pandora metrics → DevLake metric types)
CREATE TABLE IF NOT EXISTS `pandora_etl_registry` (
  `metric_type`   VARCHAR(100) NOT NULL,
  `source_table`  VARCHAR(100) NOT NULL,
  `target_table`  VARCHAR(100) NOT NULL,
  `description`   VARCHAR(500) NOT NULL DEFAULT '',
  `schedule_cron` VARCHAR(50)  NOT NULL DEFAULT '0 */6 * * *',
  `last_synced`   DATETIME,
  `enabled`       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`metric_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed metric registry
INSERT INTO `pandora_etl_registry`
  (`metric_type`, `source_table`, `target_table`, `description`, `schedule_cron`)
VALUES
  ('sprint_velocity',    'pandora_sprint_metrics',     'pandora_sprint_metrics',     'Sprint velocity e burndown por sprint',           '0 */2 * * *'),
  ('agent_run_cost',     'pandora_agent_run_metrics',  'pandora_agent_run_metrics',  'Custo e tokens por agent run',                    '*/30 * * * *'),
  ('human_evaluation',   'pandora_human_eval_summary', 'pandora_human_eval_summary', 'Scores de avaliação humana de outputs de IA',     '0 * * * *'),
  ('github_pr_metrics',  'pull_requests',              'pull_requests',              'PRs, lead time, review cycles via DevLake GitHub', '0 */6 * * *'),
  ('dora_deployment',    'cicd_deployments',           'cicd_deployments',           'DORA deployment frequency e lead time',            '0 */6 * * *'),
  ('code_review_kpi',    'pull_request_comments',      'pull_request_comments',      'KPIs de code review: tempo, cycles, churn',        '0 */6 * * *')
ON DUPLICATE KEY UPDATE
  `description`   = VALUES(`description`),
  `schedule_cron` = VALUES(`schedule_cron`);
