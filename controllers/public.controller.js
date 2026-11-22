const postService = require('../services/post.service');

exports.getPosts = async (req, res) => {
  const posts = await postService.getPublishedPosts();
  res.json(posts);
};