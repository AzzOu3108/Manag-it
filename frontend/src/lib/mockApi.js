/**
 * In-memory mock of the Express backend contract.
 *
 * While the real backend is not running, this adapter answers every
 * request the app makes with the exact same shapes the Express server
 * will return, so the whole flow (login, signup, dashboard, projects,
 * tasks, stats) is testable end to end.
 *
 * Data is persisted in localStorage, so projects survive page reloads.
 * Login/signup accept any non-empty email + password.
 *
 * When the real backend is ready, flip USE_MOCK_API to false in
 * src/lib/api.js and delete this file.
 */

const MOCK_DELAY_MS = 250;

const PROJECTS_KEY = "manageit.mock.projects";
const USER_KEY = "manageit.mock.user";

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

function makeToken() {
  // Fake JWT-ish string; the frontend never decodes it.
  return `mock.${Math.random().toString(36).slice(2)}.${Date.now()}`;
}

function loadProjects() {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Corrupted storage — fall through to a fresh seed.
    }
  }
  const seeded = seedProjects();
  saveProjects(seeded);
  return seeded;
}

function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/** Two demo projects so the dashboard is alive on first visit. */
function seedProjects() {
  return [
    {
      id: "demo-project-1",
      title: "Website Redesign",
      dueDate: "2026-09-15",
      tasks: [
        { id: "t1-1", text: "Audit the current site", completed: true },
        { id: "t1-2", text: "Design new homepage", completed: true },
        { id: "t1-3", text: "Build the components", completed: false },
        { id: "t1-4", text: "QA on mobile", completed: false },
        { id: "t1-5", text: "Deploy to production", completed: false },
        { id: "t1-6", text: "Write handover notes", completed: false },
      ],
    },
    {
      id: "p-project-2",
      title: "Mobile App Launch",
      dueDate: "2026-10-01",
      tasks: [
        { id: "t2-1", text: "Finalize feature list", completed: true },
        { id: "t2-2", text: "Beta test with 10 users", completed: false },
        { id: "t2-3", text: "Prepare store listing", completed: false },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Response helpers                                                    */
/* ------------------------------------------------------------------ */

function respond(status, body) {
  return { status, body };
}

function fail(status, message) {
  // Axios-shaped error so the response interceptor handles it normally.
  const error = new Error(message);
  error.response = { status, data: { error: message } };
  throw error;
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

async function route(method, url, body) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  /* ---------------- Auth ---------------- */

  if (method === "post" && url === "/auth/login") {
    const { email, password } = body || {};
    if (!email || !password) return fail(400, "Email and password are required.");
    const user = { id: "mock-user-1", fullName: email.split("@")[0], email };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return respond(200, { accessToken: makeToken(), refreshToken: makeToken(), user });
  }

  if (method === "post" && url === "/auth/signup") {
    const { fullName, email, password } = body || {};
    if (!fullName || !email || !password) return fail(400, "All fields are required.");
    const user = { id: "mock-user-1", fullName, email };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return respond(201, { accessToken: makeToken(), refreshToken: makeToken(), user });
  }

  if (method === "post" && url === "/auth/refresh") {
    return respond(200, { accessToken: makeToken() });
  }

  if (method === "post" && url === "/auth/logout") {
    localStorage.removeItem(USER_KEY);
    return respond(204, null);
  }

  if (method === "get" && url === "/auth/me") {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (!user) return fail(401, "Not authenticated.");
    return respond(200, { user });
  }

  /* ---------------- Stats ---------------- */

  if (method === "get" && url === "/stats") {
    const projects = loadProjects();
    const totalProjects = projects.length;
    const completedTasks = projects.reduce(
      (count, project) => count + project.tasks.filter((task) => task.completed).length,
      0
    );
    const pendingTasks = projects.reduce(
      (count, project) => count + project.tasks.filter((task) => !task.completed).length,
      0
    );
    return respond(200, { totalProjects, completedTasks, pendingTasks });
  }

  /* ---------------- Projects ---------------- */

  if (method === "get" && url === "/projects") {
    return respond(200, loadProjects());
  }

  if (method === "post" && url === "/projects") {
    const { title, dueDate, tasks } = body || {};
    if (!title?.trim()) return fail(400, "Give your project a title.");
    const project = {
      id: crypto.randomUUID(),
      title: title.trim(),
      dueDate: dueDate || "",
      tasks: (tasks || []).map((text) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
      })),
    };
    const projects = loadProjects();
    projects.push(project);
    saveProjects(projects);
    return respond(201, project);
  }

  const deleteMatch = url.match(/^\/projects\/([^/]+)$/);
  if (method === "delete" && deleteMatch) {
    const projects = loadProjects().filter((project) => project.id !== deleteMatch[1]);
    saveProjects(projects);
    return respond(204, null);
  }

  /* ---------------- Tasks ---------------- */

  const addTasksMatch = url.match(/^\/projects\/([^/]+)\/tasks$/);
  if (method === "post" && addTasksMatch) {
    const projects = loadProjects();
    const project = projects.find((candidate) => candidate.id === addTasksMatch[1]);
    if (!project) return fail(404, "Project not found.");
    const newTasks = (body?.tasks || []).map((text) => ({
      id: crypto.randomUUID(),
      text,
      completed: false,
    }));
    project.tasks = [...project.tasks, ...newTasks];
    saveProjects(projects);
    return respond(200, project);
  }

  const toggleMatch = url.match(/^\/projects\/([^/]+)\/tasks\/([^/]+)$/);
  if (method === "patch" && toggleMatch) {
    const projects = loadProjects();
    const project = projects.find((candidate) => candidate.id === toggleMatch[1]);
    const task = project?.tasks.find((candidate) => candidate.id === toggleMatch[2]);
    if (!project || !task) return fail(404, "Task not found.");
    task.completed = Boolean(body?.completed);
    saveProjects(projects);
    return respond(200, task);
  }

  return fail(404, `No mock route for ${method.toUpperCase()} ${url}`);
}

/* ------------------------------------------------------------------ */
/* Axios adapter                                                       */
/* ------------------------------------------------------------------ */

/**
 * Axios adapter: receives the request config and returns a response
 * shaped exactly like a real HTTP response.
 */
export function mockAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";

  let body;
  try {
    body = config.data ? JSON.parse(config.data) : undefined;
  } catch {
    body = config.data;
  }

  return route(method, url, body).then(
    ({ status, body: responseBody }) => ({
      data: responseBody,
      status,
      statusText: status === 204 ? "No Content" : "OK",
      headers: {},
      config,
    }),
    (error) => {
      // Re-throw the axios-shaped error so the response interceptor
      // (401 refresh flow) works exactly like with a real server.
      throw error;
    }
  );
}