using AgenticTodoList.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace AgenticTodoList.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<BacklogItemEntity> BacklogItems => Set<BacklogItemEntity>();
    public DbSet<SprintEntity> Sprints => Set<SprintEntity>();
    public DbSet<WorkItemEntity> WorkItems => Set<WorkItemEntity>();
    public DbSet<ReviewEntity> Reviews => Set<ReviewEntity>();
    public DbSet<WikiPageEntity> WikiPages => Set<WikiPageEntity>();
    public DbSet<KnowledgeCheckpointEntity> KnowledgeCheckpoints => Set<KnowledgeCheckpointEntity>();
    public DbSet<AgentRunLogEntity> AgentRunLogs => Set<AgentRunLogEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectEntity>()
            .Property(p => p.Name)
            .HasMaxLength(200);

        modelBuilder.Entity<ProjectEntity>()
            .HasIndex(p => p.Name);

        modelBuilder.Entity<BacklogItemEntity>()
            .Property(p => p.Title)
            .HasMaxLength(250);

        modelBuilder.Entity<WorkItemEntity>()
            .Property(p => p.Title)
            .HasMaxLength(250);

        modelBuilder.Entity<WorkItemEntity>()
            .HasIndex(w => new { w.ProjectId, w.SprintId, w.Status });

        modelBuilder.Entity<ReviewEntity>()
            .Property(r => r.Type)
            .HasMaxLength(50);

        modelBuilder.Entity<WikiPageEntity>()
            .HasIndex(w => new { w.ProjectId, w.Title })
            .IsUnique();

        modelBuilder.Entity<KnowledgeCheckpointEntity>()
            .Property(k => k.Name)
            .HasMaxLength(150);

        modelBuilder.Entity<AgentRunLogEntity>()
            .HasIndex(a => new { a.ProjectId, a.AgentName, a.StartedAt });
    }
}
