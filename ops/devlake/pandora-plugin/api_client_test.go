package pandoraplugin

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

// mockHTTPClient implements HTTPClient for testing.
type mockHTTPClient struct {
	responses map[string]*http.Response
	err       error
}

func (m *mockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	if m.err != nil {
		return nil, m.err
	}
	path := req.URL.Path
	if resp, ok := m.responses[path]; ok {
		return resp, nil
	}
	return &http.Response{
		StatusCode: 404,
		Body:       io.NopCloser(strings.NewReader(`{"error":"not found"}`)),
	}, nil
}

func newMockResponse(status int, body interface{}) *http.Response {
	b, _ := json.Marshal(body)
	return &http.Response{
		StatusCode: status,
		Body:       io.NopCloser(strings.NewReader(string(b))),
	}
}

func TestGetProjects_Success(t *testing.T) {
	projects := []PandoraProject{
		{ID: "p1", Name: "Project One", CreatedAt: time.Now()},
	}
	client := &PandoraClient{
		BaseURL: "http://localhost:5000",
		HTTPClient: &mockHTTPClient{
			responses: map[string]*http.Response{
				"/api/projects": newMockResponse(200, projects),
			},
		},
	}

	result, err := client.GetProjects()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 1 {
		t.Errorf("expected 1 project, got %d", len(result))
	}
	if result[0].ID != "p1" {
		t.Errorf("expected project ID p1, got %s", result[0].ID)
	}
}

func TestGetProjects_HTTPError(t *testing.T) {
	client := &PandoraClient{
		BaseURL: "http://localhost:5000",
		HTTPClient: &mockHTTPClient{
			responses: map[string]*http.Response{
				"/api/projects": newMockResponse(500, map[string]string{"error": "internal"}),
			},
		},
	}

	_, err := client.GetProjects()
	if err == nil {
		t.Fatal("expected error for 500 response, got nil")
	}
}

func TestGetBacklogItems_Success(t *testing.T) {
	items := []PandoraBacklogItem{
		{ID: "bl-1", ProjectID: "p1", Title: "Backlog Item 1", Priority: 2},
		{ID: "bl-2", ProjectID: "p1", Title: "Backlog Item 2", Priority: 1},
	}
	client := &PandoraClient{
		BaseURL: "http://localhost:5000",
		HTTPClient: &mockHTTPClient{
			responses: map[string]*http.Response{
				"/api/projects/p1/backlog": newMockResponse(200, items),
			},
		},
	}

	result, err := client.GetBacklogItems("p1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 items, got %d", len(result))
	}
}

func TestGetSprints_Success(t *testing.T) {
	now := time.Now()
	sprints := []PandoraSprint{
		{ID: "sp-1", ProjectID: "p1", Name: "Sprint 1", StartDate: now, EndDate: now.Add(14 * 24 * time.Hour)},
	}
	client := &PandoraClient{
		BaseURL: "http://localhost:5000",
		HTTPClient: &mockHTTPClient{
			responses: map[string]*http.Response{
				"/api/projects/p1/sprints": newMockResponse(200, sprints),
			},
		},
	}

	result, err := client.GetSprints("p1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 1 || result[0].ID != "sp-1" {
		t.Errorf("unexpected sprint result: %+v", result)
	}
}

func TestGetWorkItems_Success(t *testing.T) {
	items := []PandoraWorkItem{
		{ID: "wi-1", ProjectID: "p1", Title: "Task 1", Status: 1},
		{ID: "wi-2", ProjectID: "p1", Title: "Task 2", Status: 3},
	}
	client := &PandoraClient{
		BaseURL: "http://localhost:5000",
		HTTPClient: &mockHTTPClient{
			responses: map[string]*http.Response{
				"/api/projects/p1/workitems": newMockResponse(200, items),
			},
		},
	}

	result, err := client.GetWorkItems("p1", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 work items, got %d", len(result))
	}
}
