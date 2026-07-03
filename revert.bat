@echo off
echo Reverting commit 0b97618fb7e47743ffb4b5c2c46c87f9cdc41cc5...
git revert --no-edit 0b97618fb7e47743ffb4b5c2c46c87f9cdc41cc5
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Revert encountered conflicts or failed.
    echo Please resolve any conflicts manually or run:
    echo git stash
    echo git revert 0b97618fb7e47743ffb4b5c2c46c87f9cdc41cc5
    echo git stash pop
) else (
    echo Revert completed successfully.
)
pause
