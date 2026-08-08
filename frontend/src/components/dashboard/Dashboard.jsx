import StatGrid from "./StatGrid";
import ProjectsSection from "./ProjectsSection";
import Button from "../ui/Button";
import { stats as statDefinitions } from "../../constants/dashboard";

export default function Dashboard({
  projects,
  projectsLoading,
  projectsError,
  onRetryProjects,
  stats,
  statsLoading,
  onCreateProject,
  onToggleTask,
  onAddTasks,
  onDeleteProject,
  openMenuProjectId,
  onMenuOpenChange,
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-5xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome to your project workspace. Manage your projects efficiently and stay organized.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-foreground">Overview</h2>
        {/* Values come from GET /api/stats; labels/icons are static definitions. */}
        <StatGrid
          stats={statDefinitions.map((definition) => ({
            ...definition,
            value: statsLoading ? "—" : String(stats[definition.key] ?? 0),
          }))}
        />
      </section>

      {/* Projects area: loading / error / content states */}
      {projectsLoading ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-foreground">Active Projects</h2>
          <p className="mt-6 text-sm text-muted-foreground">Loading your projects…</p>
        </section>
      ) : projectsError ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-foreground">Active Projects</h2>
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            <p className="font-semibold">Could not load your projects.</p>
            <p className="mt-1">{projectsError.message}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRetryProjects}>
              Try again
            </Button>
          </div>
        </section>
      ) : (
        <ProjectsSection
          projects={projects}
          onCreateProject={onCreateProject}
          onToggleTask={onToggleTask}
          onAddTasks={onAddTasks}
          onDeleteProject={onDeleteProject}
          openMenuProjectId={openMenuProjectId}
          onMenuOpenChange={onMenuOpenChange}
        />
      )}
    </main>
  );
}