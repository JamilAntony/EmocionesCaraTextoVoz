# Script para iniciar servicios individuales manualmente
# Útil para desarrollo

Write-Host "🔧 Iniciador de Servicios Individual" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Selecciona el servicio a iniciar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Facial Service (puerto 8001)" -ForegroundColor White
Write-Host "2. Voice Service (puerto 8002)" -ForegroundColor White
Write-Host "3. Text Service (puerto 8003)" -ForegroundColor White
Write-Host "4. Fusion Service (puerto 8004)" -ForegroundColor White
Write-Host "5. Frontend (puerto 3000)" -ForegroundColor White
Write-Host "6. Todos los servicios" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Ingresa el número"

$backendPath = (Get-Location).Path + "\backend"

switch ($choice) {
    "1" {
        Write-Host "Iniciando Facial Service..." -ForegroundColor Green
        Set-Location "$backendPath\services\facial"
        ..\..\venv\Scripts\Activate.ps1
        uvicorn main:app --reload --port 8001
    }
    "2" {
        Write-Host "Iniciando Voice Service..." -ForegroundColor Green
        Set-Location "$backendPath\services\voice"
        ..\..\venv\Scripts\Activate.ps1
        uvicorn main:app --reload --port 8002
    }
    "3" {
        Write-Host "Iniciando Text Service..." -ForegroundColor Green
        Set-Location "$backendPath\services\text"
        ..\..\venv\Scripts\Activate.ps1
        uvicorn main:app --reload --port 8003
    }
    "4" {
        Write-Host "Iniciando Fusion Service..." -ForegroundColor Green
        Set-Location "$backendPath\services\fusion"
        ..\..\venv\Scripts\Activate.ps1
        uvicorn main:app --reload --port 8004
    }
    "5" {
        Write-Host "Iniciando Frontend..." -ForegroundColor Green
        Set-Location "frontend"
        npm run dev
    }
    "6" {
        Write-Host "Ejecutando script de inicio completo..." -ForegroundColor Green
        .\start-services.ps1
    }
    default {
        Write-Host "Opción inválida" -ForegroundColor Red
    }
}
