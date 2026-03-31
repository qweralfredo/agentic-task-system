package pandoraplugin

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

// mockWebhookClient records calls to PushIssue/PushDeployment.
type mockWebhookClient struct {
	issueCalls      []DevLakeIssue
	deploymentCalls []DevLakeDeployment
	failIssues      bool
}

func (m *mockWebhookClient) Do(req *http.Request) (*http.Response, error) {
	if m.failIssues && strings.Contains(req.URL.Path, "issues") {
		return &http.Response{
			StatusCode: 500,
			Body:       io.NopCloser(strings.NewReader(`{"error":"server error"}`)),
		}, nil
	}
	// Decode the issue from body and record it
	var issue DevLakeIssue
	if err := json.NewDecoder(req.Body).Decode(&issue); err == nil {
		m.issueCalls = append(m.issueCalls, issue)
	}
	return &http.Response{
		StatusCode: 200,
		Body:       io.NopCloser(strings.NewReader(`{}`)),
	}, nil
}

func makeTestCollector(pandoraMock *mockHTTPClient, webhookMock *mockWebhookClient) *Collector {
	pandoraClient := &PandoraClient{
		BaseURL:    "http://localhost:5000",
		HTTPClient: pandoraMock,
	}
	webhookClient := &DevLakeWebhookClient{
		BaseURL:    "http://localhost:8082",
		WebhookID:  "1",
		HTTPClient: webhookMock,
	}
	return &Collector{
		Pandora: pandoraClient,
		DevLake: webhookClient,
		Config: CollectorConfig{
			ProjectID:       "p1",
			PollIntervalSec: 60,
		},
	}
}

func TestCollector_CollectAndReport_Success(t *testing.T) {
	now := time.Now()
	projects := []PandoraProject{{ID: "p1", Name: "My Project"}}
	backlogItems := []PandoraBacklogItem{
		{ID: "bl-1", ProjectID: "p1", Title: "BL 1"},
		{ID: "bl-2", ProjectID: "p1", Title: "BL 2"},
	}
	sprints := []PandoraSprint{
		{ID: "sp-1", ProjectID: "p1", Name: "Sprint 1", StartDate: now, EndDate: now.Add(14 * 24 * time.Hour)},
	}
	workItems := []PandoraWorkItem{
		{ID: "wi-1", ProjectID: "p1", Title: "Task 1", Status: 1, CreatedAt: now, UpdatedAt: now},
		{ID: "wi-2", ProjectID: "p1", Title: "Task 2", Status: 3, CreatedAt: now, UpdatedAt: now},
	}

	pandoraMock := &mockHTTPClient{
		responses: map[string]*http.Response{
			"/api/projects":          newMockResponse(200, projects),
			"/api/projects/p1/backlog":    newMockResponse(200, backlogItems),
			"/api/projects/p1/sprints":    newMockResponse(200, sprints),
			"/api/projects/p1/workitems":  newMockResponse(200, workItems),
		},
	}
	webhookMock := &mockWebhookClient{}

	c := makeTestCollector(pandoraMock, webhookMock)
	stats, err := c.CollectAndReport()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats.BacklogItemsFound != 2 {
		t.Errorf("expected 2 backlog items, got %d", stats.BacklogItemsFound)
	}
	if stats.SprintsFound != 1 {
		t.Errorf("expected 1 sprint, got %d", stats.SprintsFound)
	}
	if stats.WorkItemsPushed != 2 {
		t.Errorf("expected 2 work items pushed, got %d", stats.WorkItemsPushed)
	}
	if stats.WorkItemsErrored != 0 {
		t.Errorf("expected 0 errors, got %d", stats.WorkItemsErrored)
	}
}

func TestCollector_CollectAndReport_PushError(t *testing.T) {
	now := time.Now()
	projects := []PandoraProject{{ID: "p1", Name: "My Project"}}
	backlogItems := []PandoraBacklogItem{{ID: "bl-1"}}
	sprints := []PandoraSprint{{ID: "sp-1"}}
	workItems := []PandoraWorkItem{
		{ID: "wi-1", Status: 1, CreatedAt: now, UpdatedAt: now},
	}

	pandoraMock := &mockHTTPClient{
		responses: map[string]*http.Response{
			"/api/projects":               newMockResponse(200, projects),
			"/api/projects/p1/backlog":    newMockResponse(200, backlogItems),
			"/api/projects/p1/sprints":    newMockResponse(200, sprints),
			"/api/projects/p1/workitems":  newMockResponse(200, workItems),
		},
	}
	webhookMock := &mockWebhookClient{failIssues: true}

	c := makeTestCollector(pandoraMock, webhookMock)
	stats, err := c.CollectAndReport()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if stats.WorkItemsPushed != 0 {
		t.Errorf("expected 0 pushed on error, got %d", stats.WorkItemsPushed)
	}
	if stats.WorkItemsErrored != 1 {
		t.Errorf("expected 1 error, got %d", stats.WorkItemsErrored)
	}
}

func TestCollector_CollectAndReport_PandoraDown(t *testing.T) {
	pandoraMock := &mockHTTPClient{
		responses: map[string]*http.Response{
			"/api/projects/p1/backlog": newMockResponse(503, map[string]string{"error": "down"}),
		},
	}
	webhookMock := &mockWebhookClient{}

	c := makeTestCollector(pandoraMock, webhookMock)
	_, err := c.CollectAndReport()
	if err == nil {
		t.Fatal("expected error when Pandora API is down, got nil")
	}
}

func TestDevLakeWebhookClient_PushIssue(t *testing.T) {
	webhookMock := &mockWebhookClient{}
	client := &DevLakeWebhookClient{
		BaseURL:    "http://localhost:8082",
		WebhookID:  "1",
		HTTPClient: webhookMock,
	}

	issue := DevLakeIssue{
		IssueKey: "wi-test",
		Title:    "Test Issue",
		Status:   "TODO",
	}

	if err := client.PushIssue(issue); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(webhookMock.issueCalls) != 1 {
		t.Errorf("expected 1 issue call, got %d", len(webhookMock.issueCalls))
	}
}
