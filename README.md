# UVM FabLab — 3D Printer Scheduler

## Folder Structure
```
fablab-scheduler/
├── server.js        ← Node.js backend (Express + SQLite)
├── package.json     ← Dependencies
├── data/            ← Auto-created, holds bookings.db
└── public/
    ├── index.html   ← Frontend app
    └── users.csv    ← User accounts
```

## Running Locally
```bash
cd fablab-scheduler
npm install
npm start
# Open http://localhost:3000
```

## Deploying to Acorn / uvmfablab.net

### 1. Copy files to server
Upload the entire fablab-scheduler/ folder to your server.

### 2. Install and start
```bash
cd fablab-scheduler
npm install --production
npm start
```

### 3. Keep it running with PM2
```bash
npm install -g pm2
pm2 start server.js --name fablab-scheduler
pm2 save && pm2 startup
```

### 4. Nginx reverse proxy (to serve at uvmfablab.net/scheduler)
```nginx
location /scheduler/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Managing Users
Edit public/users.csv — no restart needed.
```
name,pin,role
Alex Johnson,1234,admin
Jordan Smith,5678,user
Morgan Lee,9012,read
```
Roles: admin / user / read

## Database
Bookings are saved to data/bookings.db (SQLite, auto-created).
Back this file up regularly.

## Test Logins
| Name          | PIN  | Role  |
|---------------|------|-------|
| Alex Johnson  | 1234 | admin |
| Jordan Smith  | 5678 | user  |
| Morgan Lee    | 9012 | read  |
