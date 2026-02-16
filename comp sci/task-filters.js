// Advanced Task Filtering System - Evidence of Complex Conditional Filtering

let currentFilters = {
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    search: '',
    hoursRange: 'all',
    parentType: 'all'
};

// Complex multi-criteria filtering function
function applyAdvancedFilters(tasks) {
    return tasks.filter(task => {
        // Status filtering with multiple conditions
        if (currentFilters.status !== 'all') {
            if (currentFilters.status === 'completed' && !task.completed) return false;
            if (currentFilters.status === 'pending' && task.completed) return false;
            if (currentFilters.status === 'overdue') {
                if (!task.dueDate || task.completed) return false;
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                if (dueDate >= today) return false;
            }
            if (currentFilters.status === 'due-today') {
                if (!task.dueDate || task.completed) return false;
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                if (dueDate.toDateString() !== today.toDateString()) return false;
            }
        }

        // Priority-based conditional filtering
        if (currentFilters.priority !== 'all') {
            const taskPriority = task.priority || 'medium';
            if (taskPriority !== currentFilters.priority) return false;
        }

        // Complex date range filtering
        if (currentFilters.dateRange !== 'all') {
            const taskDate = task.dueDate ? new Date(task.dueDate) : null;
            const today = new Date();
            
            switch (currentFilters.dateRange) {
                case 'this-week':
                    if (!taskDate) return false;
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    if (taskDate < weekStart || taskDate > weekEnd) return false;
                    break;
                    
                case 'next-week':
                    if (!taskDate) return false;
                    const nextWeekStart = new Date(today);
                    nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
                    const nextWeekEnd = new Date(nextWeekStart);
                    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                    if (taskDate < nextWeekStart || taskDate > nextWeekEnd) return false;
                    break;
                    
                case 'this-month':
                    if (!taskDate) return false;
                    if (taskDate.getMonth() !== today.getMonth() || 
                        taskDate.getFullYear() !== today.getFullYear()) return false;
                    break;
                    
                case 'no-date':
                    if (taskDate) return false;
                    break;
            }
        }

        // Text search with multiple field matching
        if (currentFilters.search.trim()) {
            const searchTerm = currentFilters.search.toLowerCase();
            const matchesName = task.name.toLowerCase().includes(searchTerm);
            const matchesDescription = task.description && 
                task.description.toLowerCase().includes(searchTerm);
            const matchesPriority = (task.priority || 'medium').toLowerCase().includes(searchTerm);
            
            if (!matchesName && !matchesDescription && !matchesPriority) return false;
        }

        // Hours-based conditional filtering
        if (currentFilters.hoursRange !== 'all') {
            const hoursLogged = task.hoursLogged || 0;
            const estimatedHours = task.estimatedHours || 0;
            const progressPercent = estimatedHours > 0 ? (hoursLogged / estimatedHours) * 100 : 0;
            
            switch (currentFilters.hoursRange) {
                case 'not-started':
                    if (hoursLogged > 0) return false;
                    break;
                case 'in-progress':
                    if (hoursLogged === 0 || progressPercent >= 100) return false;
                    break;
                case 'over-estimated':
                    if (progressPercent <= 100) return false;
                    break;
                case 'near-completion':
                    if (progressPercent < 75 || progressPercent >= 100) return false;
                    break;
            }
        }

        // Hierarchical filtering (parent/subtask type)
        if (currentFilters.parentType !== 'all') {
            if (currentFilters.parentType === 'main-tasks' && task.parentId) return false;
            if (currentFilters.parentType === 'subtasks' && !task.parentId) return false;
            if (currentFilters.parentType === 'with-subtasks') {
                const hasSubtasks = tasks.some(t => t.parentId === task.id);
                if (!hasSubtasks) return false;
            }
        }

        return true;
    });
}

// Complex sorting with multiple criteria
function applySorting(filteredTasks, sortBy = 'dueDate') {
    return filteredTasks.sort((a, b) => {
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority || 'medium'];
                const bPriority = priorityOrder[b.priority || 'medium'];
                if (aPriority !== bPriority) return bPriority - aPriority;
                // Secondary sort by due date
                return sortByDueDate(a, b);
                
            case 'progress':
                const aProgress = calculateProgress(a);
                const bProgress = calculateProgress(b);
                if (aProgress !== bProgress) return aProgress - bProgress;
                return sortByDueDate(a, b);
                
            case 'hours':
                const aHours = a.hoursLogged || 0;
                const bHours = b.hoursLogged || 0;
                if (aHours !== bHours) return bHours - aHours;
                return sortByDueDate(a, b);
                
            case 'name':
                return a.name.localeCompare(b.name);
                
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt);
                
            default: // dueDate
                return sortByDueDate(a, b);
        }
    });
}

function sortByDueDate(a, b) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
}

// Advanced search with weighted results
function performWeightedSearch(tasks, searchTerm) {
    if (!searchTerm.trim()) return tasks;
    
    const term = searchTerm.toLowerCase();
    
    return tasks.map(task => {
        let score = 0;
        
        // Name match (highest weight)
        if (task.name.toLowerCase().includes(term)) {
            score += task.name.toLowerCase().indexOf(term) === 0 ? 10 : 5;
        }
        
        // Description match (medium weight)
        if (task.description && task.description.toLowerCase().includes(term)) {
            score += 3;
        }
        
        // Priority match (low weight)
        if ((task.priority || 'medium').toLowerCase().includes(term)) {
            score += 1;
        }
        
        return { ...task, searchScore: score };
    })
    .filter(task => task.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
}

// Complex filter combination logic
function getFilteredAndSortedTasks(allTasks, sortBy = 'dueDate') {
    // First apply basic hierarchical filter (main tasks only for display)
    let mainTasks = allTasks.filter(task => !task.parentId);
    
    // Apply advanced filters
    let filteredTasks = applyAdvancedFilters(mainTasks);
    
    // Apply weighted search if search term exists
    if (currentFilters.search.trim()) {
        filteredTasks = performWeightedSearch(filteredTasks, currentFilters.search);
    }
    
    // Apply sorting
    filteredTasks = applySorting(filteredTasks, sortBy);
    
    // For each main task, also filter its subtasks
    filteredTasks = filteredTasks.map(mainTask => {
        const subtasks = allTasks.filter(t => t.parentId === mainTask.id);
        const filteredSubtasks = applyAdvancedFilters(subtasks);
        
        return {
            ...mainTask,
            filteredSubtasks: filteredSubtasks
        };
    });
    
    return filteredTasks;
}

// Dynamic filter state management
function updateFilter(filterType, value) {
    currentFilters[filterType] = value;
    
    // Complex interdependent filter logic
    if (filterType === 'status' && value === 'completed') {
        // When showing completed tasks, reset date filters that don't make sense
        if (currentFilters.dateRange === 'overdue') {
            currentFilters.dateRange = 'all';
        }
    }
    
    if (filterType === 'parentType' && value === 'subtasks') {
        // When filtering subtasks, some filters need adjustment
        if (currentFilters.hoursRange === 'with-subtasks') {
            currentFilters.hoursRange = 'all';
        }
    }
    
    // Trigger re-render with new filters
    displayFilteredTasks();
}

// Filter preset combinations
const filterPresets = {
    'urgent': {
        status: 'pending',
        priority: 'high',
        dateRange: 'this-week',
        hoursRange: 'all',
        parentType: 'main-tasks'
    },
    'overdue': {
        status: 'overdue',
        priority: 'all',
        dateRange: 'all',
        hoursRange: 'all',
        parentType: 'all'
    },
    'in-progress': {
        status: 'pending',
        priority: 'all',
        dateRange: 'all',
        hoursRange: 'in-progress',
        parentType: 'all'
    },
    'quick-wins': {
        status: 'pending',
        priority: 'low',
        dateRange: 'this-week',
        hoursRange: 'not-started',
        parentType: 'main-tasks'
    }
};

function applyFilterPreset(presetName) {
    if (filterPresets[presetName]) {
        currentFilters = { ...currentFilters, ...filterPresets[presetName] };
        displayFilteredTasks();
    }
}