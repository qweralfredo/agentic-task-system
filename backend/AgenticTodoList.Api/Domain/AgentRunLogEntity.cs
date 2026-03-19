namespace AgenticTodoList.Api.Domain;

public class AgentRunLogEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public ProjectEntity? Project { get; set; }

    public string AgentName { get; set; } = string.Empty;
    public string EntryPoint { get; set; } = string.Empty;
    public string InputSummary { get; set; } = string.Empty;
    public string OutputSummary { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FinishedAt { get; set; }
}
