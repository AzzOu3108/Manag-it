const { Project } = require('../models')

const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 })
        return res.status(200).json(projects)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to fetch projects' })
    }
}

const createProject = async (req, res) =>{
    const {title, dueDate, tasks} = req.body

    if(!title || !title.trim()) {
        return res.status(400).json({ error: "Give your project a title"})
    }

    try {
        const project = await Project.create({
            // owner: req.user.id,
            title: title.trim(),
            duaDate: dueDate ||"",
            tasks: (tasks || []).map((text) => ({text}))
        })

        res.status(201).json(project)
    } catch (error) {
        console.error("Create project error:", error)
        res.status(500).json({error: "Server error."})
    }
}

const deletePorject = async (req, res) => {
    const {projectId} = req.params

    try {
        const project = await Project.findOneAndDelete({_id: projectId, })
        if(!project){
            return res.status(404).json({error: "Project not found"})
        }

        res.status(204).end()
    } catch (error) {
        console.log("Delete project error:", error)
        res.status(500).json({error: "Server error."})
    }
}

module.exports = { getProjects, createProject, deletePorject }