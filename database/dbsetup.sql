-- -------------------------------------------------------------
-- Chyrp Lite Rebuild - Full Database Schema for PostgreSQL
-- -------------------------------------------------------------
-- This script creates all necessary tables, relationships, and
-- initial data for the project to run.
-- -------------------------------------------------------------

-- (Optional) Drop existing tables in reverse order of creation
-- to reset the database during development.
/*
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS webmentions;
DROP TABLE IF EXISTS post_views;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_media;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
*/

-- -------------------------------------------------------------
-- Table: users
-- Stores user account information.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Table: categories
-- Stores post categories.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- Insert a default category required by the application.
INSERT INTO categories (name, slug) VALUES ('Uncategorized', 'uncategorized') ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------------
-- Table: tags
-- Stores unique tags for posts.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- -------------------------------------------------------------
-- Table: posts
-- The core table for all post content.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'photo', 'video', 'audio', 'quote', 'link')),
    title TEXT,
    content TEXT,
    link_url TEXT,
    attribution TEXT,
    license VARCHAR(255),
    image_url TEXT, -- Used for thumbnails/previews, especially for media posts.
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Trigger: update_posts_updated_at
-- Automatically updates the updated_at timestamp on posts.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------------
-- Junction & Related Tables
-- -------------------------------------------------------------

-- Table: post_tags (Many-to-Many relationship between posts and tags)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Table: post_media (Stores multiple media URLs for a single post)
CREATE TABLE IF NOT EXISTS post_media (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: comments (Stores comments on posts)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: post_likes (Tracks which users liked which posts)
CREATE TABLE IF NOT EXISTS post_likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);

-- Table: post_views (Tracks views to prevent multiple counts from the same user)
CREATE TABLE IF NOT EXISTS post_views (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);

-- Table: webmentions (Stores incoming webmentions for posts)
CREATE TABLE IF NOT EXISTS webmentions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    mention_type VARCHAR(50),
    author_name TEXT,
    author_url TEXT,
    author_photo TEXT,
    content TEXT,
    verified BOOLEAN DEFAULT false,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE -- The timestamp of the source publication
);

-- -------------------------------------------------------------
-- Indexes for Performance
-- Create indexes on foreign keys and frequently queried columns.
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_webmentions_post_id ON webmentions(post_id);

-- -------------------------------------------------------------
-- CHANGE OWNERSHIP TO 'p1'
-- This section reassigns ownership of all created objects.
-- NOTE: This script must be executed by a superuser (e.g., 'postgres')
-- for these final commands to succeed.
-- -------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Change ownership of all tables in the public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO p1;';
    END LOOP;

    -- Change ownership of all sequences in the public schema
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequencename) || ' OWNER TO p1;';
    END LOOP;

    -- Change ownership of all functions in the public schema
    FOR r IN (SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args 
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public') LOOP
        EXECUTE 'ALTER FUNCTION ' || quote_ident(r.proname) || '(' || r.args || ') OWNER TO p1;';
    END LOOP;
END $$;

-- -------------------------------------------------------------
-- End of Script
-- -------------------------------------------------------------