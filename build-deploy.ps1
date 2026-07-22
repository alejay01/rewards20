$ErrorActionPreference = "Stop"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " Building Boudin Boss Rewards for Deployment" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Build Client & Server
Write-Host "`n[1/3] Compiling React Client and Express Server..." -ForegroundColor Yellow
npm run build

# 2. Prepare Deployment Folder
Write-Host "`n[2/3] Assembling deployment package..." -ForegroundColor Yellow
$deployDir = "boudin-rewards-deploy"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy required production files
Copy-Item -Path "server/dist" -Destination "$deployDir/dist" -Recurse
Copy-Item -Path "server/migrations" -Destination "$deployDir/migrations" -Recurse
Copy-Item -Path "server/package.json" -Destination "$deployDir/package.json"
if (Test-Path "server/package-lock.json") {
    Copy-Item -Path "server/package-lock.json" -Destination "$deployDir/package-lock.json"
}

# 3. Zip the deployment package
Write-Host "`n[3/3] Creating ZIP archive for Hostinger..." -ForegroundColor Yellow
$zipPath = "boudin-rewards-deploy.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host " Deployment Package Ready: boudin-rewards-deploy.zip" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "`nInstructions for Hostinger Deployment:"
Write-Host "1. Log into your Hostinger hPanel."
Write-Host "2. Go to your Node.js application or File Manager."
Write-Host "3. Upload 'boudin-rewards-deploy.zip' and extract it to your application's root directory."
Write-Host "4. Run 'npm install' in the hostinger terminal (or let the Hostinger dashboard do it)."
Write-Host "5. Restart the Node.js application from the Hostinger dashboard."
Write-Host "`nNote: Your database migrations will run automatically on startup."
