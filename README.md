# 🛡️ Fraud Detection Engine Backend

> Rule-based behavioral fraud detection system with real-time alerting, user behavior profiling, analytics, and risk scoring.

![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-API-black?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socketdotio)
![JWT](https://img.shields.io/badge/JWT-Authentication-red)

---

# 📖 Overview

The Fraud Detection Engine Backend powers a real-time fraud monitoring platform that evaluates financial transactions against behavioral and anomaly-based rules.

Each incoming transaction is analyzed by a fraud engine that calculates a risk score using multiple independent fraud detection signals.

Depending on the score, transactions are classified as:

- ✅ CLEAN
- ⚠️ REVIEW
- 🚨 FLAGGED

The backend also provides:

- JWT Authentication
- Refresh Token Flow
- Fraud Detection Engine
- User Behavior Profiling
- Fraud Alert Management
- Analytics APIs
- Real-Time Notifications
- PostgreSQL Persistence
- Structured Logging

---

# 🎯 Key Features

### 🔐 Authentication

- User Registration
- Login
- JWT Access Tokens
- Refresh Tokens
- Protected Routes
- Current User Retrieval

### 💳 Transaction Processing

- Create Transactions
- Retrieve Transaction History
- Retrieve Individual Transactions
- Automatic Fraud Evaluation

### 🚨 Fraud Detection

- Amount Anomaly Detection
- Velocity Breach Detection
- Odd Hour Detection
- New Category Detection
- Location Anomaly Detection
- Impossible Travel Detection

### 📡 Real-Time Alerting

- Socket.IO Integration
- Live Fraud Notifications
- User-specific Alert Rooms
- Event-driven Updates

### 📊 Analytics

- Fraud Statistics
- Weekly Transaction Trends
- Rule Distribution Analysis
- Risk Score Insights

### 🧠 Behavioral Profiling

The system continuously learns user behavior patterns including:

- Average Transaction Amount
- Transaction Standard Deviation
- Common Spending Categories
- Active Hours
- Last Known Location

False positive reviews are incorporated into profile updates, allowing the system to adapt over time.

---

# 🏗️ System Architecture

```text
Client
   │
   ▼
REST API (Express)
   │
   ├── Authentication Module
   │
   ├── Transaction Module
   │
   ├── Fraud Detection Engine
   │
   ├── Alert Management
   │
   ├── Analytics Module
   │
   └── Socket.IO Service
   │
   ▼
PostgreSQL Database
```

---

# 🔄 Transaction Processing Flow

```text
User Submits Transaction
            │
            ▼
Transaction Service
            │
            ▼
Fraud Detection Engine
            │
            ▼
Rule Evaluation
            │
            ▼
Risk Score Calculation
            │
            ▼
Status Assignment
            │
            ▼
Database Storage
            │
            ▼
Fraud Alert Creation
            │
            ▼
Socket Notification (FLAGGED only)
            │
            ▼
Frontend Update
```

---

# 🧠 Fraud Detection Engine

The fraud engine evaluates each transaction against multiple independent fraud rules.

Each triggered rule contributes points to the overall risk score.

---

## Risk Thresholds

| Score   | Status  |
| ------- | ------- |
| 0 - 39  | CLEAN   |
| 40 - 79 | REVIEW  |
| 80+     | FLAGGED |

---

# 🚨 Fraud Detection Rules

The fraud engine evaluates each incoming transaction against a collection of behavioral and anomaly-based rules.

Each triggered rule contributes points toward the transaction's final risk score.

---

## 1. Velocity Breach

Detects unusually high transaction frequency within a short time window.

### Example

User performs:

```text
₹500 at Starbucks      10:00 AM
₹700 at Swiggy         10:01 AM
₹300 at Uber           10:02 AM
₹800 at Amazon         10:03 AM
₹600 at Flipkart       10:04 AM
```

The transaction count exceeds the configured threshold.

### Risk Contribution

```text
+40 Points
```

---

## 2. Amount Anomaly

Detects transactions significantly larger than the user's historical spending behavior.

The system compares the current amount against the user's:

- Average transaction amount
- Transaction standard deviation

### Example

User Behavior Profile:

```text
Average Transaction Amount = ₹1,200
Standard Deviation = ₹400
```

Current Transaction:

```text
₹8,500
```

Since the amount is substantially larger than normal spending behavior, the anomaly rule is triggered.

### Medium Anomaly

```text
+30 Points
```

### Severe Anomaly

```text
+50 Points
```

---

## 3. Odd Hour Detection

Detects transactions occurring outside the user's normal active hours.

### Example

User Activity Pattern:

```text
Active Hours:
08:00 AM - 11:00 PM
```

Current Transaction:

```text
03:17 AM
```

Since the transaction occurs outside normal activity hours, the rule is triggered.

### Risk Contribution

```text
+20 Points
```

---

## 4. New Category Detection

Detects spending in categories the user has never interacted with before.

### Example

User History:

```text
Food
Groceries
Transport
Entertainment
```

Current Transaction:

```text
Category: Jewelry
```

Since the category has never appeared in the user's behavior profile, the rule is triggered.

### Risk Contribution

```text
+15 Points
```

---

## 5. Location Anomaly

Detects transactions originating from locations different from the user's usual transaction locations.

### Example

User History:

```text
Chennai
Bangalore
```

Current Transaction:

```text
Mumbai
```

Since the location differs from previously observed behavior, the anomaly rule is triggered.

### Risk Contribution

```text
+15 Points
```

---

## 6. Impossible Travel

Uses geographic distance calculations to determine whether travel between two transactions is realistically possible.

The backend calculates:

```text
Distance Between Locations
──────────────────────────
Time Difference
```

to estimate travel speed.

### Example

Previous Transaction:

```text
Location: Chennai
Time: 10:00 AM
```

Current Transaction:

```text
Location: Delhi
Time: 10:25 AM
```

The required travel speed is physically impossible, indicating potential account compromise or card theft.

### Low Severity

```text
+20 Points
```

### Medium Severity

```text
+40 Points
```

### High Severity

```text
+60 Points
```

---

## Risk Score Example

A transaction triggers:

```text
Velocity Breach      +40
Odd Hour Detection   +20
Location Anomaly     +15
```

Final Score:

```text
75
```

Classification:

```text
REVIEW
```

Another transaction triggers:

```text
Amount Anomaly       +50
Impossible Travel    +60
```

Final Score:

```text
110
```

Classification:

```text
FLAGGED
```

# 📡 Real-Time Notifications

The backend uses Socket.IO to deliver fraud alerts in real time.

Alerts are emitted only when a transaction reaches the FLAGGED state.

### Event

```javascript
io.to(`user_${userId}`).emit("fraud_alert", {
  transactionId,
  amount,
  riskScore,
  triggeredRules,
});
```

### Benefits

- No polling required
- Immediate fraud visibility
- Better user experience
- Event-driven architecture

---

# 🔐 Authentication Flow

Access tokens and refresh tokens are used to maintain secure sessions.

### Access Token

```text
Validity: 15 Minutes
```

### Refresh Token

```text
Validity: 7 Days
```

### Flow

```text
Login
   │
   ▼
Access Token + Refresh Token
   │
   ▼
Access Token Expires
   │
   ▼
Refresh Endpoint
   │
   ▼
New Access Token
```

---

# 📚 API Reference

## Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register user        |
| POST   | `/api/auth/login`    | Login user           |
| POST   | `/api/auth/refresh`  | Refresh access token |
| GET    | `/api/auth/me`       | Get current user     |

---

## Transactions

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| POST   | `/api/transactions`     | Create transaction      |
| GET    | `/api/transactions`     | Get all transactions    |
| GET    | `/api/transactions/:id` | Get transaction details |

---

## Fraud Alerts

| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| GET    | `/api/fraud/alerts`     | Get fraud alerts  |
| GET    | `/api/fraud/alerts/:id` | Get alert details |
| PUT    | `/api/fraud/alerts/:id` | Review alert      |

---

## Analytics

| Method | Endpoint                        | Description        |
| ------ | ------------------------------- | ------------------ |
| GET    | `/api/analytics/summary`        | Summary statistics |
| GET    | `/api/analytics/rule-breakdown` | Rule distribution  |
| GET    | `/api/analytics/weekly`         | Weekly trends      |

---

## Profile

| Method | Endpoint       | Description          |
| ------ | -------------- | -------------------- |
| GET    | `/api/profile` | Get behavior profile |

---

# 🗄️ Database Schema

The system is built on four primary entities.

---

## User

Stores authentication and account information.

```text
id
name
email
passwordHash
createdAt
```

---

## Transaction

Stores transaction history and fraud analysis results.

```text
id
userId
amount
merchant
category
latitude
longitude
location
riskScore
triggeredRules
status
timestamp
```

---

## FraudAlert

Stores transactions requiring review.

```text
id
transactionId
reviewed
outcome
reviewNotes
createdAt
```

---

## UserBehaviorProfile

Stores continuously updated user behavior metrics.

```text
id
userId
avgTransactionAmount
transactionStdDev
commonCategories
activeHours
lastKnownLocation
updatedAt
```

---

# 📂 Project Structure

```text
src/
│
├── controllers/
│
├── middleware/
│
├── routes/
│
├── services/
│   ├── auth/
│   ├── transactions/
│   ├── analytics/
│   ├── fraud/
│   └── profile/
│
├── sockets/
│
├── utils/
│
├── logger/
│
├── config/
│
└── index.js
```

---

# ⚙️ Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database_name>"

JWT_SECRET="<your_jwt_secret>"

REFRESH_TOKEN_SECRET="<your_refresh_token_secret>"

PORT=5000

FRONTEND_URL="http://localhost:3000"
```

---

# 🚀 Local Development Setup

## Clone Repository

```bash
git clone https://github.com/Dhruva-31/fraud-detection-engine-backend.git

cd fraud-detection-engine-backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

```bash
cp .env.example .env
```

Update values inside `.env`.

---

## Run Database Migrations

```bash
npx prisma migrate deploy
```

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Start Server

Production:

```bash
npm start
```

Development:

```bash
npm run dev
```

---

# 📊 Analytics

Analytics are calculated using the most recent 7-day transaction window.

Metrics include:

- Total Transactions
- Total Alerts
- Fraud Count
- False Positive Count
- Average Risk Score
- Rule Trigger Frequency
- Weekly Transaction Trends

---

# 📝 Logging

The application uses Winston for structured logging.

Logs include:

- Server Startup
- Authentication Events
- Fraud Evaluations
- Alert Generation
- Error Tracking

This improves observability and debugging in production environments.

---

# 🤝 Knowledge Transfer (KT)

## Adding a New Fraud Rule

1. Add the rule to the fraud engine.
2. Define the rule's risk contribution.
3. Update analytics mappings if required.
4. Update frontend rule display labels.
5. Add automated tests.

---

## Modifying Risk Thresholds

Changes affect:

```text
Fraud Engine
     │
     ▼
Alert Generation
     │
     ▼
Analytics
     │
     ▼
Frontend Status Display
```

Review all dependent components before deployment.

---

# 🔮 Future Enhancements

- Machine Learning-Based Fraud Detection
- Adaptive Risk Scoring
- Device Fingerprinting
- Explainable Fraud Decisions
- Kafka Event Streaming
- Docker Deployment
- Kubernetes Support
- Distributed Fraud Processing
- Administrative Investigation Dashboard

---

# 🔗 Frontend Repository

https://github.com/Dhruva-31/fraud-detection-engine-frontend

---

# 👨‍💻 Author

**Dhruva**

Built to explore fraud detection systems, behavioral analytics, anomaly detection, event-driven architectures, WebSocket communication, and scalable backend design.
