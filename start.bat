@echo off
cd /d "%~dp0"

:: Start the backend server
cd server
start cmd /k "npm run dev"

:: Go back to the root directory
cd ..

:: Start the frontend server
cd client
start cmd /k "npm run dev"

echo Both backend and frontend servers are running.
exit
