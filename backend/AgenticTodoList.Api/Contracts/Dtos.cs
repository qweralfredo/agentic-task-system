using AgenticTodoList.Api.Domain;

namespace AgenticTodoList.Api.Contracts;

public record CreateProjectRequest(string Name, string Description);
public record AddBacklogItemRequest(string Title, string Description, int StoryPoints, int Priority);
public record CreateSprintRequest(string Name, string Goal, DateOnly StartDate, DateOnly EndDate, Guid[] BacklogItemIds);
public record UpdateWorkItemStatusRequest(WorkItemStatus Status, string Assignee);
public record AddReviewRequest(string Type, string Summary, string Notes);
public record AddWikiPageRequest(string Title, string ContentMarkdown, string Tags);
public record AddCheckpointRequest(string Name, string ContextSnapshot, string Decisions, string Risks, string NextActions);
public record AddAgentRunLogRequest(string AgentName, string EntryPoint, string InputSummary, string OutputSummary, string Status, DateTimeOffset StartedAt, DateTimeOffset? FinishedAt);

public record DashboardDto(
    Guid ProjectId,
    string ProjectName,
    int BacklogTotal,
    int BacklogDone,
    int ActiveSprints,
    int WorkItemsTodo,
    int WorkItemsInProgress,
    int WorkItemsReview,
    int WorkItemsDone,
    int KnowledgeCheckpoints,
    int WikiPages,
    int AgentRuns);
