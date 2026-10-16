@echo off
chcp 65001 > nul
echo ========================================================
echo        PUBLICANDO ECOURBANO NO GITHUB
echo ========================================================
echo.
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\Git\ucrt64\bin;%PATH%"
cd /d "%~dp0"
echo Repositorio: https://github.com/Saady-Crispim/EcoUrbano-Sistema-Distribu-do.git
echo.
git status
echo.
echo Enviando branch main para o GitHub...
echo (Uma janela do navegador ou login pode se abrir para autorizar o GitHub)
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [OK] Sucesso! Codigo publicado no GitHub com sucesso!
    echo ========================================================
) else (
    echo ========================================================
    echo  [!] Falha ou cancelamento na autenticacao do GitHub.
    echo ========================================================
)
echo.
pause
