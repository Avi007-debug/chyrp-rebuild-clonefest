def manage_tags(cur, post_id, tags_string):
    """Handles finding/creating tags and linking them to a post."""
    if tags_string:
        tag_names = [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]
        tag_ids = []
        for name in tag_names:
            cur.execute("SELECT id FROM tags WHERE name = %s", (name,))
            tag = cur.fetchone()
            if tag:
                tag_ids.append(tag[0])
            else:
                cur.execute("INSERT INTO tags (name) VALUES (%s) RETURNING id", (name,))
                tag_ids.append(cur.fetchone()[0])

        # Link tags to the post
        for tag_id in tag_ids:
            cur.execute(
                "INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (post_id, tag_id)
            )
