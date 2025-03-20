@echo off
cd /d "%~dp0"

:: Install Backend Dependencies
echo Installing backend dependencies...
cd server
npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies. Exiting...
    exit /b %errorlevel%
)
cd ..

