// Dashboard functionality
console.log('Dashboard script loaded');

// Check authentication
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Initialize data
function initializeData() {
    if (!localStorage.getItem('studyTrackerData')) {
        const defaultData = {
            dailyGoals: { hours: 5, tasks: 3 },
            progress: { hoursCompleted: 0, tasksCompleted: 0 }
        };
        localStorage.setItem('studyTrackerData', JSON.stringify(defaultData));
    }
}

function getData() {
    return JSON.parse(localStorage.getItem('studyTrackerData'));
}

function updateProgressFromTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const data = getData();
    
    // Count completed tasks
    const completedTasks = tasks.filter(task => task.completed).length;
    
    // Sum logged hours
    const totalHours = tasks.reduce((sum, task) => sum + (task.hoursLogged || 0), 0);
    
    // Calculate weekly stats
    const pendingTasks = tasks.filter(t => !t.parentId && !t.completed).length;
    const completedThisWeek = tasks.filter(t => {
        if (!t.completedDate) return false;
        const completedDate = new Date(t.completedDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedDate >= weekAgo;
    }).length;
    
    // Update progress
    data.progress.tasksCompleted = completedTasks;
    data.progress.hoursCompleted = totalHours;
    
    // Update stats
    if (!data.stats) data.stats = {};
    data.stats.pendingTasks = pendingTasks;
    data.stats.completedThisWeek = completedThisWeek;
    
    localStorage.setItem('studyTrackerData', JSON.stringify(data));
}

function updateProgressBars() {
    updateProgressFromTasks(); // Sync with tasks first
    const data = getData();
    
    // Update tasks
    document.getElementById('tasksCompleted').textContent = data.progress.tasksCompleted;
    document.getElementById('tasksGoal').textContent = data.dailyGoals.tasks;
    const tasksPercent = Math.min((data.progress.tasksCompleted / data.dailyGoals.tasks) * 100, 100);
    document.getElementById('tasksProgress').style.width = tasksPercent + '%';
    document.getElementById('tasksPercentage').textContent = Math.round(tasksPercent) + '%';
    
    // Update hours
    document.getElementById('hoursCompleted').textContent = data.progress.hoursCompleted;
    document.getElementById('hoursGoal').textContent = data.dailyGoals.hours;
    const hoursPercent = Math.min((data.progress.hoursCompleted / data.dailyGoals.hours) * 100, 100);
    document.getElementById('hoursProgress').style.width = hoursPercent + '%';
    document.getElementById('hoursPercentage').textContent = Math.round(hoursPercent) + '%';
    
    // Update weekly stats
    document.getElementById('completedThisWeek').textContent = data.stats.completedThisWeek || 0;
    document.getElementById('pendingTasks').textContent = data.stats.pendingTasks || 0;
}

let currentGoalType = null;

function openGoalModal(type) {
    currentGoalType = type;
    const data = getData();
    const modal = document.getElementById('goalModal');
    const overlay = document.getElementById('goalModalOverlay');
    const title = document.getElementById('goalModalTitle');
    const label = document.getElementById('goalLabel');
    const input = document.getElementById('goalValue');

    if (type === 'tasks') {
        title.textContent = 'Edit Daily Tasks Goal';
        label.textContent = 'Number of tasks';
        input.value = data.dailyGoals.tasks;
    } else if (type === 'hours') {
        title.textContent = 'Edit Daily Hours Goal';
        label.textContent = 'Number of hours';
        input.value = data.dailyGoals.hours;
    }

    modal.style.display = 'block';
    overlay.style.display = 'block';
    input.focus();
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
    document.getElementById('goalModalOverlay').style.display = 'none';
    currentGoalType = null;
}

function saveGoal(e) {
    e.preventDefault();
    const value = parseInt(document.getElementById('goalValue').value);
    
    if (value < 1) {
        alert('Goal must be at least 1');
        return;
    }

    const data = getData();
    
    if (currentGoalType === 'tasks') {
        data.dailyGoals.tasks = value;
    } else if (currentGoalType === 'hours') {
        data.dailyGoals.hours = value;
    }

    localStorage.setItem('studyTrackerData', JSON.stringify(data));
    updateProgressBars();
    closeGoalModal();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Check authentication first
    const user = checkAuth();
    if (!user) return;
    
    // Display user name
    document.getElementById('userName').textContent = user.name;
    
    initializeData();
    updateProgressBars();
    
    // Edit buttons
    document.getElementById('editTasksGoal').addEventListener('click', () => openGoalModal('tasks'));
    document.getElementById('editHoursGoal').addEventListener('click', () => openGoalModal('hours'));
    
    // Modal controls
    document.getElementById('goalModalClose').addEventListener('click', closeGoalModal);
    document.getElementById('goalModalOverlay').addEventListener('click', closeGoalModal);
    document.getElementById('goalCancelBtn').addEventListener('click', closeGoalModal);
    document.getElementById('goalForm').addEventListener('submit', saveGoal);
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });
    
    // Listen for storage changes to update progress when tasks change
    window.addEventListener('storage', function(e) {
        if (e.key === 'tasks') {
            updateProgressBars();
        }
    });
    
    // Also check for updates periodically
    setInterval(updateProgressBars, 1000);
});