-- =============================================================================
-- pandora-schema.sql — Custom tables in DevLake MySQL for Pandora metrics
-- Applied automatically by pandora-devlake-collector on first run
-- DevLake database: lake (MySQL 8.0)
-- =============================================================================

-- Agent runs pushed from Pandora API via DevLake webhook collector
CREATE TABLE IF NOT EXISTS pandora_agent_runs (
    id              VARCHAR(36)     NOT NULL PRIMARY KEY,
    project_id      VARCHAR(36)     NOT NULL,
    agent_name      VARCHAR(200)    NOT NULL DEFAULT '',
    entry_point     VARCHAR(500)    NOT NULL DEFAULT '',
    model_name      VARCHAR(120)    NOT NULL DEFAULT '',
    status          VARCHAR(50)     NOT NULL DEFAULT '',
    success         TINYINT(1)      NOT NULL DEFAULT 1,
    tokens_input    INT             NOT NULL DEFAULT 0,
    tokens_output   INT             NOT NULL DEFAULT 0,
    latency_ms      BIGINT          NOT NULL DEFAULT 0,
    cost_usd        DECIMAL(10,6)   NOT NULL DEFAULT 0.000000,
    environment     VARCHAR(50)     NOT NULL DEFAULT 'production',
    error_message   TEXT,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at     DATETIME,
    INDEX idx_par_project_model (project_id, model_name),
    INDEX idx_par_created_at (created_at),
    INDEX idx_par_agent_name (agent_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Human evaluations for agent run outputs
CREATE TABLE IF NOT EXISTS pandora_human_evaluations (
    id                  VARCHAR(36)     NOT NULL PRIMARY KEY,
    agent_run_id        VARCHAR(36)     NOT NULL,
    reviewer_id         VARCHAR(200)    NOT NULL DEFAULT '',
    accuracy_score      FLOAT           NOT NULL DEFAULT 0,
    relevance_score     FLOAT           NOT NULL DEFAULT 0,
    completeness_score  FLOAT           NOT NULL DEFAULT 0,
    safety_score        FLOAT           NOT NULL DEFAULT 0,
    score               FLOAT           NOT NULL DEFAULT 0,
    feedback_text       TEXT,
    requires_escalation TINYINT(1)      NOT NULL DEFAULT 0,
    review_time_seconds BIGINT          NOT NULL DEFAULT 0,
    submitted_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_run_id) REFERENCES pandora_agent_runs(id) ON DELETE CASCADE,
    INDEX idx_phe_agent_run (agent_run_id),
    INDEX idx_phe_submitted_at (submitted_at),
    INDEX idx_phe_reviewer (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pandora sprint metrics (velocity, burndown data)
CREATE TABLE IF NOT EXISTS pandora_sprint_metrics (
    id              VARCHAR(36)     NOT NULL PRIMARY KEY,
    project_id      VARCHAR(36)     NOT NULL,
    sprint_id       VARCHAR(36)     NOT NULL,
    sprint_name     VARCHAR(300)    NOT NULL DEFAULT '',
    start_date      DATE,
    end_date        DATE,
    total_items     INT             NOT NULL DEFAULT 0,
    done_items      INT             NOT NULL DEFAULT 0,
    total_points    INT             NOT NULL DEFAULT 0,
    done_points     INT             NOT NULL DEFAULT 0,
    velocity        FLOAT           NOT NULL DEFAULT 0,
    completion_rate FLOAT           NOT NULL DEFAULT 0,
    synced_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sprint (project_id, sprint_id),
    INDEX idx_psm_project (project_id),
    INDEX idx_psm_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
