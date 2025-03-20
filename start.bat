@echo off
cd /d "%~dp0"

:: Start Backend Server
cd server
echo Installing backend dependencies...
npm install
echo Starting backend server...
start cmd /k "npm run dev"

:: Go back to root directory
cd ..

:: Start Frontend Server
cd client
echo Installing frontend dependencies...
npm install
echo Starting frontend server...
start cmd /k "npm run dev"

echo Both backend and frontend servers are running.
exit
