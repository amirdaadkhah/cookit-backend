const db = require('../config/db');

exports.getPublishedPosts = async () => {
  const result = await db.query(
    `SELECT id, title, content
     FROM posts
     WHERE published = true`
  );
  return result.rows;
};

exports.createPost = async (title, content) => {
  await db.query(
    'INSERT INTO posts(title, content) VALUES($1, $2)',
    [title, content]
  );
};