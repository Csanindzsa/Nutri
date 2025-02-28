@echo off
REM Save the current directory
set "ORIG_DIR=%CD%"

REM Navigate to the venv Scripts folder
cd /d "%CD%\venv\Scripts"

REM Execute the venv.bat file
call activate.bat

REM Return to the original directory
cd /d "%ORIG_DIR%"

