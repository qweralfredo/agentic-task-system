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
            Description = request.Description.Trim(),
            Status = ProjectStatus.Active,
            GitHubUrl = request.GitHubUrl?.Trim(),
            LocalPath = request.LocalPath?.Trim(),
            TechStack = request.TechStack?.Trim(),
            MainBranch = request.MainBranch?.Trim() ?? "main"
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(cancellationToken);
        return project;
    }

    public async Task<BacklogItemEntity> AddBacklogItemAsync(Guid projectId, AddBacklogItemRequest request, CancellationToken cancellationToken)
    {
        var exists = await db.Projects.AnyAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken);
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
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken)
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
                Tags = backlog.Tags,
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

        if (request.TokensUsed < 0)
        {
            throw new InvalidOperationException("Tokens used cannot be negative.");
        }

        workItem.Status = request.Status;
        workItem.Assignee = request.Assignee.Trim();
        workItem.TotalTokensSpent += request.TokensUsed;
        if (!string.IsNullOrWhiteSpace(request.ModelUsed))
        {
            workItem.LastModelUsed = request.ModelUsed.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.IdeUsed))
        {
            workItem.LastIdeUsed = request.IdeUsed.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Branch))
        {
            workItem.Branch = request.Branch.Trim();
        }

        workItem.UpdatedAt = DateTimeOffset.UtcNow;

        var feedback = new WorkItemFeedbackEntity
        {
            WorkItemId = workItem.Id,
            AgentName = string.IsNullOrWhiteSpace(request.AgentName) ? "unknown-agent" : request.AgentName.Trim(),
            ModelUsed = string.IsNullOrWhiteSpace(request.ModelUsed) ? "unknown-model" : request.ModelUsed.Trim(),
            IdeUsed = string.IsNullOrWhiteSpace(request.IdeUsed) ? "unknown-ide" : request.IdeUsed.Trim(),
            TokensUsed = request.TokensUsed,
            Feedback = request.Feedback.Trim(),
            MetadataJson = request.MetadataJson.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.WorkItemFeedbacks.Add(feedback);

        if (request.Status == WorkItemStatus.Done)
        {
            var backlog = await db.BacklogItems.FirstOrDefaultAsync(b => b.Id == workItem.BacklogItemId, cancellationToken);
            if (backlog is not null)
            {
                backlog.Status = BacklogItemStatus.Done;
            }

            // Auto-complete parent if all siblings are done
            if (workItem.ParentWorkItemId.HasValue)
            {
                var siblings = await db.WorkItems
                    .Where(w => w.ParentWorkItemId == workItem.ParentWorkItemId && w.Id != workItem.Id)
                    .Select(w => w.Status)
                    .ToListAsync(cancellationToken);

                if (siblings.All(s => s == WorkItemStatus.Done))
                {
                    var parent = await db.WorkItems.FirstOrDefaultAsync(w => w.Id == workItem.ParentWorkItemId, cancellationToken);
                    if (parent is not null && parent.Status != WorkItemStatus.Done)
                    {
                        parent.Status = WorkItemStatus.Done;
                        parent.UpdatedAt = DateTimeOffset.UtcNow;
                    }
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return workItem;
    }

    public async Task<WorkItemEntity> AddSubTaskAsync(Guid parentWorkItemId, AddSubTaskRequest request, CancellationToken cancellationToken)
    {
        var parent = await db.WorkItems.FirstOrDefaultAsync(w => w.Id == parentWorkItemId, cancellationToken)
            ?? throw new InvalidOperationException("Parent work item not found.");

        var subTask = new WorkItemEntity
        {
            ProjectId = parent.ProjectId,
            SprintId = parent.SprintId,
            BacklogItemId = parent.BacklogItemId,
            ParentWorkItemId = parent.Id,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Assignee = request.Assignee.Trim(),
            Branch = request.Branch.Trim(),
            Tags = request.Tags.Trim(),
            Status = WorkItemStatus.Todo
        };

        db.WorkItems.Add(subTask);
        await db.SaveChangesAsync(cancellationToken);
        return subTask;
    }

    public async Task<BacklogItemEntity> UpdateBacklogItemContextAsync(Guid backlogItemId, UpdateBacklogItemContextRequest request, CancellationToken cancellationToken)
    {
        var item = await db.BacklogItems.FirstOrDefaultAsync(b => b.Id == backlogItemId, cancellationToken)
            ?? throw new InvalidOperationException("Backlog item not found.");

        if (request.Tags is not null) item.Tags = request.Tags.Trim();
        if (request.WikiRefs is not null) item.WikiRefs = request.WikiRefs.Trim();
        if (request.Constraints is not null) item.Constraints = request.Constraints.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return item;
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
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken);
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
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken);
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
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken);
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
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken);
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
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId && p.Status == ProjectStatus.Active, cancellationToken)
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

