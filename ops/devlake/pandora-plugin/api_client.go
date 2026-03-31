package pandoraplugin

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// HTTPClient is an interface for making HTTP requests (allows mocking in tests).
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

// PandoraClient fetches data from the Pandora API.
type PandoraClient struct {
	BaseURL    string
	HTTPClient HTTPClient
}

// NewPandoraClient creates a PandoraClient with a default 30s timeout.
func NewPandoraClient(baseURL string) *PandoraClient {
	return &PandoraClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *PandoraClient) get(path string, out interface{}) error {
	req, err := http.NewRequest(http.MethodGet, c.BaseURL+path, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("doing request %s: %w", path, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API %s returned %d: %s", path, resp.StatusCode, string(body))
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("decoding response from %s: %w", path, err)
	}
	return nil
}

// GetProjects returns all projects.
func (c *PandoraClient) GetProjects() ([]PandoraProject, error) {
	var result []PandoraProject
	if err := c.get("/api/projects", &result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetBacklogItems returns backlog items for a project.
func (c *PandoraClient) GetBacklogItems(projectID string) ([]PandoraBacklogItem, error) {
	var result []PandoraBacklogItem
	path := fmt.Sprintf("/api/projects/%s/backlog", projectID)
	if err := c.get(path, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetSprints returns sprints for a project.
func (c *PandoraClient) GetSprints(projectID string) ([]PandoraSprint, error) {
	var result []PandoraSprint
	path := fmt.Sprintf("/api/projects/%s/sprints", projectID)
	if err := c.get(path, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetWorkItems returns work items for a project (optionally filtered by sprint).
func (c *PandoraClient) GetWorkItems(projectID string, sprintID string) ([]PandoraWorkItem, error) {
	var result []PandoraWorkItem
	path := fmt.Sprintf("/api/projects/%s/workitems", projectID)
	if sprintID != "" {
		path += "?sprintId=" + sprintID
	}
	if err := c.get(path, &result); err != nil {
		return nil, err
	}
	return result, nil
}
