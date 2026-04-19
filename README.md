# 🚀 HNG Stage 1 Backend – Profiles API

## 📌 Project Overview

This is my submission for the **HNG Internship Stage 1 Backend Task**.

The goal of this project is to build an API that takes in a name, analyzes it using external services, and returns useful profile information such as gender, age, and nationality.

---

## 🌐 Base URL

```
https://stage1-backend-indol.vercel.app
```

---

## 🎯 What I Built

I built an API that:

* Accepts a name as input
* Predicts:

  * Gender (using Genderize API)
  * Age (using Agify API)
  * Nationality (using Nationalize API)
* Stores the result in a PostgreSQL database
* Allows retrieval of all profiles or a single profile
* Supports deletion of profiles
* Prevents duplicate entries (idempotency)

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* PostgreSQL (Render)
* Axios
* Vercel (Deployment)

---

## 📂 API Endpoints

### 1. Health Check

```
GET /
```

**Response:**

```json
{
  "status": "success",
  "message": "HNG Stage 1 Backend is running 🚀"
}
```

---

### 2. Create Profile

```
POST /api/profiles
```

**Request Body:**

```json
{
  "name": "john"
}
```

**Response (201):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1000,
    "age": 30,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.75,
    "created_at": "timestamp"
  }
}
```

---

### 3. Get All Profiles

```
GET /api/profiles
```

**Response:**

```json
{
  "status": "success",
  "count": 1,
  "data": [...]
}
```

---

### 4. Get Single Profile

```
GET /api/profiles/:id
```

---

### 5. Delete Profile

```
DELETE /api/profiles/:id
```

**Response:**

```
204 No Content
```

---

## ⚠️ Error Handling

| Status Code | Description           |
| ----------- | --------------------- |
| 400         | Invalid input         |
| 422         | Invalid name          |
| 404         | Profile not found     |
| 502         | External API failure  |
| 500         | Internal server error |

---

## 🔁 Idempotency

If the same name is submitted more than once (case-insensitive), the API returns the existing profile instead of creating a new one.

---

## 🧪 External APIs Used

* https://api.genderize.io
* https://api.agify.io
* https://api.nationalize.io

---

## 🗄️ Database

* PostgreSQL hosted on Render
* Stores:

  * Unique ID (UUID)
  * Name (normalized)
  * Gender + probability
  * Age + age group
  * Country + probability
  * Timestamp


---

## 🚀 Running Locally

```bash
git clone https://github.com/your-username/your-repo.git

cd your-repo
npm install
npm run start
```

---

## 📌 Notes

* Names are converted to lowercase before storage
* Empty or invalid names are rejected
* External API failures return a `502` response

---

**@codespacecadet**

---

This project is for educational purposes (HNG Internship).
