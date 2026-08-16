const { Router } = require('express')
const {isAuthenticated} = require('../middleware/authMiddleware')
const {getStats} = require('../controllers/statsController')

const router = Router();

router.use(isAuthenticated);

router.route("/").get(getStats);

module.exports = router