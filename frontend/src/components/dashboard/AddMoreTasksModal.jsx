import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../ui/Button";
import TaskInputRow from "../CreateProjectFlow/TaskInputRow";

/**
 * "Add the task" popup — collects new task rows for one specific project.
 * Rows are local state here, independent of dashboard state, until
 * `Create Tasks` confirms and the parent's append handler is called.
 */
export default function AddMoreTasksModal({ project, onClose, onCreateTasks }) {
  const [rows, setRows] = useState([""]);
  const cardRef = useRef(null);
  const previouslyFocused = useRef(null);
  const rowRefs = useRef({});

  const hasContent = rows.some((row) => row.trim());

  // Lock body scroll while open, restore focus to the trigger on close,
  // and land focus on the first task row.
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    document.body.style.overflow = "hidden";
    rowRefs.current[0]?.focus();
    return () => {
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Esc closes; Tab is trapped inside the dialog.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "Tab") {
        trapFocus(event);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function trapFocus(event) {
    if (!cardRef.current) return;
    const focusables = Array.from(
      cardRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.closest("[inert]"));

    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!cardRef.current.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function addRow() {
    setRows((prev) => [...prev, ""]);
    requestAnimationFrame(() => rowRefs.current[rows.length]?.focus());
  }

  function updateRow(index, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? value : row)));
  }

  // Always allow removing rows; if the last one goes, put one empty row
  // back so the user can keep going.
  function removeRow(index) {
    const next = rows.filter((_, i) => i !== index);
    const result = next.length === 0 ? [""] : next;
    setRows(result);
    requestAnimationFrame(() => {
      const target = result.length === 1 ? null : rowRefs.current[Math.min(index, result.length - 1)];
      target?.focus();
    });
  }

  function handleCreate() {
    const texts = rows.map((row) => row.trim()).filter(Boolean);
    if (texts.length === 0) return;
    onCreateTasks(texts);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141E3C]/45 p-4 backdrop-blur-lg animate-in fade-in duration-200 motion-reduce:animate-none"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-more-tasks-heading"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-3xl bg-[#FBF3EC] p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95 duration-200 ease-out motion-reduce:animate-none"
      >
        <h2
          id="add-more-tasks-heading"
          className="text-2xl font-extrabold tracking-tight text-foreground"
        >
          Add the task
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          New tasks will be added to “{project.title}”.
        </p>

        <div className="mt-6 flex items-center gap-2">
          <img src="/assets/DashBoard-assets/Task-icon.svg" alt="" className="h-4 w-4" />
          <span className="text-sm font-semibold text-foreground">New Task</span>
        </div>

        {/* 4 rows visible, then the list scrolls internally */}
        <ul className="mt-3 max-h-53.5 space-y-2.5 overflow-y-auto pb-2 pl-1 pr-1 pt-2">
          {rows.map((row, index) => (
            <TaskInputRow
              key={index}
              index={index}
              value={row}
              onChange={(value) => updateRow(index, value)}
              onRemove={() => removeRow(index)}
              canRemove
              inputRef={(el) => {
                rowRefs.current[index] = el;
              }}
            />
          ))}
        </ul>

        <Button
          type="button"
          variant="secondary"
          onClick={addRow}
          className="mt-4 h-11 w-full rounded-full border-0 bg-accent text-accent-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add another task
        </Button>

        <div className="sticky bottom-0 -mx-1 mt-8 flex items-center justify-between gap-3 bg-[#FBF3EC] px-1">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-12 rounded-full px-6 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!hasContent}
            className="h-12 px-7 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Create Tasks
            <img src="/assets/DashBoard-assets/Arrow-icon.svg" alt="" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
