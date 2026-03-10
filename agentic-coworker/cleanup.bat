@echo off
REM Cleanup script for Windows - stops Docker containers and removes volumes

docker compose down

REM List and remove all agentic-coworker volumes
for /f "tokens=*" %%i in ('docker volume ls -q ^| findstr "^agentic-coworker"') do (
    docker volume rm %%i
)

echo Cleanup completed!
