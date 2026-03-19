namespace AgenticTodoList.Api.Domain;

public enum BacklogItemStatus
{
    New = 0,
    Planned = 1,
    InSprint = 2,
    Done = 3,
    Blocked = 4
}

public enum WorkItemStatus
{
    Todo = 0,
    InProgress = 1,
    Review = 2,
    Done = 3,
    Blocked = 4
}

public enum SprintStatus
{
    Planned = 0,
    Active = 1,
    Closed = 2
}
