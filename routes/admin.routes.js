const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/login', controller.login);
router.post('/posts', auth, adminOnly, controller.createPost);

module.exports = router;