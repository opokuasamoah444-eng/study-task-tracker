const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

const authSection = document.getElementById("auth-section");
const trackerSection = document.getElementById("tracker-section");
const accountArea = document.getElementById("account-area");
const userEmail = document.getElementById("user-email");

const authForm = document.getElementById("auth-form");
const authHeading = document.getElementById("auth-heading");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");
const switchPrompt = document.getElementById("switch-prompt");
const switchAuthButton = document.getElementById("switch-auth-button");
const passwordInput = document.getElementById("password");

const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskSubjectInput = document.getElementById("task-subject");
const taskPriorityInput = document.getElementById("task-priority");
const taskFilter = document.getElementById("task-filter");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const taskMessage = document.getElementById("task-message");

let supabaseClient = null;
let currentUser = null;
let tasks = [];
let isSignUpMode = false;

function showMessage(element, message, isError = true) {
  element.textContent = message;
  element.classList.toggle("success-message", !isError);
}

function checkConfiguration() {
  const missing = !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("PASTE_YOUR") ||
    SUPABASE_ANON_KEY.includes("PASTE_YOUR");

  if (missing) {
    showMessage(
      authMessage,
      "Set your Supabase Project URL and publishable/anon key in config.js before using the app."
    );
    authSubmit.disabled = true;
    switchAuthButton.disabled = true;
    return false;
  }

  if (!window.supabase || !window.supabase.createClient) {
    showMessage(authMessage, "Supabase could not load. Check your internet connection and reload.");
    return false;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

function setAuthMode(signUp) {
  isSignUpMode = signUp;
  authHeading.textContent = signUp ? "Create your account" : "Welcome back";
  authSubmit.textContent = signUp ? "Create account" : "Log in";
  switchPrompt.textContent = signUp ? "Already have an account?" : "Don't have an account?";
  switchAuthButton.textContent = signUp ? "Log in" : "Create account";
  passwordInput.autocomplete = signUp ? "new-password" : "current-password";
  showMessage(authMessage, "");
}

switchAuthButton.addEventListener("click", () => setAuthMode(!isSignUpMode));

document.getElementById("toggle-password").addEventListener("click", event => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  event.currentTarget.textContent = isHidden ? "Hide" : "Show";
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!supabaseClient) return;

  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value;

  authSubmit.disabled = true;
  showMessage(authMessage, isSignUpMode ? "Creating your account..." : "Logging in...", false);

  try {
    if (isSignUpMode) {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;

      if (data.session) {
        showMessage(authMessage, "Account created successfully.", false);
      } else {
        showMessage(authMessage, "Account created. Check your email to confirm your account, then log in.", false);
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      authForm.reset();
    }
  } catch (error) {
    showMessage(authMessage, error.message || "Authentication failed.");
  } finally {
    authSubmit.disabled = false;
  }
});

document.getElementById("logout-button").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) showMessage(taskMessage, error.message);
});

async function handleSession(session) {
  currentUser = session ? session.user : null;

  if (!currentUser) {
    authSection.hidden = false;
    trackerSection.hidden = true;
    accountArea.hidden = true;
    tasks = [];
    taskList.innerHTML = "";
    taskCount.textContent = "Log in to view your tasks.";
    return;
  }

  authSection.hidden = true;
  trackerSection.hidden = false;
  accountArea.hidden = false;
  userEmail.textContent = currentUser.email;
  await loadTasks();
}

async function loadTasks() {
  taskCount.textContent = "Loading tasks...";
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage(taskMessage, `Could not load tasks: ${error.message}`);
    taskCount.textContent = "Tasks could not be loaded.";
    return;
  }

  tasks = data || [];
  renderTasks();
}

async function addTask(event) {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  const subject = taskSubjectInput.value.trim();

  if (!title) {
    showMessage(taskMessage, "Please enter a task title before adding it.");
    taskTitleInput.focus();
    return;
  }

  const addButton = taskForm.querySelector("button[type='submit']");
  addButton.disabled = true;
  showMessage(taskMessage, "Saving task...", false);

  const { error } = await supabaseClient.from("tasks").insert({
    user_id: currentUser.id,
    title,
    subject,
    priority: taskPriorityInput.value,
    completed: false
  });

  addButton.disabled = false;

  if (error) {
    showMessage(taskMessage, `Could not save task: ${error.message}`);
    return;
  }

  taskForm.reset();
  showMessage(taskMessage, "Task added successfully.", false);
  await loadTasks();
}

async function toggleTask(task) {
  const { error } = await supabaseClient
    .from("tasks")
    .update({ completed: !task.completed })
    .eq("id", task.id);

  if (error) {
    showMessage(taskMessage, `Could not update task: ${error.message}`);
    await loadTasks();
    return;
  }

  await loadTasks();
}

async function deleteTask(taskId) {
  const confirmed = window.confirm("Are you sure you want to delete this task?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    showMessage(taskMessage, `Could not delete task: ${error.message}`);
    return;
  }

  showMessage(taskMessage, "Task deleted.", false);
  await loadTasks();
}

function renderTasks() {
  const filter = taskFilter.value;
  let visibleTasks = tasks;

  if (filter === "active") visibleTasks = tasks.filter(task => !task.completed);
  if (filter === "completed") visibleTasks = tasks.filter(task => task.completed);

  const completedCount = tasks.filter(task => task.completed).length;
  taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"} · ${completedCount} completed`;
  taskList.innerHTML = "";

  if (visibleTasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const heading = document.createElement("strong");
    const message = document.createElement("span");

    if (tasks.length === 0) {
      heading.textContent = "Your task list is empty.";
      message.textContent = "Add your first study task using the form above.";
    } else if (filter === "active") {
      heading.textContent = "No incomplete tasks.";
      message.textContent = "Great work! All your tasks are complete.";
    } else {
      heading.textContent = "No completed tasks yet.";
      message.textContent = "Completed tasks will appear here.";
    }

    empty.append(heading, message);
    taskList.appendChild(empty);
    return;
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "complete-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", () => toggleTask(task));

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const subject = document.createElement("p");
    subject.className = "task-subject";
    subject.textContent = task.subject || "No subject added";

    const priority = document.createElement("span");
    priority.className = `priority ${String(task.priority).toLowerCase()}`;
    priority.textContent = `${task.priority} priority`;

    details.append(title, subject, priority);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, details, deleteButton);
    taskList.appendChild(item);
  });
}

taskForm.addEventListener("submit", addTask);
taskFilter.addEventListener("change", renderTasks);

async function startApp() {
  if (!checkConfiguration()) return;

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showMessage(authMessage, error.message);
    return;
  }

  await handleSession(data.session);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    // Defer database work outside the auth callback to avoid locking auth operations.
    window.setTimeout(() => handleSession(session), 0);
  });
}

startApp();
