@echo off
title Boudin Boss Rewards MVP Launcher
color 0C
cls
echo =====================================================================
echo         ___  ___  _   _ ___ ___ _  _   ___  ___  ___ ___ 
echo        ^| _ ^)^/ _ \^| ^| ^| ^|   \_ _^| ^\| ^| ^| _ )^/ _ \/ __/ __^|
echo        ^| _ \ (_) ^| ^|_^| ^| ^|) ^| ^| ^| ^.` ^| ^| _ \ (_) \__ \__ \
echo        ^|___/\___/ \___/^|___/___^|_^|\_^| ^|___/\___/^|___/___/
echo.
echo                 BOUDIN BOSS REWARDS MVP LAUNCHER
echo                 The Boudin Company - Rosenberg, TX
echo =====================================================================
echo.
echo [1/3] Verifying database schema ^& applying migrations...
call npm.cmd run db:migrate

echo.
echo [2/3] Seeding demo Cajun loyalty data ^& staff accounts...
call npm.cmd run db:seed

echo.
echo [3/3] Starting the monolithic server on http://localhost:3001...
echo.
echo ---------------------------------------------------------------------
echo * Launching: http://localhost:3001
echo * Close this command prompt window to stop the server at any time.
echo ---------------------------------------------------------------------
echo.

:: Open default browser to the home page after 2 seconds
timeout /t 2 /nobreak > nul
start "" "http://localhost:3001"

:: Start the server
call npm.cmd start
