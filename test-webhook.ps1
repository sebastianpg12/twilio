# Test webhook script
Write-Host "Probando webhook..." -ForegroundColor Green

$body = "From=whatsapp:+1234567890&Body=Hola necesito ayuda&MediaUrl0="
$response = Invoke-RestMethod -Uri "http://localhost:3000/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body

Write-Host "Respuesta del servidor:" -ForegroundColor Yellow
Write-Host $response

Write-Host "`nVerificando estado:" -ForegroundColor Green
$status = Invoke-RestMethod -Uri "http://localhost:3000/auto-response-status" -Method GET
Write-Host "Estado automático: $($status.status)" -ForegroundColor Cyan
