import StatGrid from "./StatGrid";
import ProjectsSection from "./ProjectsSection";
import { stats } from "../../constants/dashboard";

export default function Dashboard({
  projects,
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
        <StatGrid stats={stats} />
      </section>

      <ProjectsSection 
      projects={projects}
      onCreateProject={onCreateProject}
      onToggleTask={onToggleTask}
      onAddTasks={onAddTasks}
      onDeleteProject={onDeleteProject}
      openMenuProjectId={openMenuProjectId}
      onMenuOpenChange= {onMenuOpenChange}
      />
    </main>
  );
}
