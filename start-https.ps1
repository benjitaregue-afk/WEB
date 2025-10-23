# Asegurarse que el contenedor anterior está detenido
docker compose down

# Iniciar contenedor con la nueva configuración
docker compose up -d

Write-Host "`n🌐 Sitio disponible en:"
Write-Host "   https://localhost"

# Mostrar IP local para compartir
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"}).IPAddress
if ($localIP) {
    Write-Host "`n📱 Comparte este enlace en tu red local:"
    Write-Host "   https://$localIP"
}