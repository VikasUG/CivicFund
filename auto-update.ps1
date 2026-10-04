# Auto-update frontend contract address when Hardhat starts
Write-Host "🔄 Auto-update script started..." -ForegroundColor Yellow

# Wait a moment for Hardhat to fully start
Start-Sleep -Seconds 3

# Run the auto-update script
try {
    Set-Location web3
    npx hardhat run scripts/auto-update-frontend.js --network localhost
    Write-Host "✅ Auto-update completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Auto-update failed:" $_.Exception.Message -ForegroundColor Red
}

# Keep the script running to monitor for changes
Write-Host "👀 Monitoring for contract changes..." -ForegroundColor Yellow

# Monitor the hardhat output for new deployments
while ($true) {
    Start-Sleep -Seconds 5
    # You can add more sophisticated monitoring here if needed
}
