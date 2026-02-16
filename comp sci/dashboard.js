function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Create a temporary user for testing
        const tempUser = { name: 'Test User' };
        localStorage.setItem('currentUser', JSON.stringify(tempUser));
        return tempUser;
    }
    return JSON.parse(currentUser);
}

function initializeDashboardData() {
    if (!localStorage.getItem('studyTrackerData')) {
        const defaultData = {
            dailyGoals: {
                hours: 5,
                tasks: 3
            },
            progress: {
                hoursCompleted: 0,
                tasksCompleted: 0
            },
            stats: {
                pendingTasks: 0,
                completedThisWeek: 0,
                hoursToday: 0
            },
            lastUpdated: new Date().toDateString()
        };
        localStorage.setItem('studyTrackerData', JSON.stringify(defaultData));
    }

    const data = JSON.parse(localStorage.getItem('studyTrackerData'));
    const today = new Date().toDateString();
    if (data.lastUpdated !== today) {
        data.progress.hoursCompleted = 0;
        data.progress.tasksCompleted = 0;
        data.stats.hoursToday = 0;
        data.lastUpdated = today;
        localStorage.setItem('studyTrackerData', JSON.stringify(data));
    }
}

function getDashboardData() {
    return JSON.parse(localStorage.getItem('studyTrackerData'));
}

function updateProgressBars() {
    const data = getDashboardData();

    const hoursCompleted = data.progress.hoursCompleted;
    const hoursGoal = data.dailyGoals.hours;
    const hoursPercentage = Math.min((hoursCompleted / hoursGoal) * 100, 100);

    document.getElementById('hoursCompleted').textContent = hoursCompleted;
    document.getElementById('hoursGoal').textContent = hoursGoal;
    document.getElementById('hoursProgress').style.width = hoursPercentage + '%';
    document.getElementById('hoursPercentage').textContent = Math.round(hoursPercentage) + '%';

    const tasksCompleted = data.progress.tasksCompleted;
    const tasksGoal = data.dailyGoals.tasks;
    const tasksPercentage = Math.min((tasksCompleted / tasksGoal) * 100, 100);

    document.getElementById('tasksCompleted').textContent = tasksCompleted;
    document.getElementById('tasksGoal').textContent = tasksGoal;
    document.getElementById('tasksProgress').style.width = tasksPercentage + '%';
    document.getElementById('tasksPercentage').textContent = Math.round(tasksPercentage) + '%';
}

function updateQuickStats() {
    const data = getDashboardData();

    document.getElementById('pendingTasks').textContent = data.stats.pendingTasks;
    document.getElementById('completedWeek').textContent = data.stats.completedThisWeek;
    document.getElementById('hoursToday').textContent = data.stats.hoursToday;
}

function displayUserName() {
    const user = checkAuth();
    if (user) {
        document.getElementById('userName').textContent = user.name;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

function initDashboard() {
    const user = checkAuth();
    if (!user) return;

    initializeDashboardData();

    displayUserName();

    updateProgressBars();
    updateQuickStats();

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('hamburger').addEventListener('click', toggleMobileMenu);

    document.getElementById('addTaskBtn').addEventListener('click', () => {
        window.location.href = 'tasks.html';
    });

    // Goal editing functionality
    const editTasksBtn = document.getElementById('editTasksGoal');
    const editHoursBtn = document.getElementById('editHoursGoal');
    
    if (editTasksBtn) {
        editTasksBtn.addEventListener('click', () => {
            console.log('Tasks goal edit clicked');
            openGoalModal('tasks');
        });
    }

    if (editHoursBtn) {
        editHoursBtn.addEventListener('click', () => {
            console.log('Hours goal edit clicked');
            openGoalModal('hours');
        });
    }

    // Modal functionality
    const goalModalClose = document.getElementById('goalModalClose');
    const goalModalOverlay = document.getElementById('goalModalOverlay');
    const goalCancelBtn = document.getElementById('goalCancelBtn');
    const goalForm = document.getElementById('goalForm');
    
    if (goalModalClose) goalModalClose.addEventListener('click', closeGoalModal);
    if (goalModalOverlay) goalModalOverlay.addEventListener('click', closeGoalModal);
    if (goalCancelBtn) goalCancelBtn.addEventListener('click', closeGoalModal);
    if (goalForm) goalForm.addEventListener('submit', saveGoal);

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navMenu').classList.remove('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);

function updateDashboardProgress(type, value) {
    const data = getDashboardData();

    if (type === 'hours') {
        data.progress.hoursCompleted = Math.min(value, data.dailyGoals.hours);
        data.stats.hoursToday = value;
    } else if (type === 'tasks') {
        data.progress.tasksCompleted = Math.min(value, data.dailyGoals.tasks);
    } else if (type === 'pendingTasks') {
        data.stats.pendingTasks = value;
    } else if (type === 'completedWeek') {
        data.stats.completedThisWeek = value;
    }

    localStorage.setItem('studyTrackerData', JSON.stringify(data));
}

if (typeof window !== 'undefined') {
    window.updateDashboardProgress = updateDashboardProgress;
}

let currentGoalType = null;

function openGoalModal(type) {
    console.log('Opening goal modal for:', type);
    currentGoalType = type;
    const data = getDashboardData();
    const modal = document.getElementById('goalModal');
    const overlay = document.getElementById('goalModalOverlay');
    const title = document.getElementById('goalModalTitle');
    const label = document.getElementById('goalLabel');
    const input = document.getElementById('goalValue');

    console.log('Modal elements:', { modal, overlay, title, label, input });

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
    console.log('Modal should be visible now');
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

    const data = getDashboardData();
    
    if (currentGoalType === 'tasks') {
        data.dailyGoals.tasks = value;
    } else if (currentGoalType === 'hours') {
        data.dailyGoals.hours = value;
    }

    localStorage.setItem('studyTrackerData', JSON.stringify(data));
    updateProgressBars();
    closeGoalModal();
}

