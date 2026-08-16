const {Router} = require('express')
const { getProjects, createProject, deletePorject } = require('../controllers/projectController')
const { isAuthenticated } = require('../middleware/authMiddleware')

const router = Router()

router.use(isAuthenticated)

router.route("/")
    .get(getProjects)
    .post(createProject)

router.route("/:projectId")
    .delete(deletePorject)

module.exports = router