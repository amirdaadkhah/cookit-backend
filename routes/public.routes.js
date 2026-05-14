const router = require('express').Router();
const controller = require('../controllers/public.controller');

router.get('/posts', controller.getPosts);

module.exports = router;