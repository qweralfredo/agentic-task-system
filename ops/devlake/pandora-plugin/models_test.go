package pandoraplugin

import (
	"testing"
	"time"
)

func TestPriorityLabel(t *testing.T) {
	tests := []struct {
		input    int
		expected string
	}{
		{0, "LOW"},
		{1, "MEDIUM"},
		{2, "HIGH"},
		{3, "CRITICAL"},
		{99, "MEDIUM"}, // unknown defaults to MEDIUM
	}
	for _, tt := range tests {
		got := PriorityLabel(tt.input)
		if got != tt.expected {
			t.Errorf("PriorityLabel(%d) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestStatusLabel(t *testing.T) {
	tests := []struct {
		input    int
		expected string
	}{
		{0, "TODO"},
		{1, "IN_PROGRESS"},
		{2, "IN_REVIEW"},
		{3, "DONE"},
		{4, "BLOCKED"},
		{99, "TODO"},
	}
	for _, tt := range tests {
		got := StatusLabel(tt.input)
		if got != tt.expected {
			t.Errorf("StatusLabel(%d) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestMapWorkItemToIssue(t *testing.T) {
	now := time.Now()
	wi := PandoraWorkItem{
		ID:          "wi-001",
		ProjectID:   "proj-001",
		Title:       "Implement feature X",
		Description: "A test work item",
		Assignee:    "alice",
		Status:      1, // IN_PROGRESS
		CreatedAt:   now.Add(-24 * time.Hour),
		UpdatedAt:   now,
	}

	issue := MapWorkItemToIssue(wi, "myproject")

	if issue.IssueKey != "wi-001" {
		t.Errorf("expected IssueKey=wi-001, got %s", issue.IssueKey)
	}
	if issue.BoardKey != "myproject" {
		t.Errorf("expected BoardKey=myproject, got %s", issue.BoardKey)
	}
	if issue.Status != "IN_PROGRESS" {
		t.Errorf("expected Status=IN_PROGRESS, got %s", issue.Status)
	}
	if issue.AssigneeName != "alice" {
		t.Errorf("expected AssigneeName=alice, got %s", issue.AssigneeName)
	}
	if issue.ResolutionDate != nil {
		t.Error("expected ResolutionDate=nil for non-done item")
	}
}

func TestMapWorkItemToIssue_Done(t *testing.T) {
	now := time.Now()
	wi := PandoraWorkItem{
		ID:        "wi-002",
		Status:    3, // DONE
		CreatedAt: now.Add(-48 * time.Hour),
		UpdatedAt: now,
	}

	issue := MapWorkItemToIssue(wi, "myproject")

	if issue.Status != "DONE" {
		t.Errorf("expected Status=DONE, got %s", issue.Status)
	}
	if issue.ResolutionDate == nil {
		t.Error("expected ResolutionDate to be set for done item")
	}
}
