using PandoraTodoList.Api.Contracts;
using PandoraTodoList.Api.Data;
using PandoraTodoList.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace PandoraTodoList.Api.Services;

public class ScrumService(AppDbContext db)
{
    public async Task<ProjectEntity> CreateProjectAsync(CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = new ProjectEntity
        {
            Name = request.Name.Trim(),
            Description = request.Description.Trim()
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(cancellationToken);
        return project;
    }

    public async Task<BacklogItemEntity> AddBacklogItemAsync(Guid projectId, AddBacklogItemRequest request, CancellationToken cancellationToken)
    {
        var exists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!exists)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var item = new BacklogItemEntity
        {
            ProjectId = projectId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            StoryPoints = request.StoryPoints,
            Priority = request.Priority,
            Status = BacklogItemStatus.Planned
        };

        db.BacklogItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);
        return item;
    }

    public async Task<SprintEntity> CreateSprintAsync(Guid projectId, CreateSprintRequest request, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken)
            ?? throw new InvalidOperationException("Project not found.");

        var sprint = new SprintEntity
        {
            ProjectId = project.Id,
            Name = request.Name.Trim(),
            Goal = request.Goal.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = SprintStatus.Active
        };

        db.Sprints.Add(sprint);

        var backlogCandidates = await db.BacklogItems
            .Where(b => b.ProjectId == projectId)
            .ToListAsync(cancellationToken);

        var selectedIds = request.BacklogItemIds.ToHashSet();
        var backlogItems = backlogCandidates.Where(b => selectedIds.Contains(b.Id)).ToList();

        foreach (var backlog in backlogItems)
        {
            backlog.Status = BacklogItemStatus.InSprint;

            db.WorkItems.Add(new WorkItemEntity
            {
                ProjectId = projectId,
                Sprint = sprint,
                BacklogItemId = backlog.Id,
                Title = backlog.Title,
                Description = backlog.Description,
                Status = WorkItemStatus.Todo
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return sprint;
    }

    public async Task<WorkItemEntity> UpdateWorkItemStatusAsync(Guid workItemId, UpdateWorkItemStatusRequest request, CancellationToken cancellationToken)
    {
        var workItem = await db.WorkItems.FirstOrDefaultAsync(w => w.Id == workItemId, cancellationToken)
            ?? throw new InvalidOperationException("Work item not found.");

        workItem.Status = request.Status;
        workItem.Assignee = request.Assignee.Trim();
        workItem.UpdatedAt = DateTimeOffset.UtcNow;

        if (request.Status == WorkItemStatus.Done)
        {
            var backlog = await db.BacklogItems.FirstOrDefaultAsync(b => b.Id == workItem.BacklogItemId, cancellationToken);
            if (backlog is not null)
            {
                backlog.Status = BacklogItemStatus.Done;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return workItem;
    }

    public async Task<ReviewEntity> AddReviewAsync(Guid sprintId, AddReviewRequest request, CancellationToken cancellationToken)
    {
        var sprintExists = await db.Sprints.AnyAsync(s => s.Id == sprintId, cancellationToken);
        if (!sprintExists)
        {
            throw new InvalidOperationException("Sprint not found.");
        }

        var review = new ReviewEntity
        {
            SprintId = sprintId,
            Type = request.Type.Trim(),
            Summary = request.Summary.Trim(),
            Notes = request.Notes.Trim()
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync(cancellationToken);
        return review;
    }

    public async Task<WikiPageEntity> AddWikiPageAsync(Guid projectId, AddWikiPageRequest request, CancellationToken cancellationToken)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!projectExists)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var page = new WikiPageEntity
        {
            ProjectId = projectId,
            Title = request.Title.Trim(),
            ContentMarkdown = request.ContentMarkdown,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            Tags = request.Tags.Trim(),
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.WikiPages.Add(page);
        await db.SaveChangesAsync(cancellationToken);
        return page;
    }

    public async Task<KnowledgeCheckpointEntity> AddCheckpointAsync(Guid projectId, AddCheckpointRequest request, CancellationToken cancellationToken)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!projectExists)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var checkpoint = new KnowledgeCheckpointEntity
        {
            ProjectId = projectId,
            Name = request.Name.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            ContextSnapshot = request.ContextSnapshot,
            Decisions = request.Decisions,
            Risks = request.Risks,
            NextActions = request.NextActions
        };

        db.KnowledgeCheckpoints.Add(checkpoint);
        await db.SaveChangesAsync(cancellationToken);
        return checkpoint;
    }

    public async Task<DocumentationPageEntity> AddDocumentationPageAsync(Guid projectId, AddDocumentationPageRequest request, CancellationToken cancellationToken)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!projectExists)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var page = new DocumentationPageEntity
        {
            ProjectId = projectId,
            Title = request.Title.Trim(),
            ContentMarkdown = request.ContentMarkdown,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            Tags = request.Tags.Trim(),
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.DocumentationPages.Add(page);
        await db.SaveChangesAsync(cancellationToken);
        return page;
    }

    public async Task<AgentRunLogEntity> AddAgentRunAsync(Guid projectId, AddAgentRunLogRequest request, CancellationToken cancellationToken)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!projectExists)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var run = new AgentRunLogEntity
        {
            ProjectId = projectId,
            AgentName = request.AgentName,
            EntryPoint = request.EntryPoint,
            InputSummary = request.InputSummary,
            OutputSummary = request.OutputSummary,
            Status = request.Status,
            StartedAt = request.StartedAt,
            FinishedAt = request.FinishedAt
        };

        db.AgentRunLogs.Add(run);
        await db.SaveChangesAsync(cancellationToken);
        return run;
    }

    public async Task<DashboardDto> GetDashboardAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken)
            ?? throw new InvalidOperationException("Project not found.");

        var backlog = await db.BacklogItems.Where(b => b.ProjectId == projectId).ToListAsync(cancellationToken);
        var workItems = await db.WorkItems.Where(w => w.ProjectId == projectId).ToListAsync(cancellationToken);

        return new DashboardDto(
            project.Id,
            project.Name,
            backlog.Count,
            backlog.Count(b => b.Status == BacklogItemStatus.Done),
            await db.Sprints.CountAsync(s => s.ProjectId == projectId && s.Status == SprintStatus.Active, cancellationToken),
            workItems.Count(w => w.Status == WorkItemStatus.Todo),
            workItems.Count(w => w.Status == WorkItemStatus.InProgress),
            workItems.Count(w => w.Status == WorkItemStatus.Review),
            workItems.Count(w => w.Status == WorkItemStatus.Done),
            await db.KnowledgeCheckpoints.CountAsync(k => k.ProjectId == projectId, cancellationToken),
            await db.WikiPages.CountAsync(w => w.ProjectId == projectId, cancellationToken),
            await db.AgentRunLogs.CountAsync(a => a.ProjectId == projectId, cancellationToken));
    }
}

