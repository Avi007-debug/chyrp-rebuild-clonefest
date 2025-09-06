# Database Setup Guide

This project uses **PostgreSQL** as its backend database.

---

## 1. Install PostgreSQL
Download and install from [https://www.postgresql.org/download/](https://www.postgresql.org/download/).

---

## 2. Create User and Database
Open **pgAdmin** or use `psql`, then run:

```sql
-- Create user
CREATE USER p1 WITH PASSWORD 'root';

-- Create database and assign ownership
CREATE DATABASE blog OWNER p1;
```

---

## 3. Run Schema File
In pgAdmin’s Query Tool or terminal:

1. Navigate to [`dbsetup.sql`](dbsetup.sql) in your project folder.
2. Run the file **twice**:
   - First run removes existing tables (reset).
   - Second run creates fresh schema and adds sample data.

---

## 4. Connection Details
Use these credentials in your backend configuration:

```
DB_HOST = "localhost"
DB_NAME = "blog"
DB_USER = "p1"
DB_PASS = "root"
```

---

✅ After completing these steps, your database is ready to use.
