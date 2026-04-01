import urllib.request, json
base = 'http://localhost:8480/api'
hdrs = {'X-Api-Key': 'dev-api-key', 'Content-Type': 'application/json'}
pid = '38f59307-bf02-4712-a55e-a654b821b216'
def post(path, payload):
    req = urllib.request.Request(f'{base}/{path}', data=json.dumps(payload).encode('utf-8'), headers=hdrs, method='POST')
    return json.loads(urllib.request.urlopen(req).read())

b = post('projects/' + pid + '/backlog', {
    'projectId': pid, 'title': 'Vanilla Devlake Refactor', 'description': 'Refactor to vanilla devlake to fix Windows Nginx port/crlf bugs', 'storyPoints': 5, 'priority': 1
})
print('Backlog:', b['id'])

s = post('projects/' + pid + '/sprints', {
    'projectId': pid, 'name': 'Sprint Devlake Fixes', 'goal': 'Migrate DevLake to vanilla compose and fix port 500 errors', 'startDate': '2026-04-01T00:00:00Z', 'endDate': '2026-04-07T00:00:00Z', 'backlogItemIds': [b['id']]
})
print('Sprint:', s['id'])

t1 = post('projects/' + pid + '/backlog/' + b['id'] + '/workitems', {
    'projectId': pid, 'title': 'Fetch Vanilla Compose', 'description': 'Download docker-compose.yml and env.example', 'sprintId': s['id']
})
t2 = post('projects/' + pid + '/backlog/' + b['id'] + '/workitems', {
    'projectId': pid, 'title': 'Sanitize Scripts CRLF', 'description': 'Fix line endings that break Nginx target config', 'sprintId': s['id']
})
t3 = post('projects/' + pid + '/backlog/' + b['id'] + '/workitems', {
    'projectId': pid, 'title': 'Isolate .env from app Mount', 'description': 'Remove config mapped as directory and map correctly', 'sprintId': s['id']
})
print('Tasks created!')
