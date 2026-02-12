@echo off
echo === Building Electron App ===

echo Installing dependencies...
call npm install

echo Building Electron...
call npx electron-builder --win portable

echo === Build Complete ===
echo Check release folder for the exe file
pause
