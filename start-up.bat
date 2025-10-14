@echo off
setlocal

echo ==== Starting Application ====

:: Run build
echo Running npm run build...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed.
    pause
    exit /b 1
)

:: Start application in a new background window
echo Starting server in new window...
start "App Server" cmd /c "npm start"

:: Give the server a few seconds to start
timeout /t 3 >nul

:: Open localhost in default browser
echo Opening http://localhost:3000 ...
start "" "http://localhost:3000"

echo ==== Application launched successfully ====
echo ==== You may close this current window ====
pause
endlocal