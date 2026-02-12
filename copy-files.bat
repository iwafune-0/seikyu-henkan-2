@echo off
echo Copying files to C:\temp\electron-build...

REM pushd is required for UNC paths (cd does not support them)
pushd \\wsl.localhost\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2

rmdir /S /Q C:\temp\electron-build 2>nul
mkdir C:\temp\electron-build

echo [1/7] electron...
xcopy /E /I /Y electron C:\temp\electron-build\electron

echo [2/7] frontend\dist...
xcopy /E /I /Y frontend\dist C:\temp\electron-build\frontend\dist

echo [3/7] backend\dist (extraResources)...
xcopy /E /I /Y backend\dist C:\temp\electron-build\backend\dist

echo [4/7] backend\node_modules_prod (extraResources)...
xcopy /E /I /Y backend\node_modules_prod C:\temp\electron-build\backend\node_modules_prod

echo [5/7] build\python (extraResources)...
xcopy /E /I /Y build\python C:\temp\electron-build\build\python

echo [6/7] package.json...
copy /Y package.json C:\temp\electron-build\

echo [7/7] .env.production...
copy /Y .env.production C:\temp\electron-build\

popd

echo.
echo Done copying files.
pause
