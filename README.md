#  Money Transfer System
### Japan → Nepal Remittance Platform

A complete remittance web application for sending money from Japan to Nepal. Built with React.js, Express.js, MsSQL, Redis, and Kafka.

---

## How to Run This Project

### What You Need to Install First

| Tool | Download | Purpose |
|---|---|---|
| Node.js LTS | https://nodejs.org | Run backend and frontend |
| Docker Desktop | https://docker.com/products/docker-desktop | Run all services |
| Azure Data Studio | https://aka.ms/azuredatastudio | Database manager Mac/Linux |
| SSMS | Search on Microsoft website | Database manager Windows only |

---

### Step 1 — Clone the Repository

```bash
https://github.com/shahrishav/Money-transfer.git
cd money-transfer
```

---

### Step 2 — Start All Services With One Command

```bash
docker-compose up -d
```

This starts SQL Server, Redis, Zookeeper and Kafka all at once.

```bash
docker ps
```

You should see 4 containers running: sqlserver, redis, zookeeper, kafka

---

### Step 3 — Create Database Tables

Open Azure Data Studio (Mac) or SSMS (Windows) and connect with:

```
Server:         localhost,1433
Authentication: SQL Login
Username:       sa
Password:       YourPassword123
```

Once connected:
1. Click New Query
2. Open the file `backend/database.sql` from this project
3. Copy all the content and paste it into the query editor
4. Press Run

You should see at the bottom: `All tables created successfully!`

---

### Step 4 — Setup Backend

```bash
cd backend
cp .env.example .env
```

Open the `.env` file and fill in your Gmail credentials:

```
PORT=8000
DB_SERVER=localhost
DB_NAME=money_transfer
DB_USER=sa
DB_PASSWORD=YourPassword123
JWT_SECRET=remitnepal_secret_key_2025
REDIS_URL=redis://localhost:6379
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16_char_app_password
```

How to get Gmail App Password:
1. Go to myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to myaccount.google.com/apppasswords
4. Click Create, select Mail, name it money-transfer
5. Copy the 16 character code into EMAIL_PASS with no spaces

Install and start:

```bash
npm install
node src/index.js
```

You should see:
```
✅ MSSQL Connected
✅ Redis Connected
✅ Server running on http://localhost:8000
```

---

### Step 5 — Setup Frontend

Open a new terminal window:

```bash
cd frontend
npm install
npm start
```

Browser opens at http://localhost:3000
---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js with Hooks |
| Backend | Express.js Node.js |
| Database | Microsoft SQL Server MsSQL |
| Cache and Rate Limiting | Redis |
| Message Queue | Apache Kafka |
| Email OTP | Nodemailer via Gmail |
| Authentication | JWT Tokens and OTP |
| Infrastructure | Docker and Docker Compose |

---

##  Features

**Authentication**
- Register with email OTP verification
- OTP expires in 5 minutes
- Redis rate limiting max 5 attempts per email
- JWT token login sessions
- Edit profile name and delete account

**Sender Management**
- Create view edit delete senders
- Nepal province dropdown with all 7 provinces
- District dropdown loads based on selected province all 77 districts
- Nepal phone number format
- Citizenship ID and date validation

**Receiver Management**
- Create view edit delete receivers
- All 20 major Nepal banks in dropdown
- Full Nepal KYC address fields

**Send Money Japan to Nepal**
- Enter amount in Japanese Yen
- Live fee calculator updates as you type
- Forex rate 1 JPY = 0.92 NPR
- Service fee rules:
  - NPR 0 to 100,000 fee is NPR 500
  - NPR 100,001 to 200,000 fee is NPR 1,000
  - Above NPR 200,000 fee is NPR 3,000
- 10 digit unique PIN generated per transaction
- Transaction saved via Kafka message queue

**Receive Money**
- Enter 10 digit PIN to look up transaction
- Shows full sender details after PIN verification
- Fill receiver KYC form to claim money
- Transaction status updates to completed
- Receipt shown on success

**Transaction Report**
- Full transaction history with all details
- Summary totals for JPY, NPR, fees
- Count of pending completed and paid transactions
- Filter by date range and status
- Mark transactions as paid
- Status flow: pending to completed to paid

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register       Register and send OTP
POST   /api/auth/verify-otp     Verify OTP get token
POST   /api/auth/login          Login get token
PUT    /api/auth/profile        Update name requires token
DELETE /api/auth/account        Delete account requires token
```

### Senders (token required)
```
GET    /api/senders             List all
POST   /api/senders             Create
GET    /api/senders/:id         Get one
PUT    /api/senders/:id         Update
DELETE /api/senders/:id         Delete
```

### Receivers (token required)
```
GET    /api/receivers                      List all
POST   /api/receivers                      Create
GET    /api/receivers/:id                  Get one
PUT    /api/receivers/:id                  Update
DELETE /api/receivers/:id                  Delete
GET    /api/receivers/provinces            All Nepal provinces
GET    /api/receivers/banks                All Nepal banks
GET    /api/receivers/districts/:province  Districts by province
```

### Transactions (token required)
```
POST   /api/transactions/calculate-fee     Preview fee
POST   /api/transactions/send              Send money get PIN
POST   /api/transactions/lookup-pin        Look up by PIN
POST   /api/transactions/receive           Claim money
PUT    /api/transactions/:id/mark-paid     Mark as paid
GET    /api/transactions                   All with summary
GET    /api/transactions?status=pending    Filter by status
GET    /api/transactions?start_date=&end_date=  Filter by date
```

---

##  Docker Services

| Container | Port | Description |
|---|---|---|
| sqlserver | 1433 | Microsoft SQL Server 2022 |
| redis | 6379 | Rate limiting and cache |
| zookeeper | 2181 | Kafka coordination |
| kafka | 9092 | Transaction message queue |

---

##  Environment Variables

| Variable | Description |
|---|---|
| PORT | Backend port default 8000 |
| DB_SERVER | SQL Server host default localhost |
| DB_NAME | Database name money_transfer |
| DB_USER | SQL username sa |
| DB_PASSWORD | SQL password YourPassword123 |
| JWT_SECRET | Secret key for tokens |
| REDIS_URL | Redis URL redis://localhost:6379 |
| EMAIL_USER | Your Gmail address |
| EMAIL_PASS | Gmail App Password 16 chars |

---

##  Troubleshooting

**SQL Server not connecting**
```bash
docker logs sqlserver | tail -5
```
Wait for: SQL Server is now ready for client connections

**OTP not received**
Check spam folder. EMAIL_PASS must be App Password not real Gmail password.

**Port already in use**
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**Redis errors**
```bash
docker-compose down
docker-compose up -d
```

---

##  Database Tables

| Table | Purpose |
|---|---|
| users | Registered accounts |
| otps | OTP codes with expiry |
| senders | Sender KYC profiles |
| receivers | Receiver bank details |
| transactions | All transfers with PIN |
| receiver_claims | KYC when claiming money |

---
