namespace PandoraTodoList.Api.Domain;

public class ProjectEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Configurações de ambiente (IDE/repositório)
    public string? GitHubUrl { get; set; }
    public string? LocalPath { get; set; }
    public string? TechStack { get; set; }
    public string MainBranch { get; set; } = "main";

    public List<BacklogItemEntity> BacklogItems { get; set; } = [];
    public List<SprintEntity> Sprints { get; set; } = [];
    public List<WikiPageEntity> WikiPages { get; set; } = [];
    public List<DocumentationPageEntity> DocumentationPages { get; set; } = [];
    public List<KnowledgeCheckpointEntity> KnowledgeCheckpoints { get; set; } = [];
    public List<AgentRunLogEntity> AgentRuns { get; set; } = [];
}

