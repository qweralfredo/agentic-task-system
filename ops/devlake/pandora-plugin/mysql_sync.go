package pandoraplugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// SprintMetrics summarizes a sprint for DevLake MySQL.
type SprintMetrics struct {
	ID             string    `json:"id"`
	ProjectID      string    `json:"project_id"`
	SprintID       string    `json:"sprint_id"`
	SprintName     string    `json:"sprint_name"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	TotalItems     int       `json:"total_items"`
	DoneItems      int       `json:"done_items"`
	TotalPoints    int       `json:"total_points"`
	DonePoints     int       `json:"done_points"`
	Velocity       float64   `json:"velocity"`
	CompletionRate float64   `json:"completion_rate"`
}

// ComputeSprintMetrics computes sprint velocity and completion from work items.
func ComputeSprintMetrics(sprint PandoraSprint, items []PandoraWorkItem, backlogItems []PandoraBacklogItem) SprintMetrics {
	pointMap := map[string]int{}
	for _, b := range backlogItems {
		pointMap[b.ID] = b.StoryPoints
	}

	var doneItems, totalPoints, donePoints int
	for _, wi := range items {
		if wi.SprintID == sprint.ID {
			pts := pointMap[wi.BacklogItemID]
			totalPoints += pts
			if wi.Status == 3 { // Done
				doneItems++
				donePoints += pts
			}
		}
	}

	total := len(items)
	var completionRate, velocity float64
	if total > 0 {
		completionRate = float64(doneItems) / float64(total) * 100
	}
	durationDays := sprint.EndDate.Sub(sprint.StartDate).Hours() / 24
	if durationDays > 0 {
		velocity = float64(donePoints) / (durationDays / 7) // points per week
	}

	return SprintMetrics{
		ID:             fmt.Sprintf("%s-%s", sprint.ProjectID, sprint.ID),
		ProjectID:      sprint.ProjectID,
		SprintID:       sprint.ID,
		SprintName:     sprint.Name,
		StartDate:      sprint.StartDate,
		EndDate:        sprint.EndDate,
		TotalItems:     total,
		DoneItems:      doneItems,
		TotalPoints:    totalPoints,
		DonePoints:     donePoints,
		Velocity:       velocity,
		CompletionRate: completionRate,
	}
}

// AgentRunPayload represents an agent run record for the pandora_agent_runs MySQL table.
type AgentRunPayload struct {
	ID           string    `json:"id"`
	ProjectID    string    `json:"project_id"`
	AgentName    string    `json:"agent_name"`
	EntryPoint   string    `json:"entry_point"`
	ModelName    string    `json:"model_name"`
	Status       string    `json:"status"`
	Success      bool      `json:"success"`
	TokensInput  int       `json:"tokens_input"`
	TokensOutput int       `json:"tokens_output"`
	LatencyMs    int64     `json:"latency_ms"`
	CostUsd      float64   `json:"cost_usd"`
	Environment  string    `json:"environment"`
	ErrorMessage string    `json:"error_message"`
	CreatedAt    time.Time `json:"created_at"`
	StartedAt    time.Time `json:"started_at"`
	FinishedAt   *time.Time `json:"finished_at,omitempty"`
}

// PandoraSyncClient pushes Pandora-specific data to DevLake's webhook
// using custom events that the collector maps to pandora_* tables.
type PandoraSyncClient struct {
	WebhookClient *DevLakeWebhookClient
}

// PushAgentRun pushes an agent run as a custom deployment event.
// The DevLake webhook's /deployments endpoint is the closest fit.
func (s *PandoraSyncClient) PushAgentRun(run AgentRunPayload) error {
	result := "SUCCESS"
	if !run.Success {
		result = "FAILURE"
	}
	dep := DevLakeDeployment{
		ID:           run.ID,
		Result:       result,
		StartedDate:  run.StartedAt,
		FinishedDate: func() time.Time {
			if run.FinishedAt != nil {
				return *run.FinishedAt
			}
			return run.StartedAt
		}(),
		DisplayTitle: fmt.Sprintf("%s — %s", run.AgentName, run.EntryPoint),
		RefName:      run.Environment,
		Environment:  run.Environment,
	}
	return s.WebhookClient.PushDeployment(dep)
}

// PushJSON is a generic helper to post any payload to a DevLake webhook endpoint.
func (s *PandoraSyncClient) PushJSON(endpoint string, payload interface{}) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshaling: %w", err)
	}

	url := fmt.Sprintf("%s/api/plugins/webhook/%s/%s",
		s.WebhookClient.BaseURL, s.WebhookClient.WebhookID, endpoint)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.WebhookClient.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("posting: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("endpoint %s returned %d", endpoint, resp.StatusCode)
	}
	return nil
}
