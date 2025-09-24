@echo off
setlocal enabledelayedexpansion

:: -------------------------
:: CONFIGURATION
:: -------------------------
set "REPO_URL=https://github.com/AlexKjam64/Investigating-Project.git"
set "TOOLS_DIR=tools"
set "FEROX_URL=https://github.com/epi052/feroxbuster/releases/download/v2.12.0/x86_64-windows-feroxbuster.exe.zip"
set "FFUF_URL=https://github.com/ffuf/ffuf/releases/download/v2.1.0/ffuf_2.1.0_windows_amd64.zip"

:: -------------------------
:: HELPER: FIND EXECUTABLES
:: -------------------------
echo ==== Checking for Git ====
where git >nul 2>&1
if errorlevel 1 (
    echo Git not found! Please install Git: https://git-scm.com/download/win
    pause & exit /b 1
) else (
    for /f "delims=" %%i in ('where git') do set "GIT_EXE=%%i"
)
echo Git found: %GIT_EXE%

echo ==== Checking for Node.js/npm ====
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js not found! Installing Node.js...
    powershell -Command "Invoke-WebRequest https://nodejs.org/dist/v20.8.1/node-v20.8.1-x64.msi -OutFile $env:TEMP\node.msi"
    msiexec /i "%TEMP%\node.msi" /quiet /norestart
)
where node >nul 2>&1 || (echo ERROR: Node installation failed & pause & exit /b 1)

for /f "delims=" %%i in ('where node') do set "NODE_EXE=%%i"
for /f "delims=" %%i in ('where npm') do set "NPM_EXE=%%i"
echo Node: %NODE_EXE%
echo npm: %NPM_EXE%

echo ==== Checking for Python3 ====
where python >nul 2>&1
if errorlevel 1 (
    echo Python3 not found! Installing Python3...
    powershell -Command "Invoke-WebRequest https://www.python.org/ftp/python/3.12.2/python-3.12.2-amd64.exe -OutFile $env:TEMP\python.exe"
    start /wait "" "%TEMP%\python.exe" /quiet InstallAllUsers=1 PrependPath=1
)
where python >nul 2>&1 || (echo ERROR: Python installation failed & pause & exit /b 1)

for /f "delims=" %%i in ('where python') do set "PYTHON_EXE=%%i"
echo Python: %PYTHON_EXE%

:: -------------------------
:: INSTALL PIPX & SHERLOCK
:: -------------------------
echo ==== Installing pipx and Sherlock ====
%PYTHON_EXE% -m ensurepip --upgrade
%PYTHON_EXE% -m pip install --user --upgrade pipx
set "USER_PYTHON_SCRIPTS=%USERPROFILE%\AppData\Roaming\Python\Scripts"
set "PATH=%USER_PYTHON_SCRIPTS%;%PATH%"
pipx install sherlock-project

:: -------------------------
:: CLONE PROJECT
:: -------------------------
echo ==== Cloning Project ====
for %%I in ("%REPO_URL%") do set "REPO_NAME=%%~nI"
if "%REPO_NAME%"=="" set "REPO_NAME=project"

if exist "%REPO_NAME%\.git" (
    echo Repo exists locally. Pulling latest...
    pushd "%REPO_NAME%"
    "%GIT_EXE%" pull
    popd
) else (
    "%GIT_EXE%" clone "%REPO_URL%" "%REPO_NAME%"
)
cd /d "%REPO_NAME%"

:: -------------------------
:: RUN npm install
:: -------------------------
if exist package.json (
    echo ==== Running npm install ====
    call "%NPM_EXE%" install
) else (
    echo No package.json found — skipping npm install
)

:: -------------------------
:: DOWNLOAD FERROXBUSTER & FFUF
:: -------------------------
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"

echo ==== Downloading Feroxbuster ====
powershell -Command "Invoke-WebRequest %FEROX_URL% -OutFile '%TOOLS_DIR%\feroxbuster.zip'"
powershell -Command "Expand-Archive -LiteralPath '%TOOLS_DIR%\feroxbuster.zip' -DestinationPath '%TOOLS_DIR%' -Force"
for %%F in ("%TOOLS_DIR%\*.exe") do move /Y "%%F" "%CD%"

echo ==== Downloading ffuf ====
powershell -Command "Invoke-WebRequest %FFUF_URL% -OutFile '%TOOLS_DIR%\ffuf.zip'"
powershell -Command "Expand-Archive -LiteralPath '%TOOLS_DIR%\ffuf.zip' -DestinationPath '%TOOLS_DIR%' -Force"
for %%F in ("%TOOLS_DIR%\*.exe") do move /Y "%%F" "%CD%"

:: -------------------------
:: CLEANUP
:: -------------------------
rd /s /q "%TOOLS_DIR%"

echo.
echo ==== Installation complete ====
pause
endlocal