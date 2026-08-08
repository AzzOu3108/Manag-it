import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import Button from "../ui/Button";
import TaskInputRow from "./TaskInputRow";

export default function StepTwoTasks({
  active,
  formData,
  errors,
  updateFormData,
  onBack,
  onSubmit,
}) {
  const rowRefs = useRef({});

  // Move focus to the first task row when the step becomes active.
  useEffect(() => {
    if (active) rowRefs.current[0]?.focus();
  }, [active]);

  function updateTask(index, value) {
    updateFormData({
      tasks: formData.tasks.map((task, i) => (i === index ? value : task)),
    });
  }

  function removeTask(index) {
    const tasks = formData.tasks.filter((_, i) => i !== index);
    updateFormData({ tasks });
    // After the row disappears, focus the row that took its place.
    requestAnimationFrame(() => {
      const next = tasks.length > 0 ? rowRefs.current[Math.min(index, tasks.length - 1)] : null;
      next?.focus();
    });
  }

  return (
    <section
      inert={!active}
      aria-hidden={!active}
      className={cn(
        "col-start-1 row-start-1 min-w-0 transition-all duration-200 ease-in-out motion-reduce:transition-none",
        active
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0 pointer-events-none"
      )}
    >
      <h2 id="add-tasks-heading" className="text-2xl font-extrabold tracking-tight text-foreground">
        Add the tasks
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Create the tasks for your project. You can edit them later.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <img src="/assets/DashBoard-assets/Task-icon.svg" alt="" className="h-4 w-4" />
        <span className="text-sm font-semibold text-foreground">Tasks</span>
      </div>

      <ul className="mt-3 max-h-72 space-y-2.5 overflow-y-auto py-2 pl-1 pr-3 md:max-h-96">
        {formData.tasks.map((task, index) => (
          <TaskInputRow
            key={index}
            index={index}
            value={task}
            onChange={(value) => updateTask(index, value)}
            onRemove={() => removeTask(index)}
            canRemove={formData.tasks.length > 1}
            inputRef={(el) => {
              rowRefs.current[index] = el;
            }}
          />
        ))}
      </ul>

      {/* Fixed slot so validation never changes the form's height */}
      <div className="mt-2 min-h-5">
        {errors.tasks && (
          <p id="tasks-error" role="alert" className="text-xs font-medium text-red-500">
            {errors.tasks}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 -mx-1 mt-6 flex items-center justify-between gap-3 bg-[#FBF3EC] px-1">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-12 rounded-full px-6 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Go back
        </Button>
        <Button
          onClick={onSubmit}
          className="h-12 px-7 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Create project
          <img src="/assets/DashBoard-assets/Arrow-icon.svg" alt="" className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}
