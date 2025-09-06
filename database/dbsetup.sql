-- Reset existing tables
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Posts Table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Post_Tags Table
CREATE TABLE post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Post_Likes Table
CREATE TABLE post_likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, post_id)
);

-- Sample Data
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@example.com', '2b12$DITL.p9t325kP.mMv.d8a.i9v.n14Mv3Hl.spF4gUnp/BPuLEI9vS'); -- password = "password"

INSERT INTO posts (user_id, type, title, content) VALUES
(1, 'text', 'Welcome to the Blog!', 'This is the first post.'),
(1, 'text', 'Exploring Features', 'We now have a working database schema!');

INSERT INTO comments (post_id, user_id, content) VALUES
(1, 1, 'This is the first comment!');

INSERT INTO tags (name) VALUES ('welcome'), ('tech'), ('update');

INSERT INTO post_tags (post_id, tag_id) VALUES (1, 1), (2, 2), (2, 3);

INSERT INTO post_likes (user_id, post_id) VALUES (1, 2);
