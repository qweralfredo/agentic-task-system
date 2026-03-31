package pandoraplugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// DevLakeWebhookClient pushes collected data to DevLake via webhook.
type DevLakeWebhookClient struct {
	BaseURL    string
	WebhookID  string
	HTTPClient HTTPClient
}

// NewDevLakeWebhookClient creates a client for DevLake's webhook plugin.
func NewDevLakeWebhookClient(baseURL, webhookID string) *DevLakeWebhookClient {
	return &DevLakeWebhookClient{
		BaseURL:   baseURL,
		WebhookID: webhookID,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (d *DevLakeWebhookClient) post(endpoint string, payload interface{}) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshaling payload: %w", err)
	}

	url := fmt.Sprintf("%s/api/plugins/webhook/%s/%s", d.BaseURL, d.WebhookID, endpoint)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := d.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("posting to %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook %s returned %d", endpoint, resp.StatusCode)
	}
	return nil
}

// PushIssue sends a single issue to DevLake.
func (d *DevLakeWebhookClient) PushIssue(issue DevLakeIssue) error {
	return d.post("issues", issue)
}

// PushDeployment sends a deployment event to DevLake.
func (d *DevLakeWebhookClient) PushDeployment(dep DevLakeDeployment) error {
	return d.post("deployments", dep)
}

// Collector orchestrates data collection from Pandora and pushing to DevLake.
type Collector struct {
	Pandora   *PandoraClient
	DevLake   *DevLakeWebhookClient
	Config    CollectorConfig
}

// NewCollector creates a Collector with the given config.
func NewCollector(cfg CollectorConfig) *Collector {
	return &Collector{
		Pandora: NewPandoraClient(cfg.PandoraAPIURL),
		DevLake: NewDevLakeWebhookClient(cfg.DevLakeURL, cfg.WebhookID),
		Config:  cfg,
	}
}

// CollectOnce runs a single collection cycle for the configured project.
func (c *Collector) CollectOnce() error {
	log.Printf("[pandora-plugin] Starting collection for project %s", c.Config.ProjectID)

	projects, err := c.Pandora.GetProjects()
	if err != nil {
		return fmt.Errorf("fetching projects: %w", err)
	}

	var projectName string
	for _, p := range projects {
		if p.ID == c.Config.ProjectID {
			projectName = p.Name
			break
		}
	}
	if projectName == "" {
		projectName = c.Config.ProjectID
	}

	// Collect work items and push as DevLake issues
	workItems, err := c.Pandora.GetWorkItems(c.Config.ProjectID, "")
	if err != nil {
		return fmt.Errorf("fetching work items: %w", err)
	}

	pushed := 0
	errors := 0
	for _, wi := range workItems {
		issue := MapWorkItemToIssue(wi, projectName)
		if err := c.DevLake.PushIssue(issue); err != nil {
			log.Printf("[pandora-plugin] WARN: failed to push issue %s: %v", wi.ID, err)
			errors++
		} else {
			pushed++
		}
	}

	log.Printf("[pandora-plugin] Collection done: %d pushed, %d errors (project=%s)",
		pushed, errors, c.Config.ProjectID)
	return nil
}

// Run starts the collector loop, collecting every PollIntervalSec seconds.
func (c *Collector) Run() {
	ticker := time.NewTicker(time.Duration(c.Config.PollIntervalSec) * time.Second)
	defer ticker.Stop()

	// Run immediately on start
	if err := c.CollectOnce(); err != nil {
		log.Printf("[pandora-plugin] ERROR: initial collection failed: %v", err)
	}

	for range ticker.C {
		if err := c.CollectOnce(); err != nil {
			log.Printf("[pandora-plugin] ERROR: collection failed: %v", err)
		}
	}
}

// CollectStats holds results from a collection cycle.
type CollectStats struct {
	WorkItemsPushed   int
	WorkItemsErrored  int
	SprintsFound      int
	BacklogItemsFound int
}

// CollectAndReport runs collection and returns statistics (used in tests).
func (c *Collector) CollectAndReport() (CollectStats, error) {
	var stats CollectStats

	backlogItems, err := c.Pandora.GetBacklogItems(c.Config.ProjectID)
	if err != nil {
		return stats, fmt.Errorf("fetching backlog: %w", err)
	}
	stats.BacklogItemsFound = len(backlogItems)

	sprints, err := c.Pandora.GetSprints(c.Config.ProjectID)
	if err != nil {
		return stats, fmt.Errorf("fetching sprints: %w", err)
	}
	stats.SprintsFound = len(sprints)

	workItems, err := c.Pandora.GetWorkItems(c.Config.ProjectID, "")
	if err != nil {
		return stats, fmt.Errorf("fetching work items: %w", err)
	}

	projects, _ := c.Pandora.GetProjects()
	var projectName string
	for _, p := range projects {
		if p.ID == c.Config.ProjectID {
			projectName = p.Name
		}
	}

	for _, wi := range workItems {
		issue := MapWorkItemToIssue(wi, projectName)
		if err := c.DevLake.PushIssue(issue); err != nil {
			stats.WorkItemsErrored++
		} else {
			stats.WorkItemsPushed++
		}
	}

	return stats, nil
}
