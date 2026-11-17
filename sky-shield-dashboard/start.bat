@echo off
start "Sky Shield API" cmd /k "cd server && java Server.java"
if not exist node_modules call npm install
call npm run dev -- --open
