// auth.routes.js

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/auth.controller');
const validate   = require('../middleware/validate.middleware');
const auth       = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register', authLimiter, controller.registerRules, validate, controller.register);
router.post('/login',    authLimiter, controller.loginRules,    validate, controller.login);
router.post('/refresh',  controller.refresh);
router.post('/logout',   auth, controller.logout);
router.get('/me',        auth, controller.getMe);

module.exports = router;