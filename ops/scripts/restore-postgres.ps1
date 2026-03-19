param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string]$ContainerName = "agentic-postgres",
    [string]$Database = "agentic_todolist",
    [string]$User = "agentic"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $FilePath)) {
    throw "Backup file not found: $FilePath"
}

Get-Content -Path $FilePath -Raw | docker exec -i $ContainerName psql -U $User -d $Database
if ($LASTEXITCODE -ne 0) {
    throw "Restore failed. Check container status and SQL file content."
}

Write-Host "Restore completed from $FilePath"
