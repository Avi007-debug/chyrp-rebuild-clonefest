# Database Setup Guide

This project uses **PostgreSQL** as its backend database.

---

## 1. Install PostgreSQL
Download and install from [https://www.postgresql.org/download/](https://www.postgresql.org/download/).

---

## 2. Create User and Database
pen **pgAdmin** or use the `psql` command-line tool to connect to your PostgreSQL server and run the following commands.

First, create the user and the database:

```sql
-- Create a user named 'p1' with privileges to log in, create roles, and create databases
CREATE USER p1 WITH PASSWORD 'root' CREATEDB CREATEROLE;

-- Create the database named 'blog' and assign ownership to p1
CREATE DATABASE blog OWNER p1;

-- Explicitly grant all privileges on the database itself to the user p1
GRANT ALL PRIVILEGES ON DATABASE blog TO p1;

ext, connect to the newly created blog database and run these commands. This sets the default security privileges so that user p1 automatically gets full permissions for any new tables, sequences, or functions created in the future.
-- Set default privileges for user p1 within the 'public' schema of the 'blog' database
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO p1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO p1;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO p1;
```

---

## 3. Run Schema File
In pgAdmin’s Query Tool or terminal:

1. Navigate to [`dbsetup.sql`](dbsetup.sql) in your project folder.  
2. Run the file once.  
   - It will automatically reset existing tables (if any), create the schema, and insert sample data.

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
