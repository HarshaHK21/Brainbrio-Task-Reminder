// --- State ---
const state = {
  activeTab: 'all',
  tasks: [],
  groups: ['inbox', 'work', 'personal', 'shopping'], // Default groups
  theme: 'light'
};

// --- DOM Elements ---
const DOM = {
  taskInput: document.getElementById('taskInput'),
  dueDateInput: document.getElementById('dueDateInput'),
  groupSelect: document.getElementById('groupSelect'),
  addBtn: document.getElementById('addBtn'),
  taskList: document.getElementById('taskList'),
  groupList: document.getElementById('groupList'),
  groupsView: document.getElementById('groupsView'),
  emptyState: document.getElementById('emptyState'),
  themeToggle: document.getElementById('themeToggle'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  tabs: document.querySelectorAll('.tab-btn'),
  // Modal Elements
  editModal: document.getElementById('editModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  saveEditBtn: document.getElementById('saveEditBtn'),
  editTaskId: document.getElementById('editTaskId'),
  editTaskInput: document.getElementById('editTaskInput'),
  editDateInput: document.getElementById('editDateInput'),
  editGroupSelect: document.getElementById('editGroupSelect'),
  editAlarmOffset: document.getElementById('editAlarmOffset'),
  // Settings Elements
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  soundInput: document.getElementById('soundInput'),
  previewSoundBtn: document.getElementById('previewSoundBtn'),
  resetSoundBtn: document.getElementById('resetSoundBtn')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadGroups();
  loadTasks();
  initTabs();
  renderGroupOptions(DOM.groupSelect);
  
  // Set default datetime
  const now = new Date();
  now.setHours(now.getHours() + 1);
  DOM.dueDateInput.value = now.toISOString().slice(0, 16);
});

// --- Event Listeners ---
DOM.themeToggle.addEventListener('click', toggleTheme);
DOM.addBtn.addEventListener('click', addTask);
DOM.taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// Group Creation Logic
DOM.groupSelect.addEventListener('change', handleGroupSelectChange);

function handleGroupSelectChange(e) {
  if (e.target.value === 'new') {
    const groupName = prompt("Enter new group name:");
    if (groupName) {
      const lowerName = groupName.toLowerCase();
      if (!state.groups.includes(lowerName)) {
        state.groups.push(lowerName);
        saveGroups();
        renderGroupOptions(DOM.groupSelect);
        renderGroupOptions(DOM.editGroupSelect); // Update modal select too
      }
      e.target.value = lowerName;
    } else {
      e.target.value = 'inbox';
    }
  }
}

// Modal Listeners
DOM.closeModalBtn.addEventListener('click', closeModal);
DOM.saveEditBtn.addEventListener('click', saveEdit);
DOM.editModal.addEventListener('click', (e) => {
  if (e.target === DOM.editModal) closeModal();
});

// Settings Modal Listeners
DOM.settingsBtn.addEventListener('click', openSettings);
DOM.closeSettingsBtn.addEventListener('click', closeSettings);
DOM.settingsModal.addEventListener('click', (e) => {
  if (e.target === DOM.settingsModal) closeSettings();
});

// Custom Sound Logic
DOM.soundInput.addEventListener('change', handleSoundUpload);
DOM.previewSoundBtn.addEventListener('click', togglePreviewSound);
DOM.resetSoundBtn.addEventListener('click', resetSound);

function openSettings() {
  DOM.settingsModal.classList.remove('hidden');
}

function closeSettings() {
  DOM.settingsModal.classList.add('hidden');
  // Stop sound if playing when closed
  if (currentPreviewAudio) {
    stopPreview();
  }
}

function handleSoundUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) { // 2MB Limit
    alert("File is too large. Max 2MB allowed.");
    DOM.soundInput.value = ''; // Reset input
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Audio = e.target.result;
    chrome.storage.local.set({ customSound: base64Audio }, () => {
      alert("Custom sound saved!");
    });
  };
  reader.readAsDataURL(file);
}

let currentPreviewAudio = null;

function togglePreviewSound() {
  if (currentPreviewAudio) {
    stopPreview();
    return;
  }

  chrome.storage.local.get(['customSound'], (result) => {
    if (result.customSound) {
      currentPreviewAudio = new Audio(result.customSound);
      currentPreviewAudio.onended = () => stopPreview();
      currentPreviewAudio.play();
      updatePreviewBtnUI(true);
    } else {
      alert("No custom sound set. Using default notification sound.");
    }
  });
}

function stopPreview() {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio = null;
  }
  updatePreviewBtnUI(false);
}

function updatePreviewBtnUI(isPlaying) {
  if (isPlaying) {
    DOM.previewSoundBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop Preview`;
    DOM.previewSoundBtn.style.color = "var(--danger-color)";
    DOM.previewSoundBtn.style.borderColor = "var(--danger-color)";
  } else {
    DOM.previewSoundBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Preview Sound`;
    DOM.previewSoundBtn.style.color = "";
    DOM.previewSoundBtn.style.borderColor = "";
  }
}

function resetSound() {
  chrome.storage.local.remove('customSound', () => {
    alert("Sound reset to default.");
    DOM.soundInput.value = '';
  });
}

// --- Tabs Logic ---
function initTabs() {
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      renderTasks();
    });
  });
}

// --- CRUD Operations ---
function addTask() {
  const text = DOM.taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text: text,
    completed: false,
    dueDate: DOM.dueDateInput.value || null,
    group: DOM.groupSelect.value,
    alarmOffset: 0 // Default: At time of event
  };

  state.tasks.push(newTask);
  saveTasks();
  
  if (newTask.dueDate) {
    createAlarm(newTask);
  }

  DOM.taskInput.value = '';
  renderTasks();
}

function updateTask(id, updates) {
  const index = state.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    state.tasks[index] = { ...state.tasks[index], ...updates };
    saveTasks();
    
    // Reset alarm if date or offset changed
    if (updates.dueDate !== undefined || updates.alarmOffset !== undefined) {
      chrome.alarms.clear(`task-${id}`);
      if (state.tasks[index].dueDate) {
        createAlarm(state.tasks[index]);
      }
    }
    
    renderTasks();
  }
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    updateTask(id, { completed: !task.completed });
  }
}

function deleteTask(id, event) {
  if(event) event.stopPropagation();
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  chrome.alarms.clear(`task-${id}`);
  renderTasks();
}

function deleteGroup(groupName) {
  if (confirm(`Delete group "${groupName}"? Tasks will move to Inbox.`)) {
    // 1. Remove from groups
    state.groups = state.groups.filter(g => g !== groupName);
    saveGroups();
    
    // 2. Move tasks to inbox
    state.tasks.forEach(t => {
      if (t.group === groupName) t.group = 'inbox';
    });
    saveTasks();
    
    // 3. Update UI
    renderGroupOptions(DOM.groupSelect);
    renderGroups();
  }
}

// --- Modal Logic ---
function openScheduleModal(id, event) {
  if(event) event.stopPropagation();
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  DOM.editTaskId.value = task.id;
  DOM.editTaskInput.value = task.text;
  DOM.editDateInput.value = task.dueDate || '';
  
  renderGroupOptions(DOM.editGroupSelect);
  DOM.editGroupSelect.value = task.group;
  
  // Set Offset Select
  DOM.editAlarmOffset.value = task.alarmOffset || 0;
  
  DOM.editModal.classList.remove('hidden');
}

function closeModal() {
  DOM.editModal.classList.add('hidden');
}

function saveEdit() {
  const id = parseInt(DOM.editTaskId.value);
  const newText = DOM.editTaskInput.value.trim();
  const newDate = DOM.editDateInput.value;
  const newGroup = DOM.editGroupSelect.value;
  const newOffset = parseInt(DOM.editAlarmOffset.value) || 0;
  
  if (newText) {
    updateTask(id, {
      text: newText,
      dueDate: newDate || null,
      group: newGroup,
      alarmOffset: newOffset
    });
    closeModal();
  }
}

// --- Alarms ---
function createAlarm(task) {
  const dueDate = new Date(task.dueDate).getTime();
  const offsetMs = (task.alarmOffset || 0) * 60 * 1000;
  const alarmTime = dueDate - offsetMs;
  
  if (alarmTime > Date.now()) {
    console.log(`Setting alarm for task ${task.id} at ${new Date(alarmTime).toLocaleString()}`);
    chrome.alarms.create(`task-${task.id}`, { when: alarmTime });
  }
}

// --- Rendering ---
function renderGroupOptions(selectElement) {
  selectElement.innerHTML = '';
  state.groups.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g.charAt(0).toUpperCase() + g.slice(1);
    selectElement.appendChild(opt);
  });
  
  // Add 'New Group' option only to main select
  if (selectElement === DOM.groupSelect) {
    const newOpt = document.createElement('option');
    newOpt.value = 'new';
    newOpt.textContent = '+ New Group';
    selectElement.appendChild(newOpt);
  }
}

function renderTasks() {
  DOM.taskList.innerHTML = '';
  DOM.groupsView.classList.add('hidden');
  DOM.taskList.classList.remove('hidden');

  let filteredTasks = [];

  switch (state.activeTab) {
    case 'all':
      filteredTasks = state.tasks;
      break;
    case 'today':
      const today = new Date().toISOString().slice(0, 10);
      filteredTasks = state.tasks.filter(t => t.dueDate && t.dueDate.startsWith(today));
      break;
    case 'upcoming':
      const now = new Date().toISOString();
      filteredTasks = state.tasks.filter(t => t.dueDate && t.dueDate > now);
      break;
    case 'groups':
      renderGroups();
      return;
  }

  filteredTasks.sort((a, b) => {
    if (a.completed === b.completed) {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return a.completed ? 1 : -1;
  });

  if (filteredTasks.length === 0) {
    DOM.emptyState.classList.remove('hidden');
  } else {
    DOM.emptyState.classList.add('hidden');
    filteredTasks.forEach(task => {
      DOM.taskList.appendChild(createTaskElement(task));
    });
  }
}

function renderGroups() {
  DOM.taskList.classList.add('hidden');
  DOM.groupsView.classList.remove('hidden');
  DOM.groupList.innerHTML = '';
  
  state.groups.forEach(g => {
    const count = state.tasks.filter(t => t.group === g).length;
    // Only 'inbox' is protected from deletion
    const isProtected = g === 'inbox';
    
    const li = document.createElement('li');
    li.className = 'group-item';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.padding = '12px';
    li.style.background = 'var(--card-bg)';
    li.style.borderRadius = '12px';
    li.style.marginBottom = '8px';
    
    li.innerHTML = `
      <div>
        <strong>${g.charAt(0).toUpperCase() + g.slice(1)}</strong>
        <span class="badge badge-count" style="margin-left:8px; font-size:11px;">${count} items</span>
      </div>
    `;
    
    if (!isProtected) {
      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn delete';
      delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      delBtn.onclick = () => deleteGroup(g);
      li.appendChild(delBtn);
    }
    
    DOM.groupList.appendChild(li);
  });
  
  DOM.emptyState.classList.add('hidden');
}

function createTaskElement(task) {
  const li = document.createElement('li');
  if (task.completed) li.classList.add('completed');
  li.onclick = () => toggleTask(task.id);

  let dateString = '';
  let isOverdue = false;
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    dateString = d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (d < new Date() && !task.completed) isOverdue = true;
  }

  li.innerHTML = `
    <div class="task-main">
      <span class="task-text">${task.text}</span>
      <div class="task-actions">
        <button class="icon-btn edit-btn" title="Edit Task">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="icon-btn alarm-btn" title="Schedule/Reminder">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3 2 6"></path><path d="m22 6-3-3"></path></svg>
        </button>
        <button class="icon-btn delete-btn" title="Delete Task" style="color:var(--danger-color)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
    <div class="task-meta">
      <span class="badge group-${task.group}">${task.group}</span>
      ${dateString ? `<span class="badge ${isOverdue ? 'overdue' : ''}" style="margin-left: auto;">${dateString}</span>` : ''}
    </div>
  `;

  // Attach event listeners manually
  li.querySelector('.task-text').addEventListener('click', () => toggleTask(task.id));
  li.querySelector('.edit-btn').addEventListener('click', (e) => openScheduleModal(task.id, e));
  li.querySelector('.alarm-btn').addEventListener('click', (e) => openScheduleModal(task.id, e));
  li.querySelector('.delete-btn').addEventListener('click', (e) => deleteTask(task.id, e));

  return li;
}

// --- Storage & Persistence ---
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function loadTasks() {
  const data = JSON.parse(localStorage.getItem('tasks') || '[]');
  state.tasks = data.map(t => {
    if (typeof t === 'string') {
      return { id: Date.now() + Math.random(), text: t, completed: false, group: 'inbox', dueDate: null };
    }
    if (!t.id) t.id = Date.now() + Math.random();
    if (!t.group) t.group = 'inbox';
    return t;
  });
  renderTasks();
}

function saveGroups() {
  localStorage.setItem('groups', JSON.stringify(state.groups));
}

function loadGroups() {
  const groups = JSON.parse(localStorage.getItem('groups'));
  if (groups) {
    state.groups = groups;
  }
}

// --- Theme ---
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  updateThemeIcons(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeIcons(true);
  }
}

function updateThemeIcons(isDark) {
  if (isDark) {
    DOM.sunIcon.classList.add('hidden');
    DOM.moonIcon.classList.remove('hidden');
  } else {
    DOM.sunIcon.classList.remove('hidden');
    DOM.moonIcon.classList.add('hidden');
  }
}