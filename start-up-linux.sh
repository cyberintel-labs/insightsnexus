#!/bin/bash
cd "$(dirname "$0")"

echo "==== Starting Application ===="

# Run build
echo "Running npm run build..."
npm run build
BUILD_STATUS=$?

# If build failed due to permission issues, retry with sudo
if [ $BUILD_STATUS -ne 0 ]; then
    echo "Build failed — checking if it’s a permissions issue..."
    # Check for "EACCES" or "permission denied" in last 20 lines of npm error log
    if grep -qiE "EACCES|permission denied" <(tail -n 20 npm-debug.log 2>/dev/null); then
        echo "Retrying build with sudo..."
        sudo npm run build
        BUILD_STATUS=$?
    fi
fi

# Stop if the build still failed
if [ $BUILD_STATUS -ne 0 ]; then
    echo "ERROR: Build failed. Application will not start."
    echo "Check the error messages above for details."
    exit 1
fi

echo "Build completed successfully."
echo "Starting server in background..."

# Start application in background
gnome-terminal -- bash -c "npm start; exec bash" 2>/dev/null || \
x-terminal-emulator -e "bash -c 'npm start; exec bash'" 2>/dev/null || \
xterm -hold -e "npm start" 2>/dev/null &

# Give the server a few seconds to start
sleep 3

# Open localhost in default browser
echo "Opening http://localhost:3000 ..."
xdg-open "http://localhost:3000" >/dev/null 2>&1 &

echo "==== Application launched successfully ===="
echo "==== You may close this current window ===="
