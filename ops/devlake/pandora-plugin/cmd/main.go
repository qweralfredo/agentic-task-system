package main

import (
	"log"
	"os"
	"strconv"

	pandoraplugin "github.com/qweralfredo/agentic-task-system/devlake-pandora-plugin"
)

func main() {
	pandoraURL := getenv("PANDORA_API_URL", "http://pandora-api:5000")
	devlakeURL := getenv("DEVLAKE_URL", "http://devlake:8080")
	webhookID := getenv("DEVLAKE_WEBHOOK_ID", "1")
	projectID := getenv("PANDORA_PROJECT_ID", "")
	pollSec, _ := strconv.Atoi(getenv("POLL_INTERVAL_SEC", "300"))

	if projectID == "" {
		log.Fatal("[pandora-plugin] FATAL: PANDORA_PROJECT_ID is required")
	}

	cfg := pandoraplugin.CollectorConfig{
		PandoraAPIURL:   pandoraURL,
		DevLakeURL:      devlakeURL,
		WebhookID:       webhookID,
		ProjectID:       projectID,
		PollIntervalSec: pollSec,
	}

	log.Printf("[pandora-plugin] Starting — project=%s, poll=%ds, devlake=%s",
		projectID, pollSec, devlakeURL)

	collector := pandoraplugin.NewCollector(cfg)
	collector.Run() // blocks forever
}

func getenv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
