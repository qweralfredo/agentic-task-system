using PandoraTodoList.Api.Domain;

namespace PandoraTodoList.Api.Contracts;

public record CreateProjectRequest(
    string Name,
    string Description,
    string? GitHubUrl = null,
    string? LocalPath = null,
    string? TechStack = null,
    string? MainBranch = null);

public record UpdateProjectConfigRequest(
    string? GitHubUrl,
    string? LocalPath,
    string? TechStack,
    string? MainBranch);
public record AddBacklogItemRequest(string Title, string Description, int StoryPoints, int Priority);
public record CreateSprintRequest(string Name, string Goal, DateOnly StartDate, DateOnly EndDate, Guid[] BacklogItemIds);
public record UpdateWorkItemStatusRequest(
    WorkItemStatus Status,
    string Assignee,
    int TokensUsed = 0,
    string AgentName = "",
    string ModelUsed = "",
    string IdeUsed = "",
    string Feedback = "",
    string MetadataJson = "");
public record AddReviewRequest(string Type, string Summary, string Notes);
public record AddWikiPageRequest(string Title, string ContentMarkdown, string Tags, string Category = "General");
public record AddCheckpointRequest(string Name, string ContextSnapshot, string Decisions, string Risks, string NextActions, string Category = "General");
public record AddDocumentationPageRequest(string Title, string ContentMarkdown, string Category, string Tags);
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

