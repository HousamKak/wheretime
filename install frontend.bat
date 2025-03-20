:: Install Frontend Dependencies
echo Installing frontend dependencies...
cd client
npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies. Exiting...
    exit /b %errorlevel%
)
