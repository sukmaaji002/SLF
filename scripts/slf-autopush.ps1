param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [switch]$Once
)

$ErrorActionPreference = 'Stop'
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'Never'
Set-Location -LiteralPath $ProjectRoot

$expectedRemote = 'https://github.com/sukmaaji002/SLF.git'
$gitDir = git rev-parse --absolute-git-dir
if ($LASTEXITCODE -ne 0) { throw 'Folder proyek Git tidak ditemukan.' }

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments)][string[]]$GitArgs)
    $ErrorActionPreference = 'Continue'
    $output = & git @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) { throw ($output -join [Environment]::NewLine) }
    $output
}

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    Add-Content -LiteralPath (Join-Path $gitDir 'slf-autopush.log') -Value $line
    if ($Once) { Write-Output $line }
}

function Sync-Project {
    if ((Invoke-Git remote get-url --push origin) -cne $expectedRemote) {
        throw 'URL push origin tidak cocok dengan repo SLF.'
    }
    if ((Invoke-Git branch --show-current) -cne 'main') { return }
    foreach ($operation in @('MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply','BISECT_LOG','sequencer')) {
        if (Test-Path -LiteralPath (Join-Path $gitDir $operation)) { return }
    }

    $changes = Invoke-Git status --porcelain=v1 --untracked-files=normal
    if ($changes) {
        if (!$Once) { Start-Sleep -Seconds 3 }
        if ((Invoke-Git branch --show-current) -cne 'main') { return }
        Invoke-Git add -A -- . | Out-Null
        $staged = Invoke-Git diff --cached --name-only
        if ($staged) {
            Invoke-Git -c user.name=sukmaaji002 -c user.email=351895614+sukmaaji002@users.noreply.github.com commit -m 'Update Daftar Simak SLF' | Out-Null
            Write-Log "Commit $(Invoke-Git rev-parse --short HEAD) dibuat."
        }
    }

    if ((Invoke-Git rev-parse HEAD) -ne (Invoke-Git rev-parse refs/remotes/origin/main)) {
        Invoke-Git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 push origin HEAD:refs/heads/main | Out-Null
        Write-Log "Commit $(Invoke-Git rev-parse --short HEAD) berhasil dikirim ke origin/main."
    }
}

$lockPath = Join-Path $gitDir 'slf-autopush.lock'
$lock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::Write, [IO.FileShare]::None)
try {
    if ($Once) {
        Sync-Project
    } else {
        Write-Log 'Pemantau push otomatis berjalan.'
        while ($true) {
            try {
                Sync-Project
                Start-Sleep -Seconds 4
            } catch {
                Write-Log "Push otomatis tertunda: $($_.Exception.Message)"
                Start-Sleep -Seconds 30
            }
        }
    }
} finally {
    $lock.Dispose()
}
