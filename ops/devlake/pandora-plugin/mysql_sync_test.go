package pandoraplugin

import (
	"testing"
	"time"
)

func TestComputeSprintMetrics_AllDone(t *testing.T) {
	now := time.Now()
	sprint := PandoraSprint{
		ID:        "sp-1",
		ProjectID: "p-1",
		Name:      "Sprint 1",
		StartDate: now.Add(-14 * 24 * time.Hour),
		EndDate:   now,
	}
	backlogItems := []PandoraBacklogItem{
		{ID: "bl-1", ProjectID: "p-1", StoryPoints: 5},
		{ID: "bl-2", ProjectID: "p-1", StoryPoints: 3},
	}
	workItems := []PandoraWorkItem{
		{ID: "wi-1", SprintID: "sp-1", BacklogItemID: "bl-1", Status: 3},
		{ID: "wi-2", SprintID: "sp-1", BacklogItemID: "bl-2", Status: 3},
	}

	m := ComputeSprintMetrics(sprint, workItems, backlogItems)

	if m.TotalItems != 2 {
		t.Errorf("expected TotalItems=2, got %d", m.TotalItems)
	}
	if m.DoneItems != 2 {
		t.Errorf("expected DoneItems=2, got %d", m.DoneItems)
	}
	if m.TotalPoints != 8 {
		t.Errorf("expected TotalPoints=8, got %d", m.TotalPoints)
	}
	if m.DonePoints != 8 {
		t.Errorf("expected DonePoints=8, got %d", m.DonePoints)
	}
	if m.CompletionRate != 100.0 {
		t.Errorf("expected CompletionRate=100, got %f", m.CompletionRate)
	}
	if m.Velocity <= 0 {
		t.Errorf("expected Velocity>0, got %f", m.Velocity)
	}
}

func TestComputeSprintMetrics_PartiallyDone(t *testing.T) {
	now := time.Now()
	sprint := PandoraSprint{
		ID:        "sp-2",
		ProjectID: "p-1",
		Name:      "Sprint 2",
		StartDate: now.Add(-7 * 24 * time.Hour),
		EndDate:   now,
	}
	backlogItems := []PandoraBacklogItem{
		{ID: "bl-1", ProjectID: "p-1", StoryPoints: 5},
		{ID: "bl-2", ProjectID: "p-1", StoryPoints: 3},
		{ID: "bl-3", ProjectID: "p-1", StoryPoints: 8},
	}
	workItems := []PandoraWorkItem{
		{ID: "wi-1", SprintID: "sp-2", BacklogItemID: "bl-1", Status: 3}, // done
		{ID: "wi-2", SprintID: "sp-2", BacklogItemID: "bl-2", Status: 1}, // in progress
		{ID: "wi-3", SprintID: "sp-2", BacklogItemID: "bl-3", Status: 0}, // todo
	}

	m := ComputeSprintMetrics(sprint, workItems, backlogItems)

	if m.TotalItems != 3 {
		t.Errorf("expected TotalItems=3, got %d", m.TotalItems)
	}
	if m.DoneItems != 1 {
		t.Errorf("expected DoneItems=1, got %d", m.DoneItems)
	}
	if m.TotalPoints != 16 {
		t.Errorf("expected TotalPoints=16, got %d", m.TotalPoints)
	}
	if m.DonePoints != 5 {
		t.Errorf("expected DonePoints=5, got %d", m.DonePoints)
	}
	rate := m.CompletionRate
	if rate < 33.0 || rate > 34.0 {
		t.Errorf("expected CompletionRate≈33.3, got %f", rate)
	}
}

func TestComputeSprintMetrics_EmptySprint(t *testing.T) {
	now := time.Now()
	sprint := PandoraSprint{
		ID:        "sp-empty",
		ProjectID: "p-1",
		Name:      "Empty Sprint",
		StartDate: now.Add(-7 * 24 * time.Hour),
		EndDate:   now,
	}

	m := ComputeSprintMetrics(sprint, []PandoraWorkItem{}, []PandoraBacklogItem{})

	if m.TotalItems != 0 {
		t.Errorf("expected TotalItems=0, got %d", m.TotalItems)
	}
	if m.CompletionRate != 0 {
		t.Errorf("expected CompletionRate=0, got %f", m.CompletionRate)
	}
}

func TestComputeSprintMetrics_IDFormat(t *testing.T) {
	now := time.Now()
	sprint := PandoraSprint{
		ID:        "sprint-abc",
		ProjectID: "proj-xyz",
		StartDate: now.Add(-14 * 24 * time.Hour),
		EndDate:   now,
	}

	m := ComputeSprintMetrics(sprint, []PandoraWorkItem{}, []PandoraBacklogItem{})

	expected := "proj-xyz-sprint-abc"
	if m.ID != expected {
		t.Errorf("expected ID=%s, got %s", expected, m.ID)
	}
	if m.ProjectID != "proj-xyz" {
		t.Errorf("expected ProjectID=proj-xyz, got %s", m.ProjectID)
	}
}
