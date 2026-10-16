@echo off
title EcoUrbano - Iniciador Automatico
color 0A

echo ===========================================================================
echo    ECOURBANO - Sistema Distribuido de Monitoramento Ambiental Urbano
echo    UNIP Jundiai - Ciencia da Computacao - APS 7o e 8o Semestres
echo ===========================================================================
echo.

REM 1. Verificar se Node.js esta disponivel
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Node.js nao encontrado diretamente no PATH. Verificando locais padrao...
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;%APPDATA%\npm;%PATH%"
    )
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] O Node.js nao foi encontrado no sistema.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado com sucesso:
call node --version
echo.

REM 2. Verificar dependencias do Backend
echo ---------------------------------------------------------------------------
echo [1/3] Verificando dependencias do Backend...
echo ---------------------------------------------------------------------------
pushd "%~dp0Backend"
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias do Backend...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias do Backend.
        popd
        pause
        exit /b 1
    )
    echo [OK] Dependencias do Backend instaladas!
) else (
    echo [OK] Dependencias do Backend ja estao instaladas.
)
popd
echo.

REM 3. Detectar IP da rede local e configurar o App.js
echo ---------------------------------------------------------------------------
echo [2/3] Detectando IP na rede local e configurando Mobile...
echo ---------------------------------------------------------------------------
node "%~dp0configurar_ip.js"
echo.

REM 4. Verificar dependencias do Mobile
echo ---------------------------------------------------------------------------
echo [3/3] Verificando dependencias do Mobile...
echo ---------------------------------------------------------------------------
pushd "%~dp0Mobile"
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias do Mobile...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias do Mobile.
        popd
        pause
        exit /b 1
    )
    echo [OK] Dependencias do Mobile instaladas!
) else (
    echo [OK] Dependencias do Mobile ja estao instaladas.
)
popd
echo.

REM 5. Iniciar Servidor Backend em nova janela
echo ===========================================================================
echo INICIANDO O ECOURBANO
echo ===========================================================================
echo.
echo [SERVIDOR] Abrindo janela dedicada do Backend...
start "EcoUrbano - SERVIDOR BACKEND (Mantenha aberto)" cmd /k "cd /d ""%~dp0Backend"" && node server.js"
echo [OK] Janela do servidor Backend iniciada!
echo.

REM Pausa de 2 segundos para dar tempo do servidor subir
ping 127.0.0.1 -n 3 >nul

REM 6. Iniciar o Metro Bundler do Expo
echo [MOBILE] Iniciando Expo Metro Bundler...
echo.
echo ===========================================================================
echo  INSTRUCOES PARA ACESSAR NO CELULAR:
echo  1. Conecte o celular na mesma rede Wi-Fi do computador.
echo  2. Abra o app 'Expo Go' no seu celular (Android ou iPhone).
echo  3. Escaneie o QR Code que sera gerado abaixo.
echo ===========================================================================
echo.

pushd "%~dp0Mobile"
call npx expo start
popd

echo.
echo [INFO] O processo do EcoUrbano foi encerrado.
pause
