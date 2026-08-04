# 海贼王 Agent 查询工具
# 使用方法: .\ask-agent.ps1 "你的问题"

param(
    [Parameter(Mandatory=$true)]
    [string]$query
)

$body = [System.Text.Encoding]::UTF8.GetBytes("{`"query`":`"$query`"}")

$result = Invoke-RestMethod -Uri "http://localhost:8080/api/agent/query" `
    -Method POST `
    -ContentType "application/json; charset=utf-8" `
    -Body $body

Write-Host ""
Write-Host "问题: $query" -ForegroundColor Cyan
Write-Host "回答: $($result.answer)" -ForegroundColor Green
Write-Host ""