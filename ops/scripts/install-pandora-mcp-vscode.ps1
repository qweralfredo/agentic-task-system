param(
    [switch]$OpenInstallLink
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$vscodeDir = Join-Path $repoRoot ".vscode"
$mcpFile = Join-Path $vscodeDir "mcp.json"

if (-not (Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Path $vscodeDir | Out-Null
}

$config = $null
if (Test-Path $mcpFile) {
    $raw = Get-Content -Raw -Path $mcpFile
    if (-not [string]::IsNullOrWhiteSpace($raw)) {
        try {
            $config = $raw | ConvertFrom-Json
        }
        catch {
            throw "Arquivo mcp.json invalido em $mcpFile. Corrija o JSON e rode novamente."
        }
    }
}

if ($null -eq $config) {
    $config = [pscustomobject]@{}
}

if ($null -eq $config.servers) {
    $config | Add-Member -NotePropertyName "servers" -NotePropertyValue ([pscustomobject]@{})
}

$pandoraServer = [pscustomobject]@{
    type = "http"
    url = "http://127.0.0.1:58080/mcp"
}

$servers = $config.servers
if ($servers.PSObject.Properties.Match("pandora-todo-list-mcp").Count -eq 0) {
    $servers | Add-Member -NotePropertyName "pandora-todo-list-mcp" -NotePropertyValue $pandoraServer
}
else {
    $servers."pandora-todo-list-mcp" = $pandoraServer
}

$json = $config | ConvertTo-Json -Depth 20
Set-Content -Path $mcpFile -Value $json -Encoding UTF8

Write-Host "MCP do Pandora configurado com sucesso em: $mcpFile"
Write-Host "Reabra o VS Code ou execute o comando 'Developer: Reload Window'."

if ($OpenInstallLink) {
    $deepLink = "vscode:mcp/install?%7B%22name%22%3A%22pandora-todo-list-mcp%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22http%3A%2F%2F127.0.0.1%3A58080%2Fmcp%22%7D"

    $opened = $false
    $codeCmd = Get-Command code -ErrorAction SilentlyContinue
    if ($null -ne $codeCmd) {
        try {
            code --open-url $deepLink | Out-Null
            $opened = $true
            Write-Host "Deep link enviado via 'code --open-url'."
        }
        catch {
            Write-Host "Falha ao abrir via code CLI, tentando fallback do sistema..."
        }
    }

    if (-not $opened) {
        try {
            Start-Process $deepLink | Out-Null
            $opened = $true
            Write-Host "Deep link enviado via Start-Process."
        }
        catch {
            Write-Host "Nao foi possivel abrir automaticamente o deep link."
        }
    }

    if (-not $opened) {
        Write-Host "Abra manualmente no terminal: code --open-url $deepLink"
    }
}
