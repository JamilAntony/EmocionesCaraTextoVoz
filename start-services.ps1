# Script para iniciar todos los servicios
# Sistema Multimodal de Reconocimiento de Emociones

Write-Host "🚀 Iniciando Sistema de Reconocimiento de Emociones" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que exista el entorno virtual
if (!(Test-Path "backend\venv")) {
    Write-Host "✗ Entorno virtual no encontrado. Ejecuta primero: .\setup.ps1" -ForegroundColor Red
    exit 1
}

# Función para iniciar un servicio en una nueva ventana
function Start-Service {
    param (
        [string]$Title,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Iniciando $Title..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; $Command" -WindowStyle Normal
}

# Iniciar servicios del backend
Write-Host "📦 Iniciando microservicios del backend..." -ForegroundColor Cyan
Write-Host ""

$backendPath = (Get-Location).Path + "\backend"

Start-Service "Facial Service (8001)" "$backendPath\services\facial" "..\..\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8001"
Start-Sleep -Seconds 2

Start-Service "Voice Service (8002)" "$backendPath\services\voice" "..\..\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8002"
Start-Sleep -Seconds 2

Start-Service "Text Service (8003)" "$backendPath\services\text" "..\..\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8003"
Start-Sleep -Seconds 2

Start-Service "Fusion Service (8004)" "$backendPath\services\fusion" "..\..\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8004"
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host ""
Write-Host "🎨 Iniciando frontend..." -ForegroundColor Cyan
$frontendPath = (Get-Location).Path + "\frontend"
Start-Service "Frontend (3000)" "$frontendPath" "npm run dev"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✓ Todos los servicios iniciados" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs disponibles:" -ForegroundColor Cyan
Write-Host "   Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "   Facial API:      http://localhost:8001/docs" -ForegroundColor White
Write-Host "   Voice API:       http://localhost:8002/docs" -ForegroundColor White
Write-Host "   Text API:        http://localhost:8003/docs" -ForegroundColor White
Write-Host "   Fusion API:      http://localhost:8004/docs" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Nota: Los servicios tardarán unos segundos en estar listos" -ForegroundColor Yellow
Write-Host "⚠️  La primera vez descargará modelos (puede tardar varios minutos)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para detener todos los servicios, cierra las ventanas de PowerShell" -ForegroundColor Gray
Write-Host ""
