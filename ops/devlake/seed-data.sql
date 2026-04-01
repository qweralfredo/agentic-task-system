-- =============================================================================
-- DevLake MySQL Seed — Pandora Todolist Real Data
-- Populates: pandora_agent_runs, pandora_agent_run_metrics,
--            pandora_human_evaluations, pandora_sprint_metrics,
--            issues, pull_requests, commits, cicd_deployments, repos, projects
-- =============================================================================

SET @project_id = 'fb17358f-c4fa-478a-8827-57e4ede73f94';
SET @now = NOW();

-- Clear old test data
DELETE FROM pandora_agent_run_metrics WHERE project_id != @project_id;
DELETE FROM pandora_agent_run_metrics WHERE project_id = @project_id;
DELETE FROM pandora_human_evaluations;
DELETE FROM pandora_sprint_metrics;
-- Workaround for MySQL 8.0 strict mode with STORED generated columns
SET @old_sql_mode = @@sql_mode;

-- ─── pandora_agent_run_metrics (base table — pandora_agent_runs is a VIEW on this) ──
INSERT INTO pandora_agent_run_metrics (id, project_id, agent_name, model_name, tokens_input, tokens_output, cost_usd, latency_ms, success, error_message, environment, started_at, finished_at) VALUES
('ar-001', @project_id, 'Antigravity',   'claude-opus-4-6',   3200, 2100, 0.1200, 1150, 1, '', 'production', DATE_SUB(@now, INTERVAL 1 DAY),  DATE_SUB(@now, INTERVAL 1 DAY)),
('ar-002', @project_id, 'Antigravity',   'claude-opus-4-6',   2800, 1900, 0.1050, 980,  1, '', 'production', DATE_SUB(@now, INTERVAL 1 DAY),  DATE_SUB(@now, INTERVAL 1 DAY)),
('ar-003', @project_id, 'Antigravity',   'claude-opus-4-6',   4100, 2800, 0.1580, 1320, 0, 'Timeout on large file analysis', 'production', DATE_SUB(@now, INTERVAL 2 DAY),  DATE_SUB(@now, INTERVAL 2 DAY)),
('ar-004', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1500, 980,  0.0350, 420,  1, '', 'production', DATE_SUB(@now, INTERVAL 2 DAY),  DATE_SUB(@now, INTERVAL 2 DAY)),
('ar-005', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1200, 850,  0.0280, 380,  1, '', 'production', DATE_SUB(@now, INTERVAL 3 DAY),  DATE_SUB(@now, INTERVAL 3 DAY)),
('ar-006', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1800, 1100, 0.0420, 460,  1, '', 'production', DATE_SUB(@now, INTERVAL 3 DAY),  DATE_SUB(@now, INTERVAL 3 DAY)),
('ar-007', @project_id, 'Antigravity',   'claude-haiku-4-5',  600,  400,  0.0040, 180,  1, '', 'production', DATE_SUB(@now, INTERVAL 4 DAY),  DATE_SUB(@now, INTERVAL 4 DAY)),
('ar-008', @project_id, 'Antigravity',   'claude-haiku-4-5',  750,  500,  0.0050, 200,  1, '', 'production', DATE_SUB(@now, INTERVAL 4 DAY),  DATE_SUB(@now, INTERVAL 4 DAY)),
('ar-009', @project_id, 'Antigravity',   'claude-haiku-4-5',  900,  550,  0.0060, 210,  1, '', 'production', DATE_SUB(@now, INTERVAL 5 DAY),  DATE_SUB(@now, INTERVAL 5 DAY)),
('ar-010', @project_id, 'Antigravity',   'claude-opus-4-6',   3500, 2300, 0.1350, 1080, 1, '', 'production', DATE_SUB(@now, INTERVAL 5 DAY),  DATE_SUB(@now, INTERVAL 5 DAY)),
('ar-011', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1600, 1050, 0.0380, 440,  1, '', 'production', DATE_SUB(@now, INTERVAL 6 DAY),  DATE_SUB(@now, INTERVAL 6 DAY)),
('ar-012', @project_id, 'Antigravity',   'claude-opus-4-6',   2900, 2000, 0.1100, 1200, 0, 'Rate limit exceeded', 'production', DATE_SUB(@now, INTERVAL 7 DAY),  DATE_SUB(@now, INTERVAL 7 DAY)),
('ar-013', @project_id, 'Antigravity',   'gpt-4o',            2200, 1400, 0.0800, 650,  1, '', 'production', DATE_SUB(@now, INTERVAL 7 DAY),  DATE_SUB(@now, INTERVAL 7 DAY)),
('ar-014', @project_id, 'Antigravity',   'gpt-4o',            2000, 1300, 0.0720, 700,  1, '', 'production', DATE_SUB(@now, INTERVAL 8 DAY),  DATE_SUB(@now, INTERVAL 8 DAY)),
('ar-015', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1400, 900,  0.0310, 400,  1, '', 'production', DATE_SUB(@now, INTERVAL 8 DAY),  DATE_SUB(@now, INTERVAL 8 DAY)),
('ar-016', @project_id, 'Antigravity',   'claude-haiku-4-5',  500,  350,  0.0030, 170,  1, '', 'production', DATE_SUB(@now, INTERVAL 9 DAY),  DATE_SUB(@now, INTERVAL 9 DAY)),
('ar-017', @project_id, 'Antigravity',   'claude-opus-4-6',   3800, 2500, 0.1450, 1100, 1, '', 'production', DATE_SUB(@now, INTERVAL 9 DAY),  DATE_SUB(@now, INTERVAL 9 DAY)),
('ar-018', @project_id, 'Antigravity',   'gpt-4o',            1900, 1200, 0.0680, 620,  1, '', 'production', DATE_SUB(@now, INTERVAL 10 DAY), DATE_SUB(@now, INTERVAL 10 DAY)),
('ar-019', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1700, 1100, 0.0400, 450,  0, 'Incomplete generation', 'production', DATE_SUB(@now, INTERVAL 10 DAY), DATE_SUB(@now, INTERVAL 10 DAY)),
('ar-020', @project_id, 'Antigravity',   'claude-opus-4-6',   3100, 2100, 0.1180, 1050, 1, '', 'production', DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY)),
('ar-021', @project_id, 'Antigravity',   'claude-haiku-4-5',  680,  420,  0.0045, 190,  1, '', 'production', DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY)),
('ar-022', @project_id, 'Antigravity',   'gpt-4o',            2500, 1600, 0.0900, 680,  1, '', 'production', DATE_SUB(@now, INTERVAL 12 DAY), DATE_SUB(@now, INTERVAL 12 DAY)),
('ar-023', @project_id, 'Antigravity',   'claude-sonnet-4-6', 1300, 800,  0.0290, 390,  1, '', 'production', DATE_SUB(@now, INTERVAL 12 DAY), DATE_SUB(@now, INTERVAL 12 DAY)),
('ar-024', @project_id, 'Antigravity',   'claude-opus-4-6',   3600, 2400, 0.1400, 1180, 1, '', 'production', DATE_SUB(@now, INTERVAL 13 DAY), DATE_SUB(@now, INTERVAL 13 DAY)),
('ar-025', @project_id, 'Antigravity',   'claude-haiku-4-5',  550,  380,  0.0035, 175,  1, '', 'production', DATE_SUB(@now, INTERVAL 13 DAY), DATE_SUB(@now, INTERVAL 13 DAY));

-- ─── pandora_human_evaluations (8 reviews) ──────────────────────────────────
INSERT INTO pandora_human_evaluations (id, agent_run_id, project_id, reviewer_id, score, accuracy_score, relevance_score, completeness_score, safety_score, notes, requires_escalation, review_time_seconds, submitted_at, collected_at) VALUES
('he-001', 'ar-001', @project_id, 'reviewer-alice', 4.50, 4.8, 4.3, 4.5, 5.0, 'Excelente implementação do módulo DevLake', 0, 320, DATE_SUB(@now, INTERVAL 1 DAY), @now),
('he-002', 'ar-004', @project_id, 'reviewer-bob',   3.80, 4.0, 3.5, 3.8, 4.2, 'Bom mas code review poderia ser mais detalhado', 0, 240, DATE_SUB(@now, INTERVAL 2 DAY), @now),
('he-003', 'ar-003', @project_id, 'reviewer-alice', 2.50, 2.0, 2.8, 2.5, 4.5, 'Falhou nos testes — requer correção', 1, 180, DATE_SUB(@now, INTERVAL 2 DAY), @now),
('he-004', 'ar-010', @project_id, 'reviewer-carol', 4.20, 4.5, 4.0, 4.2, 4.8, 'Boa integração com a API Pandora', 0, 280, DATE_SUB(@now, INTERVAL 5 DAY), @now),
('he-005', 'ar-013', @project_id, 'reviewer-bob',   3.50, 3.8, 3.2, 3.5, 4.0, 'Output verboso mas funcional', 0, 200, DATE_SUB(@now, INTERVAL 7 DAY), @now),
('he-006', 'ar-017', @project_id, 'reviewer-alice', 4.80, 5.0, 4.5, 4.8, 5.0, 'Implementação exemplar com testes completos', 0, 350, DATE_SUB(@now, INTERVAL 9 DAY), @now),
('he-007', 'ar-019', @project_id, 'reviewer-carol', 2.20, 2.0, 2.5, 2.0, 3.8, 'Falhou — saída incompleta, escalação necessária', 1, 150, DATE_SUB(@now, INTERVAL 10 DAY), @now),
('he-008', 'ar-024', @project_id, 'reviewer-bob',   4.00, 4.2, 3.8, 4.0, 4.5, 'Refactor bem executado', 0, 260, DATE_SUB(@now, INTERVAL 13 DAY), @now);

-- ─── pandora_sprint_metrics (5 sprints) ─────────────────────────────────────
INSERT INTO pandora_sprint_metrics (id, sprint_id, project_id, sprint_name, start_date, end_date, total_points, done_points, in_progress_pts, velocity, completion_rate, total_workitems, done_workitems, collected_at) VALUES
('sm-001', 'sp-12', @project_id, 'SP-12 Auth & RBAC',           '2026-03-15', '2026-03-20', 13, 13, 0, 13.0, 100.0, 8,  8,  @now),
('sm-002', 'sp-13', @project_id, 'SP-13 Bidirectional Sync',    '2026-03-20', '2026-03-25', 8,  8,  0, 8.0,  100.0, 5,  5,  @now),
('sm-003', 'sp-14', @project_id, 'SP-14 E2E Testing Suite',     '2026-03-25', '2026-03-30', 13, 13, 0, 13.0, 100.0, 12, 12, @now),
('sm-004', 'sp-15', @project_id, 'SP-15 Validação E2E Residual','2026-03-30', '2026-04-01', 5,  5,  0, 5.0,  100.0, 1,  1,  @now),
('sm-005', 'sp-16', @project_id, 'SP-16 Fix DevLake Integration','2026-03-31', '2026-04-01', 5,  0,  5, 0.0,  0.0,   3,  0,  @now);


-- ─── DevLake core tables: repos ─────────────────────────────────────────────
INSERT IGNORE INTO repos (id, name, url, created_date, updated_date) VALUES
('github:GithubRepo:1:qweralfredo/todolist', 'todolist', 'https://github.com/qweralfredo/todolist', DATE_SUB(@now, INTERVAL 30 DAY), @now);

-- ─── DevLake core tables: projects ──────────────────────────────────────────
INSERT IGNORE INTO projects (name, description, created_at, updated_at) VALUES
('Todolist', 'Pandora Todo List — agentic task management', DATE_SUB(@now, INTERVAL 30 DAY), @now);

INSERT IGNORE INTO project_mapping (project_name, table, row_id) VALUES
('Todolist', 'repos', 'github:GithubRepo:1:qweralfredo/todolist');

-- ─── commits (20 commits over 14 days) ──────────────────────────────────────
INSERT IGNORE INTO commits (sha, additions, deletions, dev_eq, message, author_name, author_email, authored_date, committer_name, committer_email, committed_date, author_id) VALUES
('c001', 120, 30, 150, 'feat: implement DevLake infrastructure', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 13 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 13 DAY), 'user-1'),
('c002', 85,  20, 105, 'feat: add Grafana dashboards provisioning', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 12 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 12 DAY), 'user-1'),
('c003', 200, 45, 245, 'feat: implement token analytics pipeline', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 11 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 11 DAY), 'user-1'),
('c004', 150, 60, 210, 'feat: add human evaluation board', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 10 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 10 DAY), 'user-1'),
('c005', 95,  25, 120, 'feat: implement DORA metrics endpoints', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 9 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 9 DAY), 'user-1'),
('c006', 180, 40, 220, 'feat: add ML model performance tracking', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 8 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 8 DAY), 'user-1'),
('c007', 60,  15, 75,  'feat: implement SSE real-time stream', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 7 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 7 DAY), 'user-1'),
('c008', 110, 35, 145, 'feat: add auth RBAC with API keys', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 6 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 6 DAY), 'user-1'),
('c009', 75,  20, 95,  'feat: implement bidirectional sync worker', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 5 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 5 DAY), 'user-1'),
('c010', 250, 80, 330, 'feat: add E2E Playwright test suite', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 4 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 4 DAY), 'user-1'),
('c011', 40,  10, 50,  'fix: correct token-summary calculation', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 3 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 3 DAY), 'user-1'),
('c012', 90,  25, 115, 'feat: add Code Quality dashboard', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 2 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 2 DAY), 'user-1'),
('c013', 55,  12, 67,  'fix(devlake-plugin): build target ./cmd', 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 1 DAY), 'Alfredo', 'alfredo@dev.com', DATE_SUB(@now, INTERVAL 1 DAY), 'user-1');

INSERT IGNORE INTO repo_commits (repo_id, commit_sha) VALUES
('github:GithubRepo:1:qweralfredo/todolist', 'c001'),
('github:GithubRepo:1:qweralfredo/todolist', 'c002'),
('github:GithubRepo:1:qweralfredo/todolist', 'c003'),
('github:GithubRepo:1:qweralfredo/todolist', 'c004'),
('github:GithubRepo:1:qweralfredo/todolist', 'c005'),
('github:GithubRepo:1:qweralfredo/todolist', 'c006'),
('github:GithubRepo:1:qweralfredo/todolist', 'c007'),
('github:GithubRepo:1:qweralfredo/todolist', 'c008'),
('github:GithubRepo:1:qweralfredo/todolist', 'c009'),
('github:GithubRepo:1:qweralfredo/todolist', 'c010'),
('github:GithubRepo:1:qweralfredo/todolist', 'c011'),
('github:GithubRepo:1:qweralfredo/todolist', 'c012'),
('github:GithubRepo:1:qweralfredo/todolist', 'c013');

-- ─── pull_requests (8 PRs) ──────────────────────────────────────────────────
INSERT IGNORE INTO pull_requests (id, base_repo_id, head_repo_id, status, original_status, title, description, url, author_name, author_id, parent_pr_id, pull_request_key, created_date, merged_date, closed_date, type, component, additions, deletions, merge_commit_sha, base_ref, head_ref) VALUES
('pr-001', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: DevLake Infrastructure', 'BL-01 implementation', 'https://github.com/qweralfredo/todolist/pull/1', 'Alfredo', 'user-1', '', 1, DATE_SUB(@now, INTERVAL 12 DAY), DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY), 'FEATURE', '', 320, 50, 'c003', 'main', 'feat/devlake-integration'),
('pr-002', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Token Analytics Pipeline', 'BL-07 token cost', 'https://github.com/qweralfredo/todolist/pull/2', 'Alfredo', 'user-1', '', 2, DATE_SUB(@now, INTERVAL 10 DAY), DATE_SUB(@now, INTERVAL 9 DAY), DATE_SUB(@now, INTERVAL 9 DAY), 'FEATURE', '', 200, 45, 'c005', 'main', 'feat/token-analytics'),
('pr-003', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Human Evaluation Board', 'BL-11', 'https://github.com/qweralfredo/todolist/pull/3', 'Alfredo', 'user-1', '', 3, DATE_SUB(@now, INTERVAL 8 DAY), DATE_SUB(@now, INTERVAL 7 DAY), DATE_SUB(@now, INTERVAL 7 DAY), 'FEATURE', '', 180, 40, 'c007', 'main', 'feat/human-eval'),
('pr-004', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Auth RBAC', 'BL-14', 'https://github.com/qweralfredo/todolist/pull/4', 'Alfredo', 'user-1', '', 4, DATE_SUB(@now, INTERVAL 6 DAY), DATE_SUB(@now, INTERVAL 5 DAY), DATE_SUB(@now, INTERVAL 5 DAY), 'FEATURE', '', 110, 35, 'c009', 'main', 'feat/auth-rbac'),
('pr-005', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: E2E Testing Suite', 'BL-19', 'https://github.com/qweralfredo/todolist/pull/5', 'Alfredo', 'user-1', '', 5, DATE_SUB(@now, INTERVAL 4 DAY), DATE_SUB(@now, INTERVAL 3 DAY), DATE_SUB(@now, INTERVAL 3 DAY), 'FEATURE', '', 250, 80, 'c011', 'main', 'feat/e2e-testing'),
('pr-006', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Code Quality Dashboard', 'BL-09', 'https://github.com/qweralfredo/todolist/pull/6', 'Alfredo', 'user-1', '', 6, DATE_SUB(@now, INTERVAL 2 DAY), DATE_SUB(@now, INTERVAL 1 DAY), DATE_SUB(@now, INTERVAL 1 DAY), 'FEATURE', '', 90, 25, 'c012', 'main', 'feat/code-quality'),
('pr-007', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'fix: DevLake plugin Dockerfile', '', 'https://github.com/qweralfredo/todolist/pull/7', 'Alfredo', 'user-1', '', 7, DATE_SUB(@now, INTERVAL 1 DAY), @now, @now, 'BUG', '', 3, 2, 'c013', 'main', 'fix/devlake-build'),
('pr-008', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'OPEN', 'open', 'feat: Fix Grafana Integration', 'BL-21', 'https://github.com/qweralfredo/todolist/pull/8', 'Alfredo', 'user-1', '', 8, @now, NULL, NULL, 'FEATURE', '', 50, 20, '', 'main', 'feat/fix-grafana');

-- ─── cicd_deployments (6 deployments) ───────────────────────────────────────
INSERT IGNORE INTO cicd_deployments (id, cicd_scope_id, name, result, status, original_result, original_status, environment, created_date, started_date, finished_date, duration_sec, queued_duration_sec) VALUES
('dep-001', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy DevLake Stack',       'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY), 180, 15),
('dep-002', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Token Analytics',     'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 9 DAY),  DATE_SUB(@now, INTERVAL 9 DAY),  DATE_SUB(@now, INTERVAL 9 DAY),  145, 12),
('dep-003', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Human Eval',          'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 7 DAY),  DATE_SUB(@now, INTERVAL 7 DAY),  DATE_SUB(@now, INTERVAL 7 DAY),  160, 10),
('dep-004', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Auth RBAC',           'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 5 DAY),  DATE_SUB(@now, INTERVAL 5 DAY),  DATE_SUB(@now, INTERVAL 5 DAY),  130, 8),
('dep-005', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy E2E Suite',           'FAILURE', 'DONE', 'failure', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 3 DAY),  DATE_SUB(@now, INTERVAL 3 DAY),  DATE_SUB(@now, INTERVAL 3 DAY),  95,  5),
('dep-006', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Code Quality',        'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 1 DAY),  DATE_SUB(@now, INTERVAL 1 DAY),  DATE_SUB(@now, INTERVAL 1 DAY),  155, 11);

-- ─── issues (10 issues tracked via webhook) ─────────────────────────────────
INSERT IGNORE INTO issues (id, url, icon_url, issue_key, title, description, epic_key, type, original_type, status, original_status, story_point, resolution_date, created_date, updated_date, lead_time_minutes, parent_issue_id, priority, original_estimate_minutes, time_spent_minutes, time_remaining_minutes, creator_id, creator_name, assignee_id, assignee_name, severity, component, original_project) VALUES
('iss-001', '', '', 'BL-01', 'DevLake Infrastructure', '', '', 'TASK', 'story', 'DONE', 'done', 8, DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 14 DAY), @now, 4320, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-002', '', '', 'BL-07', 'Token & Cost Analytics', '', '', 'TASK', 'story', 'DONE', 'done', 5, DATE_SUB(@now, INTERVAL 9 DAY), DATE_SUB(@now, INTERVAL 12 DAY), @now, 4320, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-003', '', '', 'BL-11', 'Human Evaluation Board', '', '', 'TASK', 'story', 'DONE', 'done', 5, DATE_SUB(@now, INTERVAL 7 DAY), DATE_SUB(@now, INTERVAL 10 DAY), @now, 4320, '', 'P1', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-004', '', '', 'BL-14', 'Auth & RBAC', '', '', 'TASK', 'story', 'DONE', 'done', 3, DATE_SUB(@now, INTERVAL 5 DAY), DATE_SUB(@now, INTERVAL 8 DAY), @now, 4320, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-005', '', '', 'BL-19', 'E2E Testing Suite', '', '', 'TASK', 'story', 'DONE', 'done', 8, DATE_SUB(@now, INTERVAL 3 DAY), DATE_SUB(@now, INTERVAL 6 DAY), @now, 4320, '', 'P1', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-006', '', '', 'BL-09', 'Code Quality Dashboard', '', '', 'TASK', 'story', 'DONE', 'done', 3, DATE_SUB(@now, INTERVAL 1 DAY), DATE_SUB(@now, INTERVAL 4 DAY), @now, 4320, '', 'P2', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-007', '', '', 'BL-21', 'Fix Grafana Integration', '', '', 'BUG', 'bug', 'IN_PROGRESS', 'in_progress', 5, NULL, @now, @now, 0, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist');

SELECT 'Seed completed!' AS status,
  (SELECT COUNT(*) FROM pandora_agent_runs WHERE project_id = @project_id) AS agent_runs,
  (SELECT COUNT(*) FROM pandora_human_evaluations) AS evaluations,
  (SELECT COUNT(*) FROM pandora_sprint_metrics) AS sprint_metrics,
  (SELECT COUNT(*) FROM commits) AS total_commits,
  (SELECT COUNT(*) FROM pull_requests) AS total_prs,
  (SELECT COUNT(*) FROM cicd_deployments) AS total_deployments,
  (SELECT COUNT(*) FROM issues) AS total_issues;
