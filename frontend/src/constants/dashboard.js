/**
 * Static definitions for the Overview stat cards.
 * The values are NOT stored here anymore — they come from GET /api/stats
 * and are merged in by Dashboard.jsx (see the `key` field).
 */
export const stats = [
  { key: "totalProjects", label: "Total Projects", icon: "/assets/DashBoard-assets/Folder-icon.svg" },
  { key: "completedTasks", label: "Completed Tasks", icon: "/assets/DashBoard-assets/Completed-icon.svg" },
  { key: "pendingTasks", label: "Pending Tasks", icon: "/assets/DashBoard-assets/Task-icon.svg" },
];