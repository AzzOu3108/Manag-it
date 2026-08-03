import { useEffect, useRef, useState } from "react";
import StepOneProjectDetails from "./StepOneProjectDetails";

const EMPTY_FORM = {
  title: "",
  taskCount: 5,
  dueDate: "",
};

/**
 * "Create Project" modal.
 * For now it only hosts Step 1 (project details). Step 2 (tasks) will be
 * added to this flow in a later session.
 */
export default function CreateProjectFlow({ onClose }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({ title: null, dueDate: null });

  const cardRef = useRef(null);
  const previouslyFocused = useRef(null);

  const isDirty = Boolean(formData.title.trim() || formData.dueDate);

  // Lock body scroll while open and restore focus to the trigger on close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // Escape closes (with confirmation if the draft has content); Tab is trapped.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        requestClose();
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

    // If focus slipped outside the dialog, pull it back in.
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

  function updateFormData(patch) {
    setFormData((prev) => ({ ...prev, ...patch }));
    // Clear the error for any field the user is actively editing.
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => {
        next[key] = null;
      });
      return next;
    });
  }

  function validateStepOne() {
    const nextErrors = { title: null, dueDate: null };

    if (!formData.title.trim()) {
      nextErrors.title = "Give your project a name.";
    }

    if (!formData.dueDate) {
      nextErrors.dueDate = "Choose a due date.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(`${formData.dueDate}T00:00:00`);
      if (Number.isNaN(dueDate.getTime()) || dueDate < today) {
        nextErrors.dueDate = "The date must be today or later.";
      }
    }

    setErrors(nextErrors);
    return !nextErrors.title && !nextErrors.dueDate;
  }

  function goNext() {
    // Step 2 is not built yet — for now "Go Next" only validates Step 1.
    validateStepOne();
  }

  function requestClose() {
    if (isDirty && !window.confirm("Discard this project draft?")) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141E3C]/45 p-4 backdrop-blur-lg animate-in fade-in duration-200 motion-reduce:animate-none"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-heading"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-3xl bg-[#FBF3EC] p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95 duration-200 ease-out motion-reduce:animate-none"
      >
        <div className="grid px-1">
          <StepOneProjectDetails
            active
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            onNext={goNext}
            onCancel={requestClose}
          />
        </div>
      </div>
    </div>
  );
}