/**
 * Simple Todo App with Task, Goal, Due Date, Sub-tasks, Daily Strength Bar,
 * Light/Dark Mode, and Achieved Celebration Note.
 * Persists data locally in browser via localStorage.
 */

// LocalStorage Keys
const STORAGE_KEY = 'todo_app_tasks_v2';
const USER_NAME_KEY = 'todo_app_user_name_v1';
const VISITED_KEY = 'todo_app_has_visited_v1';
const THEME_KEY = 'todo_app_theme_v1';

// Initial sample tasks (loaded on first visit)
const DEFAULT_TASKS = [
  {
    id: 'task-1',
    task: 'Launch new personal website',
    goal: 'Showcase projects and grow professional reach',
    achieved: true,
    dueDate: new Date(Date.now() - 3600000 * 2).toISOString().slice(0, 16),
    subtasks: [
      { id: 'sub-1', text: 'Design hero section and layout', completed: true },
      { id: 'sub-2', text: 'Write project case studies', completed: true },
      { id: 'sub-3', text: 'Test responsiveness on mobile', completed: true }
    ],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'task-2',
    task: 'Read 30 minutes of technical book',
    goal: 'Continuous learning and skill mastery',
    achieved: false,
    dueDate: new Date(Date.now() + 3600000 * 6).toISOString().slice(0, 16),
    subtasks: [
      { id: 'sub-4', text: 'Read Chapter 4: Clean Architecture', completed: true },
      { id: 'sub-5', text: 'Write down key takeaways and notes', completed: false }
    ],
    createdAt: Date.now() - 3600000
  }
];

// App State
let tasks = [];
let currentFilter = 'all'; // 'all' | 'pending' | 'achieved'
let searchQuery = '';
let taskToDeleteId = null;
let userName = '';
let isReturningUser = false;
let currentTheme = 'light'; // 'light' | 'dark'

// Draft Sub-tasks for Add Form and Edit Modal
let addFormSubtasks = [];
let editFormSubtasks = [];

// DOM Elements - Theme & Welcome
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const welcomeMessage = document.getElementById('welcome-message');
const editNameBtn = document.getElementById('edit-name-btn');
const nameDisplayLabel = document.getElementById('name-display-label');

// DOM Elements - Strength Bar
const strengthTodayDate = document.getElementById('strength-today-date');
const strengthPercentage = document.getElementById('strength-percentage');
const strengthLevel = document.getElementById('strength-level');
const strengthFill = document.getElementById('strength-fill');
const strengthProgressBar = document.getElementById('strength-progressbar');
const strengthSummary = document.getElementById('strength-summary');
const strengthMotivation = document.getElementById('strength-motivation');

// DOM Elements - Stats
const totalCountEl = document.getElementById('total-count');
const achievedCountEl = document.getElementById('achieved-count');
const pendingCountEl = document.getElementById('pending-count');

// DOM Elements - Form & Controls
const todoForm = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const goalInput = document.getElementById('goal-input');
const dueInput = document.getElementById('due-input');
const statusSelect = document.getElementById('status-select');

// DOM Elements - Add Form Sub-tasks
const newSubtaskInput = document.getElementById('new-subtask-input');
const addSubtaskBtn = document.getElementById('add-subtask-btn');
const newSubtasksList = document.getElementById('new-subtasks-list');

// DOM Elements - Search & Filter
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterTabs = document.querySelectorAll('.tab-btn');

// DOM Elements - List & Empty State
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDescription = document.getElementById('empty-description');

// DOM Elements - Edit Modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTaskIdInput = document.getElementById('edit-task-id');
const editTaskInput = document.getElementById('edit-task-input');
const editGoalInput = document.getElementById('edit-goal-input');
const editDueInput = document.getElementById('edit-due-input');
const editStatusSelect = document.getElementById('edit-status-select');
const editSubtaskInput = document.getElementById('edit-subtask-input');
const editAddSubtaskBtn = document.getElementById('edit-add-subtask-btn');
const editSubtasksList = document.getElementById('edit-subtasks-list');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// DOM Elements - Delete Modal
const deleteModal = document.getElementById('delete-modal');
const deleteTaskPreview = document.getElementById('delete-task-preview');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// DOM Elements - Name Modal
const nameModal = document.getElementById('name-modal');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const closeNameModalBtn = document.getElementById('close-name-modal-btn');
const cancelNameBtn = document.getElementById('cancel-name-btn');

// DOM Elements - Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
let toastTimeout = null;

/**
 * Initialize application
 */
function init() {
  initTheme();
  loadUserPreferences();
  loadTasks();
  setupEventListeners();
  updateWelcomeNote();
  render();
}

/**
 * Initialize Light/Dark Theme
 */
function initTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      currentTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme = 'dark';
    } else {
      currentTheme = 'light';
    }
  } catch (e) {
    currentTheme = 'light';
  }
  applyTheme(currentTheme);
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}

  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light';
    themeToggleBtn.setAttribute('title', 'Switch to Light mode');
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark';
    themeToggleBtn.setAttribute('title', 'Switch to Dark mode');
  }
}

/**
 * Toggle between Light and Dark mode
 */
function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

/**
 * Load user name and visit status from localStorage
 */
function loadUserPreferences() {
  try {
    userName = localStorage.getItem(USER_NAME_KEY) || '';
    isReturningUser = localStorage.getItem(VISITED_KEY) === 'true';

    // Set visited flag so subsequent visits/refreshes are returning
    localStorage.setItem(VISITED_KEY, 'true');
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
}

/**
 * Update the welcome note banner text
 */
function updateWelcomeNote() {
  if (isReturningUser) {
    welcomeMessage.textContent = userName
      ? `Welcome back, ${userName}! How is it going?`
      : 'Welcome back! How is it going?';
  } else {
    welcomeMessage.textContent = userName
      ? `Hello ${userName}, what are you looking to achieve?`
      : 'Hello, what are you looking to achieve?';
  }

  nameDisplayLabel.textContent = userName || 'Set Name';
}

/**
 * Load tasks from localStorage (falls back to DEFAULT_TASKS)
 */
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData === null) {
      // First time visiting: load default starter tasks
      tasks = [...DEFAULT_TASKS];
      saveTasks();
    } else {
      tasks = JSON.parse(rawData) || [];
    }
  } catch (error) {
    console.error('Failed to parse tasks from localStorage:', error);
    tasks = [];
  }
}

/**
 * Save tasks to localStorage
 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Add new task form
  todoForm.addEventListener('submit', handleAddTask);

  // Draft sub-tasks in Add Form
  addSubtaskBtn.addEventListener('click', handleAddDraftSubtask);
  newSubtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDraftSubtask();
    }
  });

  newSubtasksList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-subtask-btn');
    if (btn) {
      const index = parseInt(btn.dataset.index, 10);
      if (!isNaN(index)) {
        addFormSubtasks.splice(index, 1);
        renderDraftSubtasks();
      }
    }
  });

  // Search input
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', handleClearSearch);

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.getAttribute('data-filter');
      render();
    });
  });

  // Event delegation on the todo list
  // 1) Main task checkbox toggle
  todoList.addEventListener('change', (e) => {
    // Sub-task checkbox toggle
    if (e.target.matches('.subtask-checkbox')) {
      const taskId = e.target.dataset.taskId;
      const subtaskId = e.target.dataset.subtaskId;
      if (taskId && subtaskId) {
        toggleSubtask(taskId, subtaskId);
      }
      return;
    }

    // Main task checkbox toggle
    if (e.target.matches('.status-checkbox')) {
      const item = e.target.closest('.todo-item');
      if (item && item.dataset.id) {
        toggleTaskAchieved(item.dataset.id);
      }
    }
  });

  // 2) Buttons on task cards (Edit, Delete, Subtask Delete, Add card subtask)
  todoList.addEventListener('click', (e) => {
    // Edit main task
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const item = editBtn.closest('.todo-item');
      if (item && item.dataset.id) {
        openEditDialog(item.dataset.id);
      }
      return;
    }

    // Delete main task
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const item = deleteBtn.closest('.todo-item');
      if (item && item.dataset.id) {
        promptDeleteTask(item.dataset.id);
      }
      return;
    }

    // Delete a sub-task on card
    const deleteSubtaskBtn = e.target.closest('.delete-card-subtask-btn');
    if (deleteSubtaskBtn) {
      const taskId = deleteSubtaskBtn.dataset.taskId;
      const subtaskId = deleteSubtaskBtn.dataset.subtaskId;
      if (taskId && subtaskId) {
        deleteSubtaskFromTask(taskId, subtaskId);
      }
      return;
    }

    // Add sub-task directly on card
    const addCardSubtaskBtn = e.target.closest('.card-add-subtask-btn');
    if (addCardSubtaskBtn) {
      const taskId = addCardSubtaskBtn.dataset.taskId;
      const card = addCardSubtaskBtn.closest('.todo-item');
      if (card && taskId) {
        const input = card.querySelector('.card-subtask-input');
        if (input) {
          const text = input.value.trim();
          if (text) {
            addSubtaskToTask(taskId, text);
            input.value = '';
          }
        }
      }
      return;
    }
  });

  // 3) Enter key inside card sub-task input
  todoList.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('.card-subtask-input')) {
      e.preventDefault();
      const taskId = e.target.dataset.taskId;
      const text = e.target.value.trim();
      if (taskId && text) {
        addSubtaskToTask(taskId, text);
        e.target.value = '';
      }
    }
  });

  // Edit Modal events
  editForm.addEventListener('submit', handleSaveEdit);
  closeEditModalBtn.addEventListener('click', closeEditDialog);
  cancelEditBtn.addEventListener('click', closeEditDialog);

  // Edit Modal subtasks
  editAddSubtaskBtn.addEventListener('click', handleEditAddSubtask);
  editSubtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditAddSubtask();
    }
  });

  editSubtasksList.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-subtask-btn');
    if (btn) {
      const index = parseInt(btn.dataset.index, 10);
      if (!isNaN(index)) {
        editFormSubtasks.splice(index, 1);
        renderEditSubtasks();
      }
    }
  });

  // Delete Modal events
  cancelDeleteBtn.addEventListener('click', closeDeleteDialog);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  deleteModal.addEventListener('close', () => {
    taskToDeleteId = null;
  });

  // Name Customization Modal events
  editNameBtn.addEventListener('click', openNameDialog);
  nameForm.addEventListener('submit', handleSaveName);
  closeNameModalBtn.addEventListener('click', closeNameDialog);
  cancelNameBtn.addEventListener('click', closeNameDialog);

  // Close modals on clicking outside modal dialog (backdrop click)
  [editModal, deleteModal, nameModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        modal.close();
      }
    });
  });
}

/**
 * Show a celebration toast notification
 */
function showToast(message) {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastMessage.textContent = message;
  toast.hidden = false;

  toastTimeout = setTimeout(() => {
    toast.hidden = true;
    toastTimeout = null;
  }, 3500);
}

/**
 * Handle adding draft sub-task in Add Form
 */
function handleAddDraftSubtask() {
  const text = newSubtaskInput.value.trim();
  if (!text) return;

  addFormSubtasks.push({
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    text: text,
    completed: false
  });

  newSubtaskInput.value = '';
  newSubtaskInput.focus();
  renderDraftSubtasks();
}

/**
 * Render draft sub-tasks in Add Form
 */
function renderDraftSubtasks() {
  if (addFormSubtasks.length === 0) {
    newSubtasksList.innerHTML = '';
    return;
  }

  newSubtasksList.innerHTML = addFormSubtasks.map((st, idx) => `
    <li class="new-subtask-item">
      <span class="new-subtask-text">• ${escapeHtml(st.text)}</span>
      <button type="button" class="remove-subtask-btn" data-index="${idx}" title="Remove step" aria-label="Remove step">&times;</button>
    </li>
  `).join('');
}

/**
 * Handle adding a new task
 */
function handleAddTask(e) {
  e.preventDefault();

  const taskText = taskInput.value.trim();
  const goalText = goalInput.value.trim();
  const dueDateVal = dueInput.value ? dueInput.value : '';
  const isAchieved = statusSelect.value === 'achieved';

  if (!taskText || !goalText) {
    alert('Please provide both a Task and a Goal.');
    return;
  }

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    task: taskText,
    goal: goalText,
    achieved: isAchieved,
    dueDate: dueDateVal,
    subtasks: [...addFormSubtasks],
    createdAt: Date.now()
  };

  // Add new task to the top of the list
  tasks.unshift(newTask);
  saveTasks();

  // Reset form
  todoForm.reset();
  statusSelect.value = 'not_achieved';
  addFormSubtasks = [];
  renderDraftSubtasks();
  taskInput.focus();

  if (isAchieved) {
    showToast('You crushed it. Well-done!');
  }

  render();
}

/**
 * Handle search input
 */
function handleSearchInput(e) {
  searchQuery = e.target.value.trim().toLowerCase();
  clearSearchBtn.hidden = searchQuery.length === 0;
  render();
}

/**
 * Handle clearing search
 */
function handleClearSearch() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.hidden = true;
  searchInput.focus();
  render();
}

/**
 * Toggle Achieved status for a task
 */
function toggleTaskAchieved(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.achieved = !task.achieved;
    saveTasks();

    if (task.achieved) {
      showToast('You crushed it. Well-done!');
    }

    render();
  }
}

/**
 * Toggle a subtask's completion status
 */
function toggleSubtask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && Array.isArray(task.subtasks)) {
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      saveTasks();
      render();
    }
  }
}

/**
 * Add a subtask to an existing task directly from card
 */
function addSubtaskToTask(taskId, text) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (!Array.isArray(task.subtasks)) {
      task.subtasks = [];
    }
    task.subtasks.push({
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: text,
      completed: false
    });
    saveTasks();
    render();
  }
}

/**
 * Delete a subtask from an existing task
 */
function deleteSubtaskFromTask(taskId, subtaskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && Array.isArray(task.subtasks)) {
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    saveTasks();
    render();
  }
}

/**
 * Open Edit modal
 */
function openEditDialog(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editTaskIdInput.value = task.id;
  editTaskInput.value = task.task;
  editGoalInput.value = task.goal;
  editDueInput.value = task.dueDate || '';
  editStatusSelect.value = task.achieved ? 'achieved' : 'not_achieved';

  // Clone existing subtasks for edit mode
  editFormSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map(s => ({ ...s }))
    : [];

  renderEditSubtasks();

  if (typeof editModal.showModal === 'function') {
    editModal.showModal();
  } else {
    editModal.setAttribute('open', '');
  }
  editTaskInput.focus();
}

/**
 * Handle adding subtask in Edit modal
 */
function handleEditAddSubtask() {
  const text = editSubtaskInput.value.trim();
  if (!text) return;

  editFormSubtasks.push({
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    text: text,
    completed: false
  });

  editSubtaskInput.value = '';
  editSubtaskInput.focus();
  renderEditSubtasks();
}

/**
 * Render subtasks inside Edit modal
 */
function renderEditSubtasks() {
  if (editFormSubtasks.length === 0) {
    editSubtasksList.innerHTML = '<li class="new-subtask-item" style="color:var(--text-muted); font-style:italic;">No action steps yet</li>';
    return;
  }

  editSubtasksList.innerHTML = editFormSubtasks.map((st, idx) => `
    <li class="new-subtask-item">
      <span class="new-subtask-text">• ${escapeHtml(st.text)}</span>
      <button type="button" class="remove-subtask-btn" data-index="${idx}" title="Remove step" aria-label="Remove step">&times;</button>
    </li>
  `).join('');
}

/**
 * Close Edit modal
 */
function closeEditDialog() {
  if (typeof editModal.close === 'function') {
    editModal.close();
  } else {
    editModal.removeAttribute('open');
  }
}

/**
 * Save edited task
 */
function handleSaveEdit(e) {
  e.preventDefault();
  const id = editTaskIdInput.value;
  const updatedTaskText = editTaskInput.value.trim();
  const updatedGoalText = editGoalInput.value.trim();
  const updatedDueVal = editDueInput.value || '';
  const updatedAchieved = editStatusSelect.value === 'achieved';

  if (!updatedTaskText || !updatedGoalText) {
    alert('Task and Goal cannot be empty.');
    return;
  }

  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex !== -1) {
    const wasAchieved = tasks[taskIndex].achieved;

    tasks[taskIndex].task = updatedTaskText;
    tasks[taskIndex].goal = updatedGoalText;
    tasks[taskIndex].dueDate = updatedDueVal;
    tasks[taskIndex].achieved = updatedAchieved;
    tasks[taskIndex].subtasks = [...editFormSubtasks];

    saveTasks();

    if (!wasAchieved && updatedAchieved) {
      showToast('You crushed it. Well-done!');
    }

    render();
  }

  closeEditDialog();
}

/**
 * Prompt Delete confirmation
 */
function promptDeleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  taskToDeleteId = id;
  deleteTaskPreview.textContent = `Are you sure you want to delete "${task.task}"? This action cannot be undone.`;

  if (typeof deleteModal.showModal === 'function') {
    deleteModal.showModal();
  } else {
    deleteModal.setAttribute('open', '');
  }
}

/**
 * Close Delete dialog
 */
function closeDeleteDialog() {
  taskToDeleteId = null;
  if (typeof deleteModal.close === 'function') {
    deleteModal.close();
  } else {
    deleteModal.removeAttribute('open');
  }
}

/**
 * Confirm deletion
 */
function handleConfirmDelete() {
  if (!taskToDeleteId) return;

  tasks = tasks.filter(t => t.id !== taskToDeleteId);
  saveTasks();
  closeDeleteDialog();
  render();
}

/**
 * Open Name modal
 */
function openNameDialog() {
  nameInput.value = userName;
  if (typeof nameModal.showModal === 'function') {
    nameModal.showModal();
  } else {
    nameModal.setAttribute('open', '');
  }
  nameInput.focus();
}

/**
 * Close Name modal
 */
function closeNameDialog() {
  if (typeof nameModal.close === 'function') {
    nameModal.close();
  } else {
    nameModal.removeAttribute('open');
  }
}

/**
 * Save user name
 */
function handleSaveName(e) {
  e.preventDefault();
  const enteredName = nameInput.value.trim();
  userName = enteredName;

  try {
    if (userName) {
      localStorage.setItem(USER_NAME_KEY, userName);
    } else {
      localStorage.removeItem(USER_NAME_KEY);
    }
  } catch (error) {
    console.error('Failed to save user name to localStorage:', error);
  }

  updateWelcomeNote();
  closeNameDialog();
}

/**
 * Format due date and evaluate overdue / due today status
 */
function formatDueDate(dueDateStr, isAchieved) {
  if (!dueDateStr) return null;

  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return null;

  const now = new Date();
  const formattedDateTime = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + due.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  if (isAchieved) {
    return {
      type: 'achieved-due',
      label: `Target was: ${formattedDateTime}`
    };
  }

  // Check if overdue
  if (due < now) {
    return {
      type: 'overdue',
      label: `⚠️ Overdue (${formattedDateTime})`
    };
  }

  // Check if due today
  const isToday = (
    due.getDate() === now.getDate() &&
    due.getMonth() === now.getMonth() &&
    due.getFullYear() === now.getFullYear()
  );

  if (isToday) {
    const timeOnly = due.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    });
    return {
      type: 'due-today',
      label: `⏰ Due Today at ${timeOnly}`
    };
  }

  return {
    type: 'normal',
    label: `📅 Due: ${formattedDateTime}`
  };
}

/**
 * Format timestamp into readable date string
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Escape HTML to prevent XSS injection
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Update top statistics counter, tab counts, and Daily Strength Bar
 */
function updateStatsAndStrength() {
  const total = tasks.length;
  const achieved = tasks.filter(t => t.achieved).length;
  const pending = total - achieved;

  // Stats bar numbers
  totalCountEl.textContent = total;
  achievedCountEl.textContent = achieved;
  pendingCountEl.textContent = pending;

  // Update tab labels
  filterTabs.forEach(tab => {
    const filter = tab.getAttribute('data-filter');
    if (filter === 'all') {
      tab.textContent = `All (${total})`;
    } else if (filter === 'pending') {
      tab.textContent = `Not Achieved (${pending})`;
    } else if (filter === 'achieved') {
      tab.textContent = `Achieved (${achieved})`;
    }
  });

  // Calculate Daily Strength
  const percentage = total === 0 ? 0 : Math.round((achieved / total) * 100);

  // Set today's date label
  const today = new Date();
  strengthTodayDate.textContent = today.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Update Strength Meter
  strengthPercentage.textContent = `${percentage}%`;
  strengthFill.style.width = `${percentage}%`;
  strengthProgressBar.setAttribute('aria-valuenow', percentage);
  strengthSummary.textContent = `${achieved} of ${total} tasks achieved`;

  // Dynamic Strength Level and Motivational Message
  let level = 'Starting Out';
  let motivation = 'Add a task to start building daily strength!';

  if (total === 0) {
    level = 'Ready';
    motivation = 'Your day is a clean slate. Set a goal above!';
  } else if (percentage === 0) {
    level = 'Starting Out';
    motivation = 'Take the first step to get your momentum rolling! 🚀';
  } else if (percentage <= 25) {
    level = 'Building Pace';
    motivation = 'Great start! Keep the positive energy moving 🔥';
  } else if (percentage <= 50) {
    level = 'Gaining Momentum';
    motivation = 'Halfway mark! Your daily strength is growing 💪';
  } else if (percentage <= 75) {
    level = 'High Strength';
    motivation = 'Phenomenal progress! You are unstoppable today ⚡';
  } else if (percentage < 100) {
    level = 'Beast Mode';
    motivation = 'Almost at the peak! Finish strong! 🎯';
  } else {
    level = 'Peak Power 🏆';
    motivation = '100% Strength! You crushed every single task today! 🎉';
  }

  strengthLevel.textContent = level;
  strengthMotivation.textContent = motivation;
}

/**
 * Render the task list and empty state based on filters and search
 */
function render() {
  // Update header counters and strength meter
  updateStatsAndStrength();

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (currentFilter === 'achieved' && !task.achieved) return false;
    if (currentFilter === 'pending' && task.achieved) return false;

    // Search query filter (matches Task, Goal, or Sub-task text)
    if (searchQuery) {
      const matchTask = task.task.toLowerCase().includes(searchQuery);
      const matchGoal = task.goal.toLowerCase().includes(searchQuery);
      const matchSubtask = Array.isArray(task.subtasks) && task.subtasks.some(st =>
        st.text.toLowerCase().includes(searchQuery)
      );
      return matchTask || matchGoal || matchSubtask;
    }

    return true;
  });

  // Handle empty states
  if (filteredTasks.length === 0) {
    todoList.innerHTML = '';
    emptyState.hidden = false;

    if (tasks.length === 0) {
      emptyTitle.textContent = 'No tasks yet!';
      emptyDescription.textContent = 'Add your first task, set an expiration date, and break it into action steps to get started.';
    } else if (searchQuery) {
      emptyTitle.textContent = 'No matching tasks';
      emptyDescription.textContent = `We couldn't find any tasks matching "${searchQuery}".`;
    } else if (currentFilter === 'achieved') {
      emptyTitle.textContent = 'No achieved tasks';
      emptyDescription.textContent = 'You haven\'t completed any tasks in this category yet. Keep pushing!';
    } else if (currentFilter === 'pending') {
      emptyTitle.textContent = 'All caught up!';
      emptyDescription.textContent = 'No pending tasks right now. You are doing fantastic!';
    }
    return;
  }

  emptyState.hidden = true;

  // Build task cards
  todoList.innerHTML = filteredTasks.map(task => {
    const isAchieved = task.achieved;
    const statusClass = isAchieved ? 'is-achieved' : 'is-not-achieved';
    const badgeClass = isAchieved ? 'achieved' : 'pending';
    const badgeText = isAchieved ? 'Achieved' : 'Not achieved';
    const formattedDate = formatDate(task.createdAt);
    const dueInfo = formatDueDate(task.dueDate, isAchieved);

    // Subtasks calculations
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const totalSub = subtasks.length;
    const doneSub = subtasks.filter(s => s.completed).length;
    const subtaskPercent = totalSub === 0 ? 0 : Math.round((doneSub / totalSub) * 100);

    // Subtask HTML list
    const subtasksListHtml = subtasks.map(st => `
      <li class="card-subtask-item ${st.completed ? 'is-completed' : ''}">
        <input
          type="checkbox"
          class="subtask-checkbox"
          ${st.completed ? 'checked' : ''}
          data-task-id="${escapeHtml(task.id)}"
          data-subtask-id="${escapeHtml(st.id)}"
          aria-label="Toggle step: ${escapeHtml(st.text)}"
        >
        <span class="card-subtask-text">${escapeHtml(st.text)}</span>
        <button
          type="button"
          class="delete-card-subtask-btn"
          data-task-id="${escapeHtml(task.id)}"
          data-subtask-id="${escapeHtml(st.id)}"
          title="Delete step"
          aria-label="Delete step: ${escapeHtml(st.text)}"
        >&times;</button>
      </li>
    `).join('');

    return `
      <li class="todo-item ${statusClass}" data-id="${escapeHtml(task.id)}">
        <div class="todo-main">
          <label class="status-toggle-label" title="Mark as ${isAchieved ? 'Not achieved' : 'Achieved'}">
            <input
              type="checkbox"
              class="status-checkbox"
              ${isAchieved ? 'checked' : ''}
              aria-label="Mark task as ${isAchieved ? 'not achieved' : 'achieved'}"
            >
          </label>

          <div class="todo-content">
            <div class="todo-header-line">
              <h3 class="task-title">${escapeHtml(task.task)}</h3>
              <span class="status-pill ${badgeClass}">
                <span class="status-pill-dot"></span>
                ${badgeText}
              </span>
            </div>

            <!-- Goal Badge -->
            <div class="goal-badge-wrap">
              <span class="goal-label">Goal:</span>
              <span class="goal-text">${escapeHtml(task.goal)}</span>
            </div>

            <!-- Expiration / Due Date Badge if set -->
            ${dueInfo ? `
              <div class="due-badge ${dueInfo.type}">
                ${escapeHtml(dueInfo.label)}
              </div>
            ` : ''}

            <!-- Achieved Celebration Note -->
            ${isAchieved ? `
              <div class="crushed-it-banner" aria-label="Celebration note">
                <span class="crushed-icon" aria-hidden="true">🎉</span>
                <span class="crushed-text">You crushed it. Well-done!</span>
              </div>
            ` : ''}

            <!-- Sub-tasks Section on Card -->
            <div class="subtasks-card-section">
              <div class="subtasks-header">
                <span>Action Steps (${doneSub}/${totalSub})</span>
                <span>${subtaskPercent}% completed</span>
              </div>

              ${totalSub > 0 ? `
                <div class="subtasks-progress-mini">
                  <div class="subtasks-progress-fill" style="width: ${subtaskPercent}%;"></div>
                </div>
              ` : ''}

              ${totalSub > 0 ? `
                <ul class="card-subtasks-list">
                  ${subtasksListHtml}
                </ul>
              ` : ''}

              <!-- Add Subtask Inline Row on Card -->
              <div class="card-add-subtask-row">
                <input
                  type="text"
                  class="card-subtask-input"
                  data-task-id="${escapeHtml(task.id)}"
                  placeholder="+ Add a step to achieve goal..."
                  autocomplete="off"
                >
                <button
                  type="button"
                  class="btn btn-secondary btn-sm card-add-subtask-btn"
                  data-task-id="${escapeHtml(task.id)}"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="todo-footer">
          <span class="todo-time">${formattedDate ? 'Created ' + formattedDate : ''}</span>
          <div class="todo-actions">
            <button
              type="button"
              class="action-btn edit-btn"
              aria-label="Edit task: ${escapeHtml(task.task)}"
            >
              <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>Edit</span>
            </button>

            <button
              type="button"
              class="action-btn delete-btn"
              aria-label="Delete task: ${escapeHtml(task.task)}"
            >
              <svg class="action-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </li>
    `;
  }).join('');
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
