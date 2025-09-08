@echo off
echo ========================================
echo  INICIANDO SERVIDOR DE CORREOS
echo  Academia Piensa Ajedrez - IONOS SMTP
echo ========================================
cd email-server
echo Instalando dependencias...
npm install
echo.
echo Iniciando servidor...
npm start
pause




