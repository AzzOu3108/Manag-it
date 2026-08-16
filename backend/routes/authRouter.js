const {Router} = require('express')
const {authLimiter} = require('../middleware/rateLimiter')
const {isAuthenticated} = require('../middleware/authMiddleware')
const {signup, login, refresh, logout, me} = require('../controllers/authController')

const router = Router();

router.route("/signup").post(authLimiter, signup);
router.route("/login").post(authLimiter, login);
router.route("/refresh").post(authLimiter, refresh);
router.route("/logout").post(authLimiter, logout);
router.route("/me").get(isAuthenticated, me);

module.exports = router