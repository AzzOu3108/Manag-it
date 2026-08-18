import { Check, ListPlus, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import Card from "../ui/Card";
import ProjectCardMenu from "./ProjectCardMenu";

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * One project card: title + kebab menu, live progress, checklist with a
 * vertical progress column, and the due date. Everything is derived from
 * the project's tasks — completed count and the x/y fraction are never
 * stored, only computed.
 */
export default function ProjectCard({
  project,
  onToggleTask,
  onOpenAddTasks,
  onDeleteProject,
  menuOpen,
  onMenuOpenChange,
}) {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((task) => task.completed).length;
  const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;

  return (
    <Card className="rounded-2xl border-primary/20 p-5 sm:p-6">
      {/* Header: centered title + kebab in the top-right corner */}
      <div className="relative">
        <h3 className="truncate px-10 text-center text-lg font-extrabold tracking-tight text-foreground">
          {project.title}
        </h3>
        <div className="absolute right-0 top-0">
          <ProjectCardMenu
            open={menuOpen}
            onOpenChange={onMenuOpenChange}
            items={[
              {
                label: "Add Tasks",
                icon: <ListPlus className="h-4 w-4" aria-hidden="true" />,
                onClick: onOpenAddTasks,
              },
              {
                label: "Delete Project",
                icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
                onClick: () => onDeleteProject(project.id),
                destructive: true,
              },
            ]}
          />
        </div>
      </div>

      {/* Progress strip */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Task progress</span>
        <span className="text-sm font-bold tabular-nums text-primary">
          {totalTasks === 0 ? "0" : `${completedTasks}/${totalTasks}`}
        </span>
      </div>

      {/* Checklist + vertical progress column */}
      <div className="mt-3 flex gap-4">
        <ul className="max-h-33 min-w-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {totalTasks === 0 ? (
            <li className="py-1 text-xs text-muted-foreground">
              No tasks yet — add some from the ⋮ menu.
            </li>
          ) : (
            project.tasks.map((task) => (
              <li key={task.id}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(project.id, task.id)}
                    className="peer sr-only"
                  />
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#EBDCCB] bg-white transition-colors duration-200 peer-checked:border-done peer-checked:bg-done peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-sm leading-snug transition-colors duration-200",
                      task.completed && "text-muted-foreground line-through"
                    )}
                  >
                    {task.text}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>

        {/* Vertical progress column: fill grows from the bottom, dot on top */}
        <div className="relative w-1 shrink-0 self-stretch rounded-full bg-primary/15">
          {progress > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full bg-linear-to-t from-primary to-primary/40 transition-[height] duration-300 ease-out motion-reduce:transition-none"
              style={{ height: `${Math.max(progress * 100, 6)}%` }}
            >
              <span className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-surface bg-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Footer: due date */}
      <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-3">
        <span className="text-xs text-muted-foreground">Due Date</span>
        <span className="text-xs font-semibold text-foreground">{formatDate(project.dueDate)}</span>
      </div>
    </Card>
  );
}
