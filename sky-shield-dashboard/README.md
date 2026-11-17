# Sky Shield – Cloud Security Monitoring & Incident Management

Easiest on Windows: double-click start.bat (needs Node.js + Java installed).

React (Vite) frontend + Java 17+ backend (no libraries needed).

## Run in VS Code (two terminals)
1. Terminal 1 (backend):  cd server  ->  java Server.java (or: javac Server.java then java Server)     (API on :8080)
2. Terminal 2 (frontend): npm install  ->  npm run dev                            (open http://localhost:5173)

Tabs: Overview (live threat feed), Incidents (assign to teams), Users & Teams (admin only), Compliance, Audit log.
Use "Signed in as" in the sidebar to switch roles. Data is kept in memory and resets when the server restarts.
