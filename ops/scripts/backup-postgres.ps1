param(
    [string]$ContainerName = "agentic-postgres",
    [string]$Database = "agentic_todolist",
    [string]$User = "agentic"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root "postgres\backups"
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir ("agentic_todolist-" + $timestamp + ".sql")

$dump = docker exec $ContainerName pg_dump -U $User -d $Database
if ($LASTEXITCODE -ne 0) {
    throw "Backup failed. Ensure container '$ContainerName' is running."
}

$dump | Set-Content -Path $backupFile -Encoding UTF8
Write-Host "Backup created at $backupFile"
