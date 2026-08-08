import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import DashboardNavbar from "../layout/DashboardNavbar";
import Dashboard from "./Dashboard";
import CreateProjectFlow from "../CreateProjectFlow/CreateProjectFlow";
import AddMoreTasksModal from "./AddMoreTasksModal";
import useProjects from "../../hooks/useProjects";
import api, { getErrorMessage } from "../../lib/api";

export default function DashboardPage() {
  const { projects, loading, error, refresh, createProject, toggleTask, appendTasks, deleteProject } =
    useProjects();

  const [flowOpen, setFlowOpen] = useState(false);
  const [addTasksProjectId, setAddTasksProjectId] = useState(null);
  const [openMenuProjectId, setOpenMenuProjectId] = useState(null);
  const [toast, setToast] = useState(null);

  // Overview numbers come from the backend (GET /stats), not from math
  // on the client, so the cards reflect server-side truth.
  const [stats, setStats] = useState({ totalProjects: 0, completedTasks: 0, pendingTasks: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load the overview stats once on mount. Stats are non-critical:
  // if this call fails, the cards just stay at 0 and the page still works.
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const { data } = await api.get("/stats");
        if (!cancelled) setStats(data);
      } catch {
        // Ignored on purpose — projects still render below.
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-dismiss the toast after a few seconds.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Show a toast; type controls the icon (success check vs error cross). */
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const handleComplete = useCallback(
    async (project) => {
      try {
        const created = await createProject(project);
        setFlowOpen(false);
        showToast(`Project "${created.title}" created`);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not create the project."), "error");
      }
    },
    [createProject, showToast]
  );

  const addTasksProject = addTasksProjectId
    ? projects.find((project) => project.id === addTasksProjectId)
    : null;

  const handleCreateTasks = useCallback(
    async (texts) => {
      if (!addTasksProject) return;
      try {
        const count = await appendTasks(addTasksProject.id, texts);
        setAddTasksProjectId(null);
        showToast(`${count} ${count === 1 ? "task" : "tasks"} added to "${addTasksProject.title}"`);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not add the tasks."), "error");
      }
    },
    [addTasksProject, appendTasks, showToast]
  );

  const handleToggleTask = useCallback(
    async (projectId, taskId) => {
      try {
        await toggleTask(projectId, taskId);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not update the task."), "error");
      }
    },
    [toggleTask, showToast]
  );

  const handleDeleteProject = useCallback(
    async (projectId) => {
      const project = projects.find((candidate) => candidate.id === projectId);
      if (!project) return;
      if (!window.confirm(`Delete "${project.title}" and its tasks?`)) return;
      try {
        await deleteProject(projectId);
        setOpenMenuProjectId(null);
        showToast(`Project "${project.title}" deleted`);
      } catch (err) {
        showToast(getErrorMessage(err, "Could not delete the project."), "error");
      }
    },
    [projects, deleteProject, showToast]
  );

  return (
    <div className="min-h-screen bg-background font-display">
      <DashboardNavbar onCreateProject={() => setFlowOpen(true)} />
      <Dashboard
        projects={projects}
        projectsLoading={loading}
        projectsError={error}
        onRetryProjects={refresh}
        stats={stats}
        statsLoading={statsLoading}
        onCreateProject={() => setFlowOpen(true)}
        onToggleTask={handleToggleTask}
        onAddTasks={setAddTasksProjectId}
        onDeleteProject={handleDeleteProject}
        openMenuProjectId={openMenuProjectId}
        onMenuOpenChange={setOpenMenuProjectId}
      />

      {flowOpen && <CreateProjectFlow onClose={() => setFlowOpen(false)} onComplete={handleComplete} />}

      {addTasksProject && (
        <AddMoreTasksModal
          project={addTasksProject}
          onClose={() => setAddTasksProjectId(null)}
          onCreateTasks={handleCreateTasks}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-60 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                toast.type === "error" ? "bg-red-500" : "bg-primary"
              }`}
            >
              {toast.type === "error" ? (
                <X className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />
              ) : (
                <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} aria-hidden="true" />
              )}
            </span>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}