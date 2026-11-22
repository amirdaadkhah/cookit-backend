const authService = require('../services/auth.service');
const postService = require('../services/post.service');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const token = await authService.loginAdmin(username, password);

  if (!token) return res.status(401).send('Invalid credentials');

  res.json({ token });
};

exports.createPost = async (req, res) => {
  const { title, content } = req.body;

  await postService.createPost(title, content);

  res.send('created');
};