# Crear directorio SSL si no existe
New-Item -ItemType Directory -Force -Path .\ssl | Out-Null

Write-Host "`n🔒 Generando certificado SSL local...`n"

# Generar certificado autofirmado
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -KeySpec KeyExchange

# Exportar certificado y clave privada
$pwd = ConvertTo-SecureString -String "neuromirror" -Force -AsPlainText
$certPath = ".\ssl\cert.pfx"
Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $pwd | Out-Null

# Convertir a formato PEM para nginx
Write-Host "🔄 Convirtiendo certificado a formato PEM..."
openssl pkcs12 -in $certPath -clcerts -nokeys -out .\ssl\cert.pem -passin pass:neuromirror
openssl pkcs12 -in $certPath -nocerts -nodes -out .\ssl\key.pem -passin pass:neuromirror

# Instalar certificado en almacén de confianza local
Write-Host "📜 Instalando certificado en almacén de confianza local..."
Import-PfxCertificate -FilePath $certPath -CertStoreLocation Cert:\LocalMachine\Root -Password $pwd | Out-Null

Write-Host "`n✅ Certificado SSL generado y configurado."
Write-Host "   Ahora puedes ejecutar: docker compose up -d`n"

# Limpiar archivo pfx temporal
Remove-Item $certPath

Write-Host "🌐 URLs disponibles después de iniciar Docker:"
Write-Host "   https://localhost"
Write-Host "   http://localhost (redirige a HTTPS)`n"

Write-Host "📱 Para acceder desde otros dispositivos:"
Write-Host "   1. Obtén tu IP local:"
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"}).IPAddress
if ($localIP) {
    Write-Host "      $localIP"
    Write-Host "   2. Comparte: https://$localIP"
} else {
    Write-Host "      Ejecuta 'ipconfig' para ver tu IP"
}
Write-Host "`n⚠️  Importante: otros dispositivos necesitarán instalar el certificado SSL para confiar en la conexión.`n"