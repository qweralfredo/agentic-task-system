import os
import json
from datetime import date, timedelta
from typing import Any, Union

import httpx
from mcp.server.fastmcp import FastMCP
import git_graph_service

API_BASE_URL = os.getenv("PANDORA_API_BASE_URL", "http://127.0.0.1:8480")
TIMEOUT_SECONDS = float(os.getenv("PANDORA_API_TIMEOUT", "30"))
MCP_TRANSPORT = os.getenv("PANDORA_MCP_TRANSPORT", "stdio")
MCP_HOST = os.getenv("PANDORA_MCP_HOST", "127.0.0.1")
MCP_PORT = int(os.getenv("PANDORA_MCP_PORT", "8000"))
MCP_MOUNT_PATH = os.getenv("PANDORA_MCP_MOUNT_PATH", "/")

mcp = FastMCP("pandora-todo-list-mcp", host=MCP_HOST, port=MCP_PORT)


class ApiError(RuntimeError):
    pass


def _request(method: str, path: str, *, params: dict[str, Any] | None = None, payload: dict[str, Any] | None = None) -> Any:
    url = f"{API_BASE_URL.rstrip('/')}{path}"
    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        response = client.request(method=method, url=url, params=params, json=payload)

    if response.status_code >= 400:
        try:
            data = response.json()
        except ValueError:
            data = {"error": response.text}
        raise ApiError(f"API request failed ({response.status_code}): {data}")

    if not response.content:
        return None

    return response.json()


def _json_resource(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=True, indent=2)


def _flatten_workitems(sprints: list[dict[str, Any]], sprint_id: str | None = None) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for sprint in sprints:
        if sprint_id and sprint.get("id") != sprint_id:
            continue

        for work_item in sprint.get("workItems", []):
            row = dict(work_item)
            row["sprintId"] = sprint.get("id")
            row["sprintName"] = sprint.get("name")
            items.append(row)

    return items


def _normalize_workitem_status(status: str) -> int:
    value = status.strip().lower()
    # ENUM: Todo=0 | InProgress=1 | Review=2 | Done=3 | Blocked=4
    aliases = {
        "0": 0,
        "todo": 0,
        "to-do": 0,
        "new": 0,
        "1": 1,
        "in_progress": 1,
        "in-progress": 1,
        "in progress": 1,
        "inprogress": 1,
        "doing": 1,
        "2": 2,
        "review": 2,
        "qa": 2,
        "3": 3,
        "done": 3,
        "completed": 3,
        "4": 4,
        "blocked": 4,
        "impediment": 4,
    }
    if value not in aliases:
        raise ApiError(
            "Invalid work item status. Valid string labels: todo, in_progress, review, done, blocked. "
            "Valid integers: 0=Todo 1=InProgress 2=Review 3=Done 4=Blocked."
        )
    return aliases[value]


_STATUS_LABELS = {0: "Todo", 1: "InProgress", 2: "Review", 3: "Done", 4: "Blocked"}


@mcp.resource("pandora://about")
def resource_about() -> str:
    """Describe MCP resources available for the Pandora todo workflow."""
    return _json_resource(
        {
            "name": "pandora-todo-list-mcp",
            "purpose": "Read-only context resources for projects, backlog, sprints, work items and knowledge.",
            "notes": [
                "Resources are read-only context for agents.",
                "Use tools for write operations.",
            ],
            "directResources": [
                "pandora://about",
                "pandora://projects/active",
                "pandora://projects/all",
            ],
            "resourceTemplates": [
                "pandora://projects/{project_id}/context",
                "pandora://projects/{project_id}/config",
                "pandora://projects/{project_id}/dashboard",
                "pandora://projects/{project_id}/backlog",
                "pandora://projects/{project_id}/sprints",
                "pandora://projects/{project_id}/workitems",
                "pandora://projects/{project_id}/workitems/status/{status}",
                "pandora://projects/{project_id}/sprints/{sprint_id}/workitems",
                "pandora://projects/{project_id}/tasks/overview",
                "pandora://projects/{project_id}/tasks/triage",
                "pandora://projects/{project_id}/knowledge",
            ],
        }
    )


@mcp.resource("pandora://projects/active")
def resource_projects_active() -> str:
    """Read active projects list."""
    return _json_resource(_request("GET", "/api/projects", params={"includeArchived": False}))


@mcp.resource("pandora://projects/all")
def resource_projects_all() -> str:
    """Read all projects list, including archived."""
    return _json_resource(_request("GET", "/api/projects", params={"includeArchived": True}))


@mcp.resource("pandora://projects/{project_id}/config")
def resource_project_config(project_id: str) -> str:
    """Read environment configuration for one project (GitHub URL, local path, tech stack, main branch)."""
    projects = _request("GET", "/api/projects", params={"includeArchived": True})
    project = next((p for p in projects if p.get("id") == project_id), None)
    if project is None:
        raise ApiError(f"Project {project_id} not found.")
    return _json_resource({
        "projectId": project_id,
        "name": project.get("name"),
        "gitHubUrl": project.get("gitHubUrl"),
        "localPath": project.get("localPath"),
        "techStack": project.get("techStack"),
        "mainBranch": project.get("mainBranch", "main"),
    })


@mcp.resource("pandora://projects/{project_id}/dashboard")
def resource_project_dashboard(project_id: str) -> str:
    """Read dashboard summary for one project."""
    return _json_resource(_request("GET", f"/api/projects/{project_id}/dashboard"))


@mcp.resource("pandora://projects/{project_id}/backlog")
def resource_project_backlog(project_id: str) -> str:
    """Read backlog items for one project."""
    return _json_resource(_request("GET", f"/api/projects/{project_id}/backlog"))


@mcp.resource("pandora://projects/{project_id}/sprints")
def resource_project_sprints(project_id: str) -> str:
    """Read sprint list for one project."""
    return _json_resource(_request("GET", f"/api/projects/{project_id}/sprints"))


@mcp.resource("pandora://projects/{project_id}/workitems")
def resource_project_workitems(project_id: str) -> str:
    """Read flattened work items for all sprints in one project."""
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")
    return _json_resource(_flatten_workitems(sprints))


@mcp.resource("pandora://projects/{project_id}/workitems/status/{status}")
def resource_project_workitems_by_status(project_id: str, status: str) -> str:
    """Read flattened work items for one project filtered by status."""
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")
    status_code = _normalize_workitem_status(status)
    filtered = [item for item in _flatten_workitems(sprints) if int(item.get("status", -1)) == status_code]
    payload = {
        "projectId": project_id,
        "status": status,
        "statusCode": status_code,
        "count": len(filtered),
        "items": filtered,
    }
    return _json_resource(payload)


@mcp.resource("pandora://projects/{project_id}/sprints/{sprint_id}/workitems")
def resource_project_sprint_workitems(project_id: str, sprint_id: str) -> str:
    """Read flattened work items for one sprint in one project."""
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")
    return _json_resource(_flatten_workitems(sprints, sprint_id=sprint_id))


@mcp.resource("pandora://projects/{project_id}/knowledge")
def resource_project_knowledge(project_id: str) -> str:
    """Read knowledge payload (wiki, checkpoints, documentation, agent runs)."""
    return _json_resource(_request("GET", f"/api/projects/{project_id}/knowledge"))


@mcp.resource("pandora://projects/{project_id}/tasks/overview")
def resource_project_tasks_overview(project_id: str) -> str:
    """Read task-centric summary for agents to track planning and execution state."""
    backlog = _request("GET", f"/api/projects/{project_id}/backlog")
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")
    workitems = _flatten_workitems(sprints)

    backlog_done = [item for item in backlog if int(item.get("status", 0)) == 3]
    backlog_open = [item for item in backlog if int(item.get("status", 0)) != 3]
    workitems_done = [item for item in workitems if int(item.get("status", 0)) == 3]
    workitems_open = [item for item in workitems if int(item.get("status", 0)) != 3]

    payload = {
        "projectId": project_id,
        "summary": {
            "backlogTotal": len(backlog),
            "backlogOpen": len(backlog_open),
            "backlogDone": len(backlog_done),
            "workItemsTotal": len(workitems),
            "workItemsOpen": len(workitems_open),
            "workItemsDone": len(workitems_done),
            "sprintsTotal": len(sprints),
        },
        "backlogOpen": backlog_open,
        "workItemsOpen": workitems_open,
    }

    return _json_resource(payload)


@mcp.resource("pandora://projects/{project_id}/tasks/triage")
def resource_project_tasks_triage(project_id: str) -> str:
    """Read triage view focused on review and blocked items for agent prioritization."""
    backlog = _request("GET", f"/api/projects/{project_id}/backlog")
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")
    workitems = _flatten_workitems(sprints)

    backlog_blocked = [item for item in backlog if int(item.get("status", -1)) == 4]
    workitems_review = [item for item in workitems if int(item.get("status", -1)) == 2]
    workitems_blocked = [item for item in workitems if int(item.get("status", -1)) == 4]

    payload = {
        "projectId": project_id,
        "summary": {
            "backlogBlocked": len(backlog_blocked),
            "workItemsInReview": len(workitems_review),
            "workItemsBlocked": len(workitems_blocked),
            "triagePriorityCount": len(backlog_blocked) + len(workitems_review) + len(workitems_blocked),
        },
        "backlogBlocked": backlog_blocked,
        "workItemsInReview": workitems_review,
        "workItemsBlocked": workitems_blocked,
    }

    return _json_resource(payload)


@mcp.resource("pandora://projects/{project_id}/context")
def resource_project_context(project_id: str) -> str:
    """Read full project context snapshot for agent grounding and continuity."""
    dashboard = _request("GET", f"/api/projects/{project_id}/dashboard")
    backlog = _request("GET", f"/api/projects/{project_id}/backlog")
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")
    knowledge = _request("GET", f"/api/projects/{project_id}/knowledge")

    payload = {
        "projectId": project_id,
        "dashboard": dashboard,
        "backlog": backlog,
        "sprints": sprints,
        "workItems": _flatten_workitems(sprints),
        "knowledge": knowledge,
    }

    return _json_resource(payload)


@mcp.tool(name="project_list")
def project_list(include_archived: bool = False) -> list[dict[str, Any]]:
    """List projects from Pandora."""
    return _request("GET", "/api/projects", params={"includeArchived": include_archived})


@mcp.tool(name="project_create")
def project_create(
    name: str,
    description: str,
    github_url: str | None = None,
    local_path: str | None = None,
    tech_stack: str | None = None,
    main_branch: str | None = None,
) -> dict[str, Any]:
    """Create a new project. Optionally set environment config: github_url, local_path, tech_stack, main_branch."""
    payload: dict[str, Any] = {"name": name, "description": description}
    if github_url is not None:
        payload["gitHubUrl"] = github_url
    if local_path is not None:
        payload["localPath"] = local_path
    if tech_stack is not None:
        payload["techStack"] = tech_stack
    if main_branch is not None:
        payload["mainBranch"] = main_branch
    return _request("POST", "/api/projects", payload=payload)


@mcp.tool(name="project_config_update")
def project_config_update(
    project_id: str,
    github_url: str | None = None,
    local_path: str | None = None,
    tech_stack: str | None = None,
    main_branch: str | None = None,
) -> dict[str, Any]:
    """Update environment configuration for a project (GitHub URL, local path, tech stack, main branch). Only provided fields are changed."""
    payload: dict[str, Any] = {}
    if github_url is not None:
        payload["gitHubUrl"] = github_url
    if local_path is not None:
        payload["localPath"] = local_path
    if tech_stack is not None:
        payload["techStack"] = tech_stack
    if main_branch is not None:
        payload["mainBranch"] = main_branch
    if not payload:
        raise ApiError("At least one config field must be provided (github_url, local_path, tech_stack or main_branch).")
    return _request("PATCH", f"/api/projects/{project_id}/config", payload=payload)


@mcp.tool(name="project_delete")
def project_delete(project_id: str) -> dict[str, Any]:
    """Archive a project (soft delete) by id."""
    return _request("DELETE", f"/api/projects/{project_id}")


@mcp.tool(name="backlog_add")
def backlog_add(project_id: str, title: str, description: str, story_points: int, priority: int) -> dict[str, Any]:
    """Add backlog item to a project."""
    return _request(
        "POST",
        f"/api/projects/{project_id}/backlog",
        payload={
            "title": title,
            "description": description,
            "storyPoints": story_points,
            "priority": priority,
        },
    )


@mcp.tool(name="backlog_list")
def backlog_list(project_id: str) -> list[dict[str, Any]]:
    """List backlog items from a project."""
    return _request("GET", f"/api/projects/{project_id}/backlog")


@mcp.tool(name="sprint_create")
def sprint_create(
    project_id: str,
    name: str,
    goal: str,
    start_date: str,
    end_date: str,
    backlog_item_ids: list[str],
) -> dict[str, Any]:
    """Create sprint from backlog items using YYYY-MM-DD dates."""
    return _request(
        "POST",
        f"/api/projects/{project_id}/sprints",
        payload={
            "name": name,
            "goal": goal,
            "startDate": start_date,
            "endDate": end_date,
            "backlogItemIds": backlog_item_ids,
        },
    )


@mcp.tool(name="workitem_list")
def workitem_list(project_id: str, sprint_id: str | None = None) -> list[dict[str, Any]]:
    """List work items from a project and optional sprint."""
    sprints = _request("GET", f"/api/projects/{project_id}/sprints")

    items: list[dict[str, Any]] = []
    for sprint in sprints:
        if sprint_id and sprint.get("id") != sprint_id:
            continue

        for work_item in sprint.get("workItems", []):
            row = dict(work_item)
            row["sprintId"] = sprint.get("id")
            row["sprintName"] = sprint.get("name")
            items.append(row)

    return items


@mcp.tool(name="workitem_update")
def workitem_update(
    work_item_id: str,
    status: Union[str, int],
    assignee: str,
    tokens_used: int | None = None,
    agent_name: str = "",
    model_used: str = "",
    ide_used: str = "",
    feedback: str = "",
    metadata_json: str = "",
    branch: str = "",
) -> dict[str, Any]:
    """Update work item status and track token/feedback metadata.

    status — use string label (preferred) or integer:
      todo / 0       → Todo
      in_progress / 1 → InProgress
      review / 2     → Review
      done / 3       → Done
      blocked / 4    → Blocked

    branch — git branch being worked on for this task (e.g. 'feature/sub-tasks').

    tokens_used — only pass this when you have the ACTUAL token count from
      observability tooling. Do NOT estimate or fabricate a value.
      Omit (or pass None/0) when the real count is unavailable.

    The response includes:
      - 'statusLabel'   confirming the resolved status
      - 'tokensTracked' True if a positive token count was recorded, False if not
    """
    status_int = _normalize_workitem_status(str(status))
    actual_tokens = tokens_used if tokens_used is not None else 0
    result = _request(
        "POST",
        f"/api/work-items/{work_item_id}/status",
        payload={
            "status": status_int,
            "assignee": assignee,
            "tokensUsed": actual_tokens,
            "agentName": agent_name,
            "modelUsed": model_used,
            "ideUsed": ide_used,
            "feedback": feedback,
            "metadataJson": metadata_json,
            "branch": branch,
        },
    )
    # Echo status label back so agents can verify what was actually set
    if isinstance(result, dict):
        result["statusLabel"] = _STATUS_LABELS.get(status_int, str(status_int))
        result["tokensTracked"] = tokens_used is not None and tokens_used > 0
    return result


@mcp.tool(name="workitem_add_subtask")
def workitem_add_subtask(
    parent_work_item_id: str,
    title: str,
    description: str,
    assignee: str = "",
    branch: str = "",
    tags: str = "",
) -> dict[str, Any]:
    """Create a sub-task under an existing work item.

    Sub-tasks inherit sprint and backlog item from the parent.
    They appear in the sprint board with a parent badge.
    When all sub-tasks of a parent reach Done, the parent is auto-completed.
    """
    return _request(
        "POST",
        f"/api/work-items/{parent_work_item_id}/sub-tasks",
        payload={
            "title": title,
            "description": description,
            "assignee": assignee,
            "branch": branch,
            "tags": tags,
        },
    )


@mcp.tool(name="backlog_context_update")
def backlog_context_update(
    backlog_item_id: str,
    tags: str | None = None,
    wiki_refs: str | None = None,
    constraints: str | None = None,
) -> dict[str, Any]:
    """Update context metadata on a backlog item.

    tags       — comma-separated labels (e.g. 'auth,security,mvp')
    wiki_refs  — references to wiki pages (e.g. 'wiki:Authentication,wiki:JWT-Design')
    constraints — free-text preconditions or dependencies (e.g. 'Must be done before Sprint 3 release')

    Only provided fields are changed.
    """
    payload: dict[str, Any] = {}
    if tags is not None:
        payload["tags"] = tags
    if wiki_refs is not None:
        payload["wikiRefs"] = wiki_refs
    if constraints is not None:
        payload["constraints"] = constraints
    if not payload:
        raise ApiError("At least one context field must be provided (tags, wiki_refs or constraints).")
    return _request("PATCH", f"/api/backlog-items/{backlog_item_id}/context", payload=payload)


@mcp.tool(name="knowledge_checkpoint")
def knowledge_checkpoint(
    project_id: str,
    name: str,
    context_snapshot: str,
    decisions: str,
    risks: str,
    next_actions: str,
) -> dict[str, Any]:
    """Create a knowledge checkpoint for a project."""
    return _request(
        "POST",
        f"/api/projects/{project_id}/checkpoints",
        payload={
            "name": name,
            "contextSnapshot": context_snapshot,
            "decisions": decisions,
            "risks": risks,
            "nextActions": next_actions,
        },
    )


@mcp.tool(name="knowledge_list")
def knowledge_list(project_id: str) -> dict[str, Any]:
    """List full knowledge payload (wiki, documentation, checkpoints, agent runs)."""
    return _request("GET", f"/api/projects/{project_id}/knowledge")


@mcp.tool(name="wiki_add")
def wiki_add(
    project_id: str,
    title: str,
    content_markdown: str,
    tags: str,
    category: str = "General",
) -> dict[str, Any]:
    """Create wiki page for a project."""
    return _request(
        "POST",
        f"/api/projects/{project_id}/wiki",
        payload={
            "title": title,
            "contentMarkdown": content_markdown,
            "tags": tags,
            "category": category,
        },
    )


@mcp.tool(name="wiki_list")
def wiki_list(project_id: str) -> list[dict[str, Any]]:
    """List wiki pages from a project."""
    knowledge = _request("GET", f"/api/projects/{project_id}/knowledge")
    return knowledge.get("wikiPages", [])


@mcp.tool(name="documentation_add")
def documentation_add(
    project_id: str,
    title: str,
    content_markdown: str,
    category: str,
    tags: str,
) -> dict[str, Any]:
    """Create documentation page for a project."""
    return _request(
        "POST",
        f"/api/projects/{project_id}/documentation",
        payload={
            "title": title,
            "contentMarkdown": content_markdown,
            "category": category,
            "tags": tags,
        },
    )


@mcp.tool(name="documentation_list")
def documentation_list(project_id: str) -> list[dict[str, Any]]:
    """List documentation pages from a project."""
    knowledge = _request("GET", f"/api/projects/{project_id}/knowledge")
    return knowledge.get("documentationPages", [])


@mcp.tool(name="checkpoint_list")
def checkpoint_list(project_id: str) -> list[dict[str, Any]]:
    """List knowledge checkpoints from a project."""
    knowledge = _request("GET", f"/api/projects/{project_id}/knowledge")
    return knowledge.get("checkpoints", [])


@mcp.tool(name="get_modification_impact")
def get_modification_impact(project_id: str, file_path: str) -> str:
    """Read a context modification graph for a specified file to discover temporal coupling and historical context."""
    projects = _request("GET", "/api/projects", params={"includeArchived": False})
    project = next((p for p in projects if str(p.get("id")) == project_id), None)
    if not project or not project.get("localPath"):
        raise ApiError(f"Project {project_id} not found or localPath not configured.")
        
    impact = git_graph_service.analyze_impact(project.get("localPath"), file_path)
    
    if "error" in impact:
        return impact["error"]
        
    md = [f"## Impact Analysis for `{file_path}`", ""]
    
    md.append("### Temporally Coupled Files (Co-modified)")
    if impact.get("co_modified_files"):
        for f in impact["co_modified_files"][:10]:
            md.append(f"- `{f['file']}` (Modified together {f['frequency']} times)")
    else:
        md.append("- No temporal coupling found.")
        
    md.append("")
    md.append("### Historically Related WorkItems")
    if impact.get("historically_related_workitems"):
        for wi in impact["historically_related_workitems"][:10]:
            md.append(f"- WorkItem `{wi}`")
    else:
        md.append("- No correlated WorkItems found in recent history.")
        
    return "\\n".join(md)



@mcp.prompt(name="pandora_project_config")
def pandora_project_config(
    project_id: str = "<project-id>",
    github_url: str = "",
    local_path: str = "",
    tech_stack: str = "",
    main_branch: str = "main",
) -> str:
    """Prompt guiado para configurar o ambiente do projeto (GitHub, caminho local, stack, branch)."""
    return (
        "Objetivo: configurar os dados de ambiente para que uma IDE possa recriar o contexto do projeto do zero.\n"
        "Resource MCP de leitura: pandora://projects/{project_id}/config\n"
        "Tool de escrita: project_config_update\n\n"
        "Campos disponiveis:\n"
        f"- github_url: URL do repositório GitHub (ex: https://github.com/org/repo) — atual: '{github_url or 'nao configurado'}'\n"
        f"- local_path: Caminho da pasta no disco (ex: c:/projetos/meuapp) — atual: '{local_path or 'nao configurado'}'\n"
        f"- tech_stack: Stack tecnologica (ex: .NET 10, React, PostgreSQL) — atual: '{tech_stack or 'nao configurado'}'\n"
        f"- main_branch: Branch principal (ex: main, develop) — atual: '{main_branch}'\n\n"
        "Instrucoes:\n"
        f"1) Ler configuracao atual via resource: pandora://projects/{project_id}/config\n"
        "2) Solicitar ao usuario os campos ausentes ou incorretos.\n"
        f"3) Executar project_config_update(project_id='{project_id}', ...) apenas com os campos a alterar.\n"
        "4) Confirmar resultado relendo o resource de config.\n\n"
        "Validacao minima obrigatoria:\n"
        "- gitHubUrl preenchido se o projeto tiver repositorio remoto.\n"
        "- localPath preenchido se o projeto tiver pasta local conhecida.\n"
        "- techStack preenchido para orientar tooling e agentes.\n"
        "- mainBranch correto (padrao: main).\n\n"
        "Formato de resposta esperado:\n"
        "- projectId, projectName\n"
        "- gitHubUrl, localPath, techStack, mainBranch\n"
        "- campos ainda ausentes (se houver)."
    )


@mcp.prompt(name="pandora_project_create")
def pandora_project_create(name: str = "Novo Projeto", description: str = "Projeto criado via prompt") -> str:
    """Prompt guiado para criacao de projeto com validacoes objetivas."""
    return (
        "Objetivo: criar um projeto no Pandora e validar o resultado.\n"
        "Recurso UI relacionado: seletor de Projeto (topo), Dashboard, Backlog, Sprints e Knowledge.\n"
        "Acao: execute a tool project_create com os dados abaixo:\n"
        f"- name: '{name}'\n"
        f"- description: '{description}'\n"
        "Validacao minima obrigatoria:\n"
        "1) Confirmar retorno com id nao vazio.\n"
        "2) Executar project_list(include_archived=false) e verificar se o id criado aparece.\n"
        "3) Definir este projeto como contexto ativo para as proximas operacoes.\n"
        "Formato de resposta esperado:\n"
        "- project_id\n"
        "- project_name\n"
        "- created_at\n"
        "- proximo passo recomendado (backlog_add)."
    )


@mcp.prompt(name="pandora_sprint_create")
def pandora_sprint_create(
    project_id: str = "<project-id>",
    name: str = "Sprint 1",
    goal: str = "Entregar funcionalidades prioritarias",
    start_date: str = date.today().strftime("%Y-%m-%d"),
    end_date: str = (date.today() + timedelta(days=14)).strftime("%Y-%m-%d"),
) -> str:
    """Prompt guiado para criacao de sprint com backlog e verificacao de work items."""
    return (
        "Objetivo: criar sprint a partir do backlog e validar quadro de tarefas.\n"
        "Recurso UI relacionado: pagina Sprints (planejamento + board por status).\n"
        "Pre-condicoes:\n"
        "1) project_id valido.\n"
        "2) backlog com pelo menos um item (obter com backlog_list).\n"
        "Acao:\n"
        "- Se backlog estiver vazio, criar item com backlog_add antes de continuar.\n"
        "- Executar sprint_create com:\n"
        f"  - project_id: '{project_id}'\n"
        f"  - name: '{name}'\n"
        f"  - goal: '{goal}'\n"
        f"  - start_date: '{start_date}'\n"
        f"  - end_date: '{end_date}'\n"
        "  - backlog_item_ids: ['<backlog-item-id>']\n"
        "Validacao minima obrigatoria:\n"
        "1) Confirmar sprint id no retorno.\n"
        "2) Executar workitem_list(project_id, sprint_id) e garantir lista nao vazia.\n"
        "3) Se necessario, atualizar status/assignee com workitem_update.\n"
        "Formato de resposta esperado:\n"
        "- sprint_id\n"
        "- quantidade de work items gerados\n"
        "- proximo passo recomendado (execucao do board)."
    )


@mcp.prompt(name="pandora_resources_guide")
def pandora_resources_guide(project_id: str = "<project-id>") -> str:
    """Guia objetivo com todos os recursos da UI e o mapeamento para MCP/API."""
    return (
        "Mapa de recursos do app em http://localhost:8400 e como operar via MCP/API.\n\n"
        "Resources MCP para contexto completo (read-only):\n"
        "- pandora://projects/{project_id}/context\n"
        "- pandora://projects/{project_id}/dashboard\n"
        "- pandora://projects/{project_id}/backlog\n"
        "- pandora://projects/{project_id}/sprints\n"
        "- pandora://projects/{project_id}/workitems\n"
        "- pandora://projects/{project_id}/workitems/status/{status}\n"
        "- pandora://projects/{project_id}/sprints/{sprint_id}/workitems\n"
        "- pandora://projects/{project_id}/tasks/overview\n"
        "- pandora://projects/{project_id}/tasks/triage\n"
        "- pandora://projects/{project_id}/knowledge\n\n"
        "1) Dashboard (/):\n"
        "- O que mostra: backlog total/concluido, sprints ativas, distribuicao de work items, checkpoint/wiki/agent runs.\n"
        "- API real: GET /api/projects/{project_id}/dashboard\n"
        "- Resource MCP: pandora://projects/{project_id}/dashboard\n\n"
        "2) Backlog (/backlog):\n"
        "- Operacoes: listar e criar backlog item (title, description, story points, priority).\n"
        "- MCP: backlog_list, backlog_add\n"
        "- API real: GET/POST /api/projects/{project_id}/backlog\n\n"
        "3) Sprints (/sprints):\n"
        "- Operacoes: criar sprint com backlog_item_ids, listar work items por sprint, mover status e atribuir responsavel.\n"
        "- MCP: sprint_create, workitem_list, workitem_update\n"
        "- API real: POST /api/projects/{project_id}/sprints, POST /api/work-items/{work_item_id}/status\n\n"
        "4) Knowledge (/knowledge):\n"
        "- Operacoes na UI: wiki, checkpoints, documentacao, visao por categoria.\n"
        "- MCP Tools: knowledge_list, wiki_add, wiki_list, documentation_add, documentation_list, knowledge_checkpoint, checkpoint_list.\n"
        "- MCP Resource de leitura: pandora://projects/{project_id}/knowledge\n"
        "- API real complementar:\n"
        "  - GET /api/projects/{project_id}/knowledge\n"
        "  - POST /api/projects/{project_id}/wiki\n"
        "  - POST /api/projects/{project_id}/documentation\n"
        "  - POST /api/projects/{project_id}/checkpoints\n\n"
        "5) Projetos (seletor global no layout):\n"
        "- Operacoes: criar, listar ativos, arquivar, configurar ambiente (GitHub, local path, stack).\n"
        "- MCP: project_create, project_list, project_delete, project_config_update\n"
        "- Resource config: pandora://projects/{project_id}/config\n"
        "- API real: GET/POST /api/projects, DELETE /api/projects/{project_id}, PATCH /api/projects/{project_id}/config\n\n"
        "Fluxo recomendado objetivo:\n"
        "project_create -> project_config_update (github/path/stack) -> backlog_add/list -> sprint_create -> workitem_list/update -> knowledge_checkpoint -> validacao dashboard/knowledge via API.\n"
        f"Contexto sugerido para execucao agora: project_id='{project_id}'."
    )


@mcp.prompt(name="pandora_context_first_execute")
def pandora_context_first_execute(
    project_id: str = "<project-id>",
    work_item_id: str = "<work-item-id>",
    branch: str = "develop",
) -> str:
    """Prompt para execucao Context-First: ciclo de 5 passos para agentes antes de implementar qualquer tarefa."""
    return (
        "## Context-First Execution Flow — 5 Passos Obrigatorios\n\n"
        "Execute TODOS os passos abaixo em ordem antes de escrever qualquer codigo.\n\n"
        "### Passo 1 — Discovery (Scan do Contexto do Projeto)\n"
        "Ler o estado atual do projeto antes de qualquer acao:\n"
        f"- Resource: pandora://projects/{project_id}/context\n"
        f"- Resource: pandora://projects/{project_id}/config\n"
        "Extrair: mainBranch, localPath, techStack, sprint(s) ativo(s), work items abertos.\n\n"
        "### Passo 2 — Knowledge Warm-up (Aquecimento de Conhecimento)\n"
        "Ler o knowledge base para evitar repeticao e garantir consistencia:\n"
        f"- Resource: pandora://projects/{project_id}/knowledge\n"
        "Extrair: checkpoints recentes, wiki pages relevantes, decisoes anteriores.\n"
        "Verificar se ha constraints ou wiki_refs no backlog item relacionado.\n\n"
        "### Passo 3 — Context Injection (Injecao de Contexto)\n"
        f"Ler o work item especifico: pandora://projects/{project_id}/workitems\n"
        f"Filtrar pelo work_item_id: {work_item_id}\n"
        "Extrair: title, description, tags, branch, parentWorkItemId (se sub-task).\n"
        "Se o item tiver parentWorkItemId, ler o pai para entender o escopo maior.\n"
        "Verificar backlog item associado para ler tags, wikiRefs e constraints.\n\n"
        "### Passo 4 — Execucao (Implementacao com Manutencao Cognitiva)\n"
        "Agora sim, implementar a tarefa:\n"
        f"- workitem_update(work_item_id='{work_item_id}', status='in_progress', branch='{branch}', ...)\n"
        "Durante a implementacao:\n"
        "  - Se criar sub-tarefas: workitem_add_subtask(parent_work_item_id='...', ...)\n"
        "  - Se descobrir constraints novas: backlog_context_update(backlog_item_id='...', constraints='...')\n"
        "  - Se gerar conhecimento novo: wiki_add ou knowledge_checkpoint\n"
        "Ao concluir:\n"
        f"- workitem_update(work_item_id='{work_item_id}', status='done', feedback='...', branch='{branch}')\n\n"
        "### Passo 5 — Validation Review (Revisao de Validacao)\n"
        "Verificar o estado final antes de encerrar a sessao:\n"
        f"- Resource: pandora://projects/{project_id}/tasks/overview\n"
        f"- Resource: pandora://projects/{project_id}/tasks/triage\n"
        "Confirmar:\n"
        "  - Work item marcado como Done.\n"
        "  - Sub-tasks (se existirem) todos Done.\n"
        "  - Nenhum item bloqueado sem responsavel.\n"
        "  - Dashboard atualizado (GET /api/projects/{project_id}/dashboard).\n"
        "  - Se encerramento de sprint/epic: executar knowledge_checkpoint.\n\n"
        "### Resumo dos Recursos MCP para este Fluxo\n"
        f"- pandora://projects/{project_id}/context  (leitura completa)\n"
        f"- pandora://projects/{project_id}/config   (stack, branch, paths)\n"
        f"- pandora://projects/{project_id}/knowledge (wiki, checkpoints)\n"
        f"- pandora://projects/{project_id}/tasks/overview (visao geral)\n"
        f"- pandora://projects/{project_id}/tasks/triage   (revisao/bloqueios)\n\n"
        "### Tools de Escrita neste Fluxo\n"
        "- workitem_update       (status, branch, tokens, feedback)\n"
        "- workitem_add_subtask  (sub-tarefas recursivas)\n"
        "- backlog_context_update (tags, wiki_refs, constraints)\n"
        "- wiki_add              (documentar decisoes)\n"
        "- knowledge_checkpoint  (salvar contexto ao final de epic/sprint)\n"
    )


if __name__ == "__main__":
    mcp.run(transport=MCP_TRANSPORT, mount_path=MCP_MOUNT_PATH)
