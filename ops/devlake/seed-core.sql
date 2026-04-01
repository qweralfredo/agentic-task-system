-- DevLake core tables seed (separated to avoid generated column issues)
SET @now = NOW();
SET @project_id = 'fb17358f-c4fa-478a-8827-57e4ede73f94';

-- repos
INSERT IGNORE INTO repos (id, name, url, created_date, updated_date) VALUES
('github:GithubRepo:1:qweralfredo/todolist', 'todolist', 'https://github.com/qweralfredo/todolist', DATE_SUB(@now, INTERVAL 30 DAY), @now);

-- projects
INSERT IGNORE INTO projects (name, description, created_at, updated_at) VALUES
('Todolist', 'Pandora Todo List — agentic task management', DATE_SUB(@now, INTERVAL 30 DAY), @now);

-- project_mapping (backtick escape `table`)
INSERT IGNORE INTO project_mapping (project_name, `table`, row_id) VALUES
('Todolist', 'repos', 'github:GithubRepo:1:qweralfredo/todolist');

-- commits
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

-- pull_requests
INSERT IGNORE INTO pull_requests (id, base_repo_id, head_repo_id, status, original_status, title, description, url, author_name, author_id, parent_pr_id, pull_request_key, created_date, merged_date, closed_date, type, component, merge_commit_sha, base_ref, head_ref) VALUES
('pr-001', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: DevLake Infrastructure', 'BL-01', 'https://github.com/qweralfredo/todolist/pull/1', 'Alfredo', 'user-1', '', 1, DATE_SUB(@now, INTERVAL 12 DAY), DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY), 'FEATURE', '', 'c003', 'main', 'feat/devlake'),
('pr-002', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Token Analytics', 'BL-07', 'https://github.com/qweralfredo/todolist/pull/2', 'Alfredo', 'user-1', '', 2, DATE_SUB(@now, INTERVAL 10 DAY), DATE_SUB(@now, INTERVAL 9 DAY), DATE_SUB(@now, INTERVAL 9 DAY), 'FEATURE', '', 'c005', 'main', 'feat/tokens'),
('pr-003', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Human Eval Board', 'BL-11', 'https://github.com/qweralfredo/todolist/pull/3', 'Alfredo', 'user-1', '', 3, DATE_SUB(@now, INTERVAL 8 DAY), DATE_SUB(@now, INTERVAL 7 DAY), DATE_SUB(@now, INTERVAL 7 DAY), 'FEATURE', '', 'c007', 'main', 'feat/human-eval'),
('pr-004', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Auth RBAC', 'BL-14', 'https://github.com/qweralfredo/todolist/pull/4', 'Alfredo', 'user-1', '', 4, DATE_SUB(@now, INTERVAL 6 DAY), DATE_SUB(@now, INTERVAL 5 DAY), DATE_SUB(@now, INTERVAL 5 DAY), 'FEATURE', '', 'c009', 'main', 'feat/auth'),
('pr-005', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: E2E Tests', 'BL-19', 'https://github.com/qweralfredo/todolist/pull/5', 'Alfredo', 'user-1', '', 5, DATE_SUB(@now, INTERVAL 4 DAY), DATE_SUB(@now, INTERVAL 3 DAY), DATE_SUB(@now, INTERVAL 3 DAY), 'FEATURE', '', 'c011', 'main', 'feat/e2e'),
('pr-006', 'github:GithubRepo:1:qweralfredo/todolist', 'github:GithubRepo:1:qweralfredo/todolist', 'MERGED', 'merged', 'feat: Code Quality', 'BL-09', 'https://github.com/qweralfredo/todolist/pull/6', 'Alfredo', 'user-1', '', 6, DATE_SUB(@now, INTERVAL 2 DAY), DATE_SUB(@now, INTERVAL 1 DAY), DATE_SUB(@now, INTERVAL 1 DAY), 'FEATURE', '', 'c012', 'main', 'feat/quality');

-- cicd_deployments
INSERT IGNORE INTO cicd_deployments (id, cicd_scope_id, name, result, status, original_result, original_status, environment, created_date, started_date, finished_date, duration_sec, queued_duration_sec) VALUES
('dep-001', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy DevLake', 'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 11 DAY), 180, 15),
('dep-002', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Tokens',  'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 9 DAY),  DATE_SUB(@now, INTERVAL 9 DAY),  DATE_SUB(@now, INTERVAL 9 DAY),  145, 12),
('dep-003', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Eval',    'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 7 DAY),  DATE_SUB(@now, INTERVAL 7 DAY),  DATE_SUB(@now, INTERVAL 7 DAY),  160, 10),
('dep-004', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Auth',    'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 5 DAY),  DATE_SUB(@now, INTERVAL 5 DAY),  DATE_SUB(@now, INTERVAL 5 DAY),  130, 8),
('dep-005', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy E2E',     'FAILURE', 'DONE', 'failure', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 3 DAY),  DATE_SUB(@now, INTERVAL 3 DAY),  DATE_SUB(@now, INTERVAL 3 DAY),  95,  5),
('dep-006', 'github:GithubRepo:1:qweralfredo/todolist', 'Deploy Quality', 'SUCCESS', 'DONE', 'success', 'completed', 'PRODUCTION', DATE_SUB(@now, INTERVAL 1 DAY),  DATE_SUB(@now, INTERVAL 1 DAY),  DATE_SUB(@now, INTERVAL 1 DAY),  155, 11);

-- issues
INSERT IGNORE INTO issues (id, url, icon_url, issue_key, title, description, epic_key, type, original_type, status, original_status, story_point, resolution_date, created_date, updated_date, lead_time_minutes, parent_issue_id, priority, original_estimate_minutes, time_spent_minutes, time_remaining_minutes, creator_id, creator_name, assignee_id, assignee_name, severity, component, original_project) VALUES
('iss-001', '', '', 'BL-01', 'DevLake Infrastructure', '', '', 'TASK', 'story', 'DONE', 'done', 8, DATE_SUB(@now, INTERVAL 11 DAY), DATE_SUB(@now, INTERVAL 14 DAY), @now, 4320, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-002', '', '', 'BL-07', 'Token Cost Analytics', '', '', 'TASK', 'story', 'DONE', 'done', 5, DATE_SUB(@now, INTERVAL 9 DAY), DATE_SUB(@now, INTERVAL 12 DAY), @now, 4320, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-003', '', '', 'BL-11', 'Human Evaluation Board', '', '', 'TASK', 'story', 'DONE', 'done', 5, DATE_SUB(@now, INTERVAL 7 DAY), DATE_SUB(@now, INTERVAL 10 DAY), @now, 4320, '', 'P1', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-004', '', '', 'BL-14', 'Auth RBAC', '', '', 'TASK', 'story', 'DONE', 'done', 3, DATE_SUB(@now, INTERVAL 5 DAY), DATE_SUB(@now, INTERVAL 8 DAY), @now, 4320, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-005', '', '', 'BL-19', 'E2E Testing Suite', '', '', 'TASK', 'story', 'DONE', 'done', 8, DATE_SUB(@now, INTERVAL 3 DAY), DATE_SUB(@now, INTERVAL 6 DAY), @now, 4320, '', 'P1', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-006', '', '', 'BL-09', 'Code Quality Dashboard', '', '', 'TASK', 'story', 'DONE', 'done', 3, DATE_SUB(@now, INTERVAL 1 DAY), DATE_SUB(@now, INTERVAL 4 DAY), @now, 4320, '', 'P2', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist'),
('iss-007', '', '', 'BL-21', 'Fix Grafana Integration', '', '', 'BUG', 'bug', 'IN_PROGRESS', 'in_progress', 5, NULL, @now, @now, 0, '', 'P0', 0, 0, 0, 'user-1', 'Alfredo', 'user-1', 'Alfredo', '', '', 'Todolist');

SELECT 'Core seed complete!' AS status,
  (SELECT COUNT(*) FROM commits) AS commits,
  (SELECT COUNT(*) FROM pull_requests) AS prs,
  (SELECT COUNT(*) FROM cicd_deployments) AS deployments,
  (SELECT COUNT(*) FROM issues) AS issues;
