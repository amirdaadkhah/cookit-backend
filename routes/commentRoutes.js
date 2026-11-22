const router = require('express').Router();
const db = require('../config/db');

// GET Comments of a specific Recipe by RecipeID
router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;

  try {
    const commentsResult = await db.query(
      `
      SELECT
        id,
        recipe_id AS "recipeId",
        user_id AS "userId",
        user_name AS "userName",
        user_avatar AS "userAvatar",
        comment,
        parent_comment_id AS "parentCommentId",
        created_at AS "createdAt"
      FROM recipe_comments
      WHERE recipe_id = $1
      ORDER BY created_at DESC;
      `,
      [id]
    );

    return res.json(commentsResult.rows);

  } catch (error) {
    console.error(`Error loading comments for recipe ${id}:`, error);

    return res.status(500).json({
      error: "Failed to load comments"
    });
  }
});

router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;

  const {
    userId,
    userName,
    userAvatar,
    comment
  } = req.body;

  const trimmedComment = comment?.trim();
  const trimmedUserName = userName?.trim() ?? 'Gast';

  if (!trimmedComment) {
    return res.status(400).json({
      message: "Comment is required"
    });
  }

  if (!trimmedUserName) {
    return res.status(400).json({
      message: "User name is required"
    });
  }

  try {
    const result = await db.query(
      `
      INSERT INTO recipe_comments (
        recipe_id,
        user_id,
        user_name,
        user_avatar,
        comment
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        recipe_id AS "recipeId",
        user_id AS "userId",
        user_name AS "userName",
        user_avatar AS "userAvatar",
        comment,
        parent_comment_id AS "parentCommentId",
        created_at AS "createdAt";
      `,
      [
        id,
        userId ?? null,
        trimmedUserName,
        userAvatar ?? null,
        trimmedComment
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creating comment for recipe id:", id, error);

    res.status(500).json({
      error: "Failed to create comment"
    });
  }
});

module.exports = router;