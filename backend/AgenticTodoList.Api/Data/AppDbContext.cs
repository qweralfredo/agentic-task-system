using PandoraTodoList.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace PandoraTodoList.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<BacklogItemEntity> BacklogItems => Set<BacklogItemEntity>();
    public DbSet<SprintEntity> Sprints => Set<SprintEntity>();
    public DbSet<WorkItemEntity> WorkItems => Set<WorkItemEntity>();
    public DbSet<WorkItemFeedbackEntity> WorkItemFeedbacks => Set<WorkItemFeedbackEntity>();
    public DbSet<ReviewEntity> Reviews => Set<ReviewEntity>();
    public DbSet<WikiPageEntity> WikiPages => Set<WikiPageEntity>();
    public DbSet<DocumentationPageEntity> DocumentationPages => Set<DocumentationPageEntity>();
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

        modelBuilder.Entity<BacklogItemEntity>()
            .Property(b => b.CommitIds)
            .HasColumnType("text[]");

        modelBuilder.Entity<SprintEntity>()
            .Property(s => s.CommitIds)
            .HasColumnType("text[]");

        modelBuilder.Entity<WorkItemEntity>()
            .Property(p => p.Title)
            .HasMaxLength(250);

        modelBuilder.Entity<WorkItemEntity>()
            .Property(w => w.CommitIds)
            .HasColumnType("text[]");

        modelBuilder.Entity<WorkItemEntity>()
            .HasIndex(w => new { w.ProjectId, w.SprintId, w.Status });

        modelBuilder.Entity<WorkItemEntity>()
            .HasMany(w => w.SubTasks)
            .WithOne(w => w.ParentWorkItem)
            .HasForeignKey(w => w.ParentWorkItemId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        modelBuilder.Entity<WorkItemEntity>()
            .HasIndex(w => w.ParentWorkItemId);

        modelBuilder.Entity<WorkItemEntity>()
            .Property(w => w.Branch)
            .HasMaxLength(250);

        modelBuilder.Entity<WorkItemEntity>()
            .Property(w => w.LastModelUsed)
            .HasMaxLength(120);

        modelBuilder.Entity<WorkItemEntity>()
            .Property(w => w.LastIdeUsed)
            .HasMaxLength(120);

        modelBuilder.Entity<WorkItemFeedbackEntity>()
            .Property(f => f.AgentName)
            .HasMaxLength(120);

        modelBuilder.Entity<WorkItemFeedbackEntity>()
            .Property(f => f.ModelUsed)
            .HasMaxLength(120);

        modelBuilder.Entity<WorkItemFeedbackEntity>()
            .Property(f => f.IdeUsed)
            .HasMaxLength(120);

        modelBuilder.Entity<WorkItemFeedbackEntity>()
            .HasIndex(f => new { f.WorkItemId, f.CreatedAt });

        modelBuilder.Entity<ReviewEntity>()
            .Property(r => r.Type)
            .HasMaxLength(50);

        modelBuilder.Entity<WikiPageEntity>()
            .HasIndex(w => new { w.ProjectId, w.Title })
            .IsUnique();

        modelBuilder.Entity<WikiPageEntity>()
            .Property(w => w.Category)
            .HasMaxLength(120);

        modelBuilder.Entity<DocumentationPageEntity>()
            .Property(d => d.Category)
            .HasMaxLength(120);

        modelBuilder.Entity<DocumentationPageEntity>()
            .HasIndex(d => new { d.ProjectId, d.Category, d.Title });

        modelBuilder.Entity<KnowledgeCheckpointEntity>()
            .Property(k => k.Name)
            .HasMaxLength(150);

        modelBuilder.Entity<KnowledgeCheckpointEntity>()
            .Property(k => k.Category)
            .HasMaxLength(120);

        modelBuilder.Entity<AgentRunLogEntity>()
            .HasIndex(a => new { a.ProjectId, a.AgentName, a.StartedAt });
    }
}

