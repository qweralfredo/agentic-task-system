import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8480/api"
PROJECT_ID = "2ec6a26b-2fa8-4c72-8bea-22ac2ed248f2"

print("\n" + "="*70)
print("CENÁRIO DE TESTE COMPLETO: Pandora Todo List v2.1")
print("="*70)

# IDs dos backlog items já criados
backlog_ids = {
    "oauth_setup": "4cfb8e92-1b4d-422d-958a-5bc93d5a407d",
    "auth_endpoint": "57c52a6e-dfe4-4271-a268-0de9abedc241",
    "auth_ui": "e7099957-010f-4bea-b01d-7054039c503c",
    "session_mgmt": "ac06e3e0-61a6-4f6f-9627-d94739fc887a"
}

# 1. CRIAR SPRINT
print("\n[1] Criando Sprint...")
sprint_payload = {
    "projectId": PROJECT_ID,
    "name": "Sprint 1: OAuth2 Foundation",
    "goal": "Setup OAuth2 infrastructure, implement core authentication endpoints, and build login UI",
    "startDate": "2026-03-21",
    "endDate": "2026-04-04",
    "backlogItemIds": list(backlog_ids.values())
}

try:
    sprint_resp = requests.post(f"{BASE_URL}/sprints", json=sprint_payload)
    if sprint_resp.status_code in [200, 201]:
        sprint = sprint_resp.json()
        sprint_id = sprint.get('id')
        print(f"    ? Sprint criado: {sprint_id}")
        print(f"      Nome: {sprint['name']}")
        print(f"      Período: {sprint['startDate']} até {sprint['endDate']}")
    else:
        print(f"    ? Erro: {sprint_resp.status_code} - {sprint_resp.text}")
        sprint_id = None
except Exception as e:
    print(f"    ? Erro: {e}")
    sprint_id = None

print("\n[2] Criando Work Items com BRANCHES...")

# 2. CRIAR WORK ITEMS COM BRANCHES (simular contexto-first)
work_items = []

work_item_configs = [
    {
        "backlog_id": backlog_ids["oauth_setup"],
        "title": "Setup OAuth2 provider configuration",
        "branch": "feat/oauth2-config",
        "tags": "authentication,security,backend,infrastructure",
        "status": "in_progress"
    },
    {
        "backlog_id": backlog_ids["auth_endpoint"],
        "title": "Implement authentication endpoint",
        "branch": "feat/auth-endpoints",
        "tags": "authentication,backend,api,jwt",
        "status": "in_progress"
    },
    {
        "backlog_id": backlog_ids["auth_ui"],
        "title": "Create authentication frontend UI",
        "branch": "feat/auth-ui",
        "tags": "authentication,frontend,ui,react",
        "status": "todo"
    },
    {
        "backlog_id": backlog_ids["session_mgmt"],
        "title": "Add refresh token and session management",
        "branch": "feat/session-management",
        "tags": "authentication,session,security,backend",
        "status": "todo"
    }
]

work_item_ids = {}

for config in work_item_configs:
    backlog_id = config["backlog_id"]
    
    # Buscar o trabalho item associado ao backlog
    try:
        backlog_resp = requests.get(f"{BASE_URL}/backlog-items/{backlog_id}")
        if backlog_resp.status_code == 200:
            backlog_item = backlog_resp.json()
            if backlog_item.get('workItems'):
                work_item = backlog_item['workItems'][0]
                work_item_id = work_item['id']
                work_item_ids[config["title"]] = work_item_id
                print(f"    ? Work Item: {config['title']}")
                print(f"      ID: {work_item_id}")
                print(f"      Branch: {config['branch']}")
                print(f"      Tags: {config['tags']}")
            else:
                print(f"    ? Nenhum work item para {config['title']}")
    except Exception as e:
        print(f"    ? Erro ao buscar work item: {e}")

print("\n[3] Atualizando Work Items com BRANCH TRACKING...")
# 3. ATUALIZAR WORK ITEMS COM BRANCH VIA API
for i, config in enumerate(work_item_configs):
    if i < len(work_item_ids):
        work_item_id = list(work_item_ids.values())[i]
        
        update_payload = {
            "status": config["status"],
            "branch": config["branch"],
            "tags": config["tags"]
        }
        
        try:
            update_resp = requests.patch(f"{BASE_URL}/work-items/{work_item_id}", json=update_payload)
            if update_resp.status_code in [200, 204]:
                print(f"    ? {config['title']}")
                print(f"      Status: {config['status']} | Branch: {config['branch']}")
            else:
                print(f"    ? Resposta: {update_resp.status_code}")
        except Exception as e:
            print(f"    ? Erro: {e}")

