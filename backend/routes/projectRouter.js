const {Router} = require('express')
const { getProjects, createProject, deletePorject } = require('../controllers/projectController')


const router = Router()

router.route("/")
    .get(getProjects)
    .post(createProject)

router.route("/:projectId")
    .delete(deletePorject)

module.exports = router