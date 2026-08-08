import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";

/**
 * Shared project state, backed by the backend.
 *
 * Every entry point that grows a project's task list (create flow,
 * "Add Tasks" popup, anything added later) goes through here so the
 * project shape and merge behavior stay consistent.
 *
 * The method names match the old in-memory version on purpose, so the
 * components that consume this hook barely changed — only the internals
 * now talk to the API instead of local state.
 *
 * Endpoints used:
 *  GET    /projects                          -> load all projects
 *  POST   /projects                        -> create a project
 *  DELETE /projects/:projectId            -> delete a project
 *  POST   /projects/:projectId/tasks      -> append tasks
 *  PATCH  /projects/:projectId/tasks/:taskId -> toggle one task
 */
export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Fetch the full project list from the server. */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects as soon as the dashboard mounts.
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Create a project from the 2-step flow.
   * Tasks arrive as plain strings; the server builds the Task objects
   * and assigns the ids. Returns the created project (server truth).
   */
  const createProject = useCallback(async ({ title, dueDate, tasks }) => {
    const { data } = await api.post("/projects", { title, dueDate, tasks });
    setProjects((prev) => [...prev, data]);
    return data;
  }, []);

  /**
   * Flip one task's completed flag.
   * Optimistic: the UI updates instantly, then the server confirms.
   * If the request fails, the previous state is restored.
   */
  const toggleTask = useCallback(
    async (projectId, taskId) => {
      const project = projects.find((candidate) => candidate.id === projectId);
      const task = project?.tasks.find((candidate) => candidate.id === taskId);
      if (!project || !task) return;

      const nextCompleted = !task.completed;
      const previous = projects;

      // 1. Apply the change locally right away.
      setProjects((prev) =>
        prev.map((candidate) =>
          candidate.id !== projectId
            ? candidate
            : {
                ...candidate,
                tasks: candidate.tasks.map((t) =>
                  t.id === taskId ? { ...t, completed: nextCompleted } : t
                ),
              }
        )
      );

      try {
        // 2. Persist it; the response is the server's version of the task.
        const { data } = await api.patch(`/projects/${projectId}/tasks/${taskId}`, {
          completed: nextCompleted,
        });
        setProjects((prev) =>
          prev.map((candidate) =>
            candidate.id !== projectId
              ? candidate
              : {
                  ...candidate,
                  tasks: candidate.tasks.map((t) => (t.id === taskId ? data : t)),
                }
          )
        );
      } catch (err) {
        // 3. Roll back on failure so the UI never lies.
        setProjects(previous);
        throw err;
      }
    },
    [projects]
  );

  /**
   * Append new task texts to a project's existing list (never replaces).
   * The server returns the updated project; we swap it in wholesale.
   * Returns the number of tasks added so callers can toast it.
   */
  const appendTasks = useCallback(async (projectId, taskTexts) => {
    const { data } = await api.post(`/projects/${projectId}/tasks`, { tasks: taskTexts });
    setProjects((prev) => prev.map((candidate) => (candidate.id === projectId ? data : candidate)));
    return data.tasks.length;
  }, []);

  /** Remove a project and all of its tasks. */
  const deleteProject = useCallback(async (projectId) => {
    await api.delete(`/projects/${projectId}`);
    setProjects((prev) => prev.filter((candidate) => candidate.id !== projectId));
  }, []);

  return { projects, loading, error, refresh, createProject, toggleTask, appendTasks, deleteProject };
}