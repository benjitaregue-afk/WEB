# Get local IP address for sharing
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress

# If no Wi-Fi, try Ethernet
if (!$localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress
}

Write-Host "`n🌐 Starting local server...`n"

# Install http-server if needed (will prompt)
if (!(Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❗ Node.js is required. Please install from https://nodejs.org/`n"
    exit 1
}

Write-Host "📱 Share these links with devices on your network:"
if ($localIP) {
    Write-Host "   http://${localIP}:8080"
    Write-Host "   http://${localIP}:8080/index.html`n"
}

Write-Host "💻 Local access:"
Write-Host "   http://localhost:8080"
Write-Host "   http://localhost:8080/index.html`n"

Write-Host "Press Ctrl+C to stop the server`n"

# Run server allowing external access (--host 0.0.0.0)
npx http-server . --port 8080 -c-1 --host 0.0.0.0