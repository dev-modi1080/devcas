# fix-npm.ps1 - Run as Administrator to repair npm and PATH settings

Write-Host "Repairing npm and Windows PATH configuration..." -ForegroundColor Cyan

# 1. Clean Machine (System) PATH
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$machinePathClean = ($machinePath -split ';' | Where-Object { $_ -and $_ -notlike '*node_modules\npm\bin*' }) -join ';'
if (-not (($machinePathClean -split ';') -contains 'C:\Program Files\nodejs\') -and -not (($machinePathClean -split ';') -contains 'C:\Program Files\nodejs')) {
    $machinePathClean = "$machinePathClean;C:\Program Files\nodejs\"
}
[Environment]::SetEnvironmentVariable("Path", $machinePathClean, "Machine")
Write-Host "[OK] Cleaned System PATH" -ForegroundColor Green

# 2. Clean User PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userPathClean = ($userPath -split ';' | Where-Object { $_ -and $_ -notlike '*node_modules\npm\bin*' }) -join ';'
[Environment]::SetEnvironmentVariable("Path", $userPathClean, "User")
Write-Host "[OK] Cleaned User PATH" -ForegroundColor Green

# 3. Fix C:\Program Files\nodejs\npm.cmd
$npmCmdContent = @"
@ECHO OFF
SETLOCAL
SET "NODE_EXE=%~dp0node.exe"
IF NOT EXIST "%NODE_EXE%" SET "NODE_EXE=node"
"%NODE_EXE%" "%~dp0node_modules\npm\bin\npm-cli.js" %*
"@
Set-Content -Path "C:\Program Files\nodejs\npm.cmd" -Value $npmCmdContent -Encoding Ascii
Write-Host "[OK] Fixed C:\Program Files\nodejs\npm.cmd" -ForegroundColor Green

# 4. Remove conflicting ps1 files from node_modules/npm/bin so they never shadow the main binaries
$nestedBin = "C:\Program Files\nodejs\node_modules\npm\bin"
if (Test-Path "$nestedBin\npm.ps1") { Remove-Item "$nestedBin\npm.ps1" -Force -ErrorAction SilentlyContinue }
if (Test-Path "$nestedBin\npx.ps1") { Remove-Item "$nestedBin\npx.ps1" -Force -ErrorAction SilentlyContinue }
Write-Host "[OK] Removed nested npm.ps1 / npx.ps1 shims" -ForegroundColor Green

Write-Host "`nAll repairs completed! Please restart your terminal/VS Code and run 'npm i'." -ForegroundColor Green
