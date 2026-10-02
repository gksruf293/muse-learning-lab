param([ValidateSet('claude','codex')][string]$Provider = 'codex')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$ghCandidate = Join-Path (Split-Path $PSScriptRoot -Parent) '.tools\gh\bin\gh.exe'
if (Test-Path -LiteralPath $ghCandidate) { $env:MUSE_GH_PATH = $ghCandidate }
elseif (Get-Command gh -ErrorAction SilentlyContinue) { $env:MUSE_GH_PATH = (Get-Command gh).Source }
else { throw 'GitHub CLI를 설치하고 gh auth login을 실행하세요.' }
$npmTaskRoot = Join-Path $env:USERPROFILE '.npm-global\node_modules'
$claudeCandidate = Join-Path $npmTaskRoot '@anthropic-ai\claude-code\bin\claude.exe'
$codexCandidate = Join-Path $npmTaskRoot '@openai\codex\bin\codex.js'
if (Test-Path -LiteralPath $claudeCandidate) { $env:MUSE_CLAUDE_PATH = $claudeCandidate }
if (Test-Path -LiteralPath $codexCandidate) { $env:MUSE_CODEX_PATH = $codexCandidate }
# 이미 Git Credential Manager에 저장된 인증이 있으면 현재 프로세스에서만 사용합니다.
$hadToken = [bool]$env:GH_TOKEN
if (-not $hadToken) {
  & $env:MUSE_GH_PATH auth status *> $null
  if ($LASTEXITCODE -ne 0) {
    $credentialText = "protocol=https`nhost=github.com`n`n" | git credential fill 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'gh auth login으로 GitHub 로그인 후 다시 실행하세요.' }
    foreach ($credentialLine in $credentialText) {
      if ($credentialLine.StartsWith('password=')) { $env:GH_TOKEN = $credentialLine.Substring(9) }
    }
    if (-not $env:GH_TOKEN) { throw 'GitHub 인증을 확인하세요.' }
  }
}
try {
  $configText = @{repo='gksruf293/muse-learning-lab';provider=$Provider;pollSeconds=60;port=3847} | ConvertTo-Json
  [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot 'local.config.json'), $configText)
  node scripts/server.mjs
} finally {
  if (-not $hadToken -and $env:GH_TOKEN) { Remove-Item Env:GH_TOKEN }
}
