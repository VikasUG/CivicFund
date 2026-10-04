# Start Hardhat node with automatic frontend contract address update
Write-Host "🚀 Starting Hardhat node with auto-update..." -ForegroundColor Yellow

# Start Hardhat node in background
$hardhatJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\web3
    npx hardhat node
}

# Wait for Hardhat to start
Write-Host "⏳ Waiting for Hardhat node to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if Hardhat is running
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:8545" -TimeoutSec 2 -UseBasicParsing | Out-Null
    Write-Host "✅ Hardhat node is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Hardhat node failed to start" -ForegroundColor Red
    exit 1
}

# Deploy contract and update frontend
Write-Host "🔄 Deploying contract and updating frontend..." -ForegroundColor Yellow
Set-Location web3

try {
    # Deploy contract
    npx hardhat run scripts/deploy.js --network localhost
    
    # Update frontend with new contract address
    npx hardhat run scripts/auto-update-frontend.js --network localhost
    
    Write-Host "✅ Contract deployed and frontend updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment or update failed:" $_.Exception.Message -ForegroundColor Red
}

# Keep the script running
Write-Host "🟢 Hardhat node is running. Press Ctrl+C to stop." -ForegroundColor Green
Wait-Job $hardhatJob
