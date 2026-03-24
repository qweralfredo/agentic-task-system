package pandoraplugin

import "time"

// PandoraProject represents a project from the Pandora API.
type PandoraProject struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	MainBranch  string    `json:"mainBranch"`
	GitHubURL   string    `json:"gitHubUrl"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PandoraBacklogItem represents a backlog item from the Pandora API.
type PandoraBacklogItem struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"projectId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Priority    int       `json:"priority"` // 0=Low,1=Medium,2=High,3=Critical
	StoryPoints int       `json:"storyPoints"`
	Tags        string    `json:"tags"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PandoraSprint represents a sprint from the Pandora API.
type PandoraSprint struct {
	ID           string    `json:"id"`
	ProjectID    string    `json:"projectId"`
	Name         string    `json:"name"`
	Goal         string    `json:"goal"`
	StartDate    time.Time `json:"startDate"`
	EndDate      time.Time `json:"endDate"`
	Status       int       `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
}

// PandoraWorkItem represents a work item (task) from the Pandora API.
type PandoraWorkItem struct {
	ID                string    `json:"id"`
	ProjectID         string    `json:"projectId"`
	SprintID          string    `json:"sprintId"`
	BacklogItemID     string    `json:"backlogItemId"`
	ParentWorkItemID  string    `json:"parentWorkItemId"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	Assignee          string    `json:"assignee"`
	Status            int       `json:"status"` // 0=Todo,1=InProgress,2=Review,3=Done,4=Blocked
	Branch            string    `json:"branch"`
	Tags              string    `json:"tags"`
	TotalTokensSpent  int       `json:"totalTokensSpent"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// DevLakeIssue maps a Pandora WorkItem to a DevLake webhook issue event.
type DevLakeIssue struct {
	BoardKey        string    `json:"board_key"`
	URL             string    `json:"url"`
	IssueKey        string    `json:"issue_key"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	EpicKey         string    `json:"epic_key"`
	Type            string    `json:"type"`
	Status          string    `json:"status"`
	OriginalStatus  string    `json:"original_status"`
	StoryPoint      float64   `json:"story_point"`
	Priority        string    `json:"priority"`
	CreatedDate     time.Time `json:"created_date"`
	UpdatedDate     time.Time `json:"updated_date"`
	ResolutionDate  *time.Time `json:"resolution_date,omitempty"`
	CreatorName     string    `json:"creator_name"`
	AssigneeName    string    `json:"assignee_name"`
}

// DevLakeDeployment maps a Pandora agent run to a DevLake deployment event.
type DevLakeDeployment struct {
	ID           string    `json:"id"`
	Result       string    `json:"result"` // SUCCESS, FAILURE, ABORT, MANUAL
	StartedDate  time.Time `json:"startedDate"`
	FinishedDate time.Time `json:"finishedDate"`
	DisplayTitle string    `json:"displayTitle"`
	RefName      string    `json:"refName"`
	RepoURL      string    `json:"repoUrl"`
	Environment  string    `json:"environment"`
}

// CollectorConfig holds configuration for the Pandora collector.
type CollectorConfig struct {
	PandoraAPIURL  string
	DevLakeURL     string
	WebhookID      string
	ProjectID      string
	PollIntervalSec int
	PageSize       int
}

// PriorityLabel converts Pandora priority int to a readable label.
func PriorityLabel(p int) string {
	switch p {
	case 0:
		return "LOW"
	case 1:
		return "MEDIUM"
	case 2:
		return "HIGH"
	case 3:
		return "CRITICAL"
	default:
		return "MEDIUM"
	}
}

// StatusLabel converts Pandora work item status int to a DevLake-compatible label.
func StatusLabel(s int) string {
	switch s {
	case 0:
		return "TODO"
	case 1:
		return "IN_PROGRESS"
	case 2:
		return "IN_REVIEW"
	case 3:
		return "DONE"
	case 4:
		return "BLOCKED"
	default:
		return "TODO"
	}
}

// MapWorkItemToIssue converts a PandoraWorkItem to a DevLakeIssue.
func MapWorkItemToIssue(wi PandoraWorkItem, projectName string) DevLakeIssue {
	issue := DevLakeIssue{
		BoardKey:       projectName,
		URL:            "",
		IssueKey:       wi.ID,
		Title:          wi.Title,
		Description:    wi.Description,
		Type:           "TASK",
		Status:         StatusLabel(wi.Status),
		OriginalStatus: StatusLabel(wi.Status),
		StoryPoint:     0,
		Priority:       "MEDIUM",
		CreatedDate:    wi.CreatedAt,
		UpdatedDate:    wi.UpdatedAt,
		AssigneeName:   wi.Assignee,
	}
	if wi.Status == 3 {
		t := wi.UpdatedAt
		issue.ResolutionDate = &t
	}
	return issue
}
