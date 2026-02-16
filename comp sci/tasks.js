
let tasks = [];
let editingTaskId = null;

function initTasksPage() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    loadTasks();
    displayTasks();
    setupEventListeners();
}

function loadTasks() {
    try {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        } else {
            tasks = [];
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
        alert('Failed to load tasks. Starting with empty task list.');
    }
}

function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateDashboardStats();
    } catch (error) {
        console.error('Error saving tasks:', error);
        alert('Failed to save tasks. Your changes may be lost.');
    }
}

function updateDashboardStats() {
    const pendingTasks = tasks.filter(t => !t.parentId && !t.completed).length;
    const completedThisWeek = tasks.filter(t => {
        if (!t.completedDate) return false;
        const completedDate = new Date(t.completedDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedDate >= weekAgo;
    }).length;
    
    const data = JSON.parse(localStorage.getItem('studyTrackerData')) || {
        dailyGoals: { hours: 5, tasks: 3 },
        progress: { hoursCompleted: 0, tasksCompleted: 0 },
        stats: { pendingTasks: 0, completedThisWeek: 0, hoursToday: 0 }
    };
    
    data.stats.pendingTasks = pendingTasks;
    data.stats.completedThisWeek = completedThisWeek;
    
    const today = new Date().toDateString();
    const tasksCompletedToday = tasks.filter(t => {
        if (!t.completedDate) return false;
        return new Date(t.completedDate).toDateString() === today;
    }).length;
    data.progress.tasksCompleted = tasksCompletedToday;
    
    localStorage.setItem('studyTrackerData', JSON.stringify(data));
}

function displayTasks() {
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');

    let filteredTasks = tasks.filter(task => !task.parentId);
    
    // Update parent hours for all main tasks
    filteredTasks.forEach(task => {
        const subtasks = tasks.filter(t => t.parentId === task.id);
        if (subtasks.length > 0) {
            updateParentHours(task.id);
        }
    });

    filteredTasks.sort((a, b) => {
        // First sort by due date
        if (!a.dueDate && !b.dueDate) {
            // Both have no due date, continue to priority
        } else if (!a.dueDate) return 1;
        else if (!b.dueDate) return -1;
        else {
            const dateComparison = new Date(a.dueDate) - new Date(b.dueDate);
            if (dateComparison !== 0) return dateComparison;
        }
        
        // Then sort by priority (high=0, medium=1, low=2)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Finally sort by estimated hours (shortest first)
        return (a.estimatedHours || 0) - (b.estimatedHours || 0);
    });

    if (filteredTasks.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    container.innerHTML = filteredTasks.map(task => renderTaskCard(task)).join('');
}

function renderTaskCard(task) {
    const subtasks = tasks.filter(t => t.parentId === task.id);
    const progress = calculateProgress(task);
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    const priority = task.priority || 'medium';
    const priorityIcon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''} priority-${priority}" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-checkbox-container">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="toggleMainTask('${task.id}')"
                    >
                </div>
                <div class="task-info">
                    <h3 class="task-name ${task.completed ? 'completed' : ''}">${task.name}</h3>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    <div class="task-meta">
                        <div class="task-meta-item">
                            <span class="task-meta-icon">📅</span>
                            <span>${dueDate}</span>
                        </div>
                        <div class="task-meta-item">
                            <span class="task-meta-icon">⏱️</span>
                            <span>${task.hoursLogged || 0} / ${task.estimatedHours} hours</span>
                        </div>
                        <div class="task-meta-item">
                            <span class="task-meta-icon">${priorityIcon}</span>
                            <span>${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon-action edit" onclick="editTask('${task.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon-action delete" onclick="deleteTask('${task.id}')" title="Delete">
                        🗑️
                    </button>
                    <button class="btn-icon-action add-subtask" onclick="addSubtask('${task.id}')" title="Add Subtask">
                        +
                    </button>
                </div>
            </div>
            <div class="task-progress">
                <div class="task-progress-header">
                    <span class="task-progress-text">Progress</span>
                    <span class="task-progress-percentage">${progress}%</span>
                </div>
                <div class="task-progress-bar">
                    <div class="task-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            ${subtasks.length > 0 ? renderSubtasks(subtasks) : ''}
        </div>
    `;
}

function renderSubtasks(subtasks) {
    return `
        <div class="subtasks-container">
            ${subtasks.map(subtask => {
                const progress = calculateProgress(subtask);
                return `
                <div class="subtask-card">
                    <div class="subtask-header">
                        <input 
                            type="checkbox" 
                            class="subtask-checkbox" 
                            ${subtask.completed ? 'checked' : ''}
                            onchange="toggleSubtask('${subtask.id}')"
                        >
                        <div class="subtask-info">
                            <div class="subtask-name ${subtask.completed ? 'completed' : ''}">
                                ${subtask.name}
                            </div>
                            <div class="subtask-meta">
                                <span>⏱️ ${subtask.hoursLogged || 0} / ${subtask.estimatedHours} hours</span>
                            </div>
                        </div>
                        <div class="subtask-actions">
                            <button class="btn-icon-action edit" onclick="editTask('${subtask.id}')" title="Edit">
                                ✏️
                            </button>
                            <button class="btn-icon-action delete" onclick="deleteTask('${subtask.id}')" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="subtask-progress">
                        <div class="subtask-progress-bar">
                            <div class="subtask-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
}

function calculateProgress(task) {
    if (!task.estimatedHours || task.estimatedHours === 0) return 0;
    const progress = (task.hoursLogged / task.estimatedHours) * 100;
    return Math.min(Math.round(progress), 100);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('saveBtn').textContent = 'Save Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('isSubtask').value = 'false';
    document.getElementById('parentTaskGroup').style.display = 'none';
    document.getElementById('priorityGroup').style.display = 'block';
    clearErrors();
    document.getElementById('taskModal').classList.add('show');
}

function addSubtask(parentId) {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Add Subtask';
    document.getElementById('saveBtn').textContent = 'Save Subtask';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('isSubtask').value = 'true';
    
    const parentSelect = document.getElementById('parentTask');
    document.getElementById('parentTaskGroup').style.display = 'block';
    document.getElementById('priorityGroup').style.display = 'none';
    
    // Populate dropdown first, then set value
    populateParentTaskDropdown();
    parentSelect.value = parentId;
    
    // Set subtask priority to match parent
    const parentTask = tasks.find(t => t.id === parentId);
    if (parentTask) {
        document.getElementById('taskPriority').value = parentTask.priority || 'medium';
    }
    
    clearErrors();
    document.getElementById('taskModal').classList.add('show');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('saveBtn').textContent = 'Update Task';
    
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskDueDate').value = task.dueDate || '';
    document.getElementById('taskPriority').value = task.priority || 'medium';
    document.getElementById('taskEstimatedHours').value = task.estimatedHours;
    document.getElementById('taskHoursLogged').value = task.hoursLogged || 0;
    document.getElementById('taskId').value = task.id;
    
    if (task.parentId) {
        document.getElementById('isSubtask').value = 'true';
        document.getElementById('parentTask').value = task.parentId;
        document.getElementById('parentTaskGroup').style.display = 'block';
        document.getElementById('priorityGroup').style.display = 'none';
    } else {
        document.getElementById('isSubtask').value = 'false';
        document.getElementById('parentTaskGroup').style.display = 'none';
        document.getElementById('priorityGroup').style.display = 'block';
    }
    
    clearErrors();
    document.getElementById('taskModal').classList.add('show');
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    const taskToDelete = tasks.find(t => t.id === taskId);
    const parentId = taskToDelete ? taskToDelete.parentId : null;
    
    tasks = tasks.filter(t => t.id !== taskId && t.parentId !== taskId);
    
    // Update parent hours if this was a subtask
    if (parentId) {
        updateParentHours(parentId);
    }
    
    saveTasks();
    displayTasks();
}

function toggleMainTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    task.completedDate = task.completed ? new Date().toISOString() : null;
    
    if (task.completed) {
        const subtasks = tasks.filter(t => t.parentId === taskId);
        subtasks.forEach(subtask => {
            subtask.completed = true;
            subtask.completedDate = new Date().toISOString();
        });
    }
    
    saveTasks();
    displayTasks();
}

function toggleSubtask(subtaskId) {
    const subtask = tasks.find(t => t.id === subtaskId);
    if (!subtask) return;
    
    subtask.completed = !subtask.completed;
    subtask.completedDate = subtask.completed ? new Date().toISOString() : null;
    
    if (subtask.parentId) {
        updateParentProgress(subtask.parentId);
    }
    
    saveTasks();
    displayTasks();
}

function updateParentHours(parentId) {
    const parent = tasks.find(t => t.id === parentId);
    const subtasks = tasks.filter(t => t.parentId === parentId);
    
    if (!parent || subtasks.length === 0) return;
    
    const totalEstimatedHours = subtasks.reduce((sum, subtask) => sum + (subtask.estimatedHours || 0), 0);
    const totalLoggedHours = subtasks.reduce((sum, subtask) => sum + (subtask.hoursLogged || 0), 0);
    
    parent.estimatedHours = totalEstimatedHours;
    parent.hoursLogged = totalLoggedHours;
}

function updateParentProgress(parentId) {
    const parent = tasks.find(t => t.id === parentId);
    const subtasks = tasks.filter(t => t.parentId === parentId);
    
    if (subtasks.length === 0) return;
    
    // Update hours first
    updateParentHours(parentId);
    
    // Check if all subtasks are completed
    const completedSubtasks = subtasks.filter(t => t.completed).length;
    const allCompleted = completedSubtasks === subtasks.length;
    
    parent.completed = allCompleted;
    parent.completedDate = allCompleted ? new Date().toISOString() : null;
}

function validateForm() {
    let isValid = true;
    clearErrors();
    
    const taskName = document.getElementById('taskName').value.trim();
    const estimatedHours = parseFloat(document.getElementById('taskEstimatedHours').value);
    const hoursLogged = parseFloat(document.getElementById('taskHoursLogged').value) || 0;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!taskName) {
        showError('taskNameError', 'Task name is required');
        isValid = false;
    }
    
    if (!estimatedHours || estimatedHours <= 0) {
        showError('taskHoursError', 'Estimated hours must be greater than 0');
        isValid = false;
    }
    
    if (estimatedHours > 100) {
        showError('taskHoursError', 'Estimated hours must be less than 100');
        isValid = false;
    }
    
    if (hoursLogged > estimatedHours) {
        showError('taskLoggedHoursError', 'Hours logged cannot exceed estimated hours');
        isValid = false;
    }
    
    if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dueDate);
        
        if (selectedDate < today) {
            showError('taskDateError', 'Due date must be today or in the future');
            isValid = false;
        }
    }
    
    return isValid;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('show');
    document.getElementById('taskForm').reset();
    editingTaskId = null;
}

function setupEventListeners() {
    document.getElementById('addTaskBtn').addEventListener('click', openAddTaskModal);
    
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });
    
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
    });
    
    populateParentTaskDropdown();
}

function populateParentTaskDropdown() {
    const parentSelect = document.getElementById('parentTask');
    // Only show main tasks (tasks without parentId) as parent options
    const mainTasks = tasks.filter(t => !t.parentId);
    
    // Check if we're adding a subtask (no "None" option for subtasks)
    const isSubtask = document.getElementById('isSubtask').value === 'true';
    
    if (isSubtask) {
        parentSelect.innerHTML = ''; // No "None" option for subtasks
    } else {
        parentSelect.innerHTML = '<option value="">None (Main Task)</option>';
    }
    
    mainTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.name;
        parentSelect.appendChild(option);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = {
        id: editingTaskId || generateId(),
        name: document.getElementById('taskName').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        estimatedHours: parseFloat(document.getElementById('taskEstimatedHours').value),
        hoursLogged: parseFloat(document.getElementById('taskHoursLogged').value) || 0,
        parentId: document.getElementById('isSubtask').value === 'true' ? 
                  document.getElementById('parentTask').value : null,
        completed: false,
        completedDate: null,
        createdAt: new Date().toISOString()
    };
    
    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            formData.completed = tasks[index].completed;
            formData.completedDate = tasks[index].completedDate;
            formData.createdAt = tasks[index].createdAt;
            
            // If editing a subtask, inherit parent priority
            if (formData.parentId) {
                const parentTask = tasks.find(t => t.id === formData.parentId);
                if (parentTask) {
                    formData.priority = parentTask.priority || 'medium';
                }
            }
            
            tasks[index] = formData;
        }
    } else {
        // If creating a subtask, inherit parent priority
        if (formData.parentId) {
            const parentTask = tasks.find(t => t.id === formData.parentId);
            if (parentTask) {
                formData.priority = parentTask.priority || 'medium';
            }
        }
        tasks.push(formData);
    }
    
    // Update parent task hours if this is a subtask
    if (formData.parentId) {
        updateParentHours(formData.parentId);
    }
    
    saveTasks();
    displayTasks();
    closeModal();
    populateParentTaskDropdown();
}

document.addEventListener('DOMContentLoaded', initTasksPage);

