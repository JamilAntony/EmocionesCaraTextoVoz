# Script de instalación y configuración del proyecto
# Sistema Multimodal de Reconocimiento de Emociones

Write-Host "🎭 Sistema Multimodal de Reconocimiento de Emociones" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Python
Write-Host "📋 Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ $pythonVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ Python no encontrado. Por favor instala Python 3.12+" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js $nodeVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js no encontrado. Por favor instala Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Configurando Backend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Crear entorno virtual
if (!(Test-Path "backend\venv")) {
    Write-Host "Creando entorno virtual..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    Set-Location ..
    Write-Host "✓ Entorno virtual creado" -ForegroundColor Green
} else {
    Write-Host "✓ Entorno virtual ya existe" -ForegroundColor Green
}

# Copiar .env si no existe
if (!(Test-Path "backend\.env")) {
    Write-Host "Copiando archivo de configuración..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Green
}

# Instalar dependencias Python
Write-Host "Instalando dependencias de Python (esto puede tardar varios minutos)..." -ForegroundColor Yellow
Set-Location backend
.\venv\Scripts\Activate.ps1
pip install --upgrade pip | Out-Null
pip install -r requirements.txt
Set-Location ..
Write-Host "✓ Dependencias de Python instaladas" -ForegroundColor Green

Write-Host ""
Write-Host "🎨 Configurando Frontend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Copiar .env si no existe
if (!(Test-Path "frontend\.env")) {
    Write-Host "Copiando archivo de configuración..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Green
}

# Instalar dependencias Node.js
Write-Host "Instalando dependencias de Node.js..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..
Write-Host "✓ Dependencias de Node.js instaladas" -ForegroundColor Green

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✓ ¡Instalación completada exitosamente!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar bases de datos (PostgreSQL y Redis):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   docker-compose up -d postgres redis" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ejecutar microservicios del backend (4 terminales):" -ForegroundColor White
Write-Host "   Terminal 1: cd backend\services\facial; uvicorn main:app --reload --port 8001" -ForegroundColor Gray
Write-Host "   Terminal 2: cd backend\services\voice; uvicorn main:app --reload --port 8002" -ForegroundColor Gray
Write-Host "   Terminal 3: cd backend\services\text; uvicorn main:app --reload --port 8003" -ForegroundColor Gray
Write-Host "   Terminal 4: cd backend\services\fusion; uvicorn main:app --reload --port 8004" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "O usa el script de inicio rápido:" -ForegroundColor Yellow
Write-Host "   .\start-services.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8004/docs" -ForegroundColor White
Write-Host ""
