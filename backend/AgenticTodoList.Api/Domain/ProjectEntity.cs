namespace AgenticTodoList.Api.Domain;

public class ProjectEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<BacklogItemEntity> BacklogItems { get; set; } = [];
    public List<SprintEntity> Sprints { get; set; } = [];
    public List<WikiPageEntity> WikiPages { get; set; } = [];
    public List<KnowledgeCheckpointEntity> KnowledgeCheckpoints { get; set; } = [];
    public List<AgentRunLogEntity> AgentRuns { get; set; } = [];
}
