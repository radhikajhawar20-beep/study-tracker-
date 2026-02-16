// Advanced Array Aggregation Examples - Evidence of Complex Data Aggregation

// Complex multi-level aggregation for analytics
function generateTaskAnalytics(tasks) {
    return {
        // Sum aggregations
        totalHours: tasks.reduce((sum, task) => sum + (task.hoursLogged || 0), 0),
        totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
        
        // Count aggregations by status
        statusCounts: tasks.reduce((counts, task) => {
            const status = task.completed ? 'completed' : 'pending';
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {}),
        
        // Priority-based aggregation
        priorityBreakdown: tasks.reduce((breakdown, task) => {
            const priority = task.priority || 'medium';
            if (!breakdown[priority]) {
                breakdown[priority] = { count: 0, totalHours: 0, completedCount: 0 };
            }
            breakdown[priority].count++;
            breakdown[priority].totalHours += (task.hoursLogged || 0);
            if (task.completed) breakdown[priority].completedCount++;
            return breakdown;
        }, {}),
        
        // Date-based aggregations
        weeklyProgress: tasks.reduce((weekly, task) => {
            if (task.completedDate) {
                const weekKey = getWeekKey(new Date(task.completedDate));
                if (!weekly[weekKey]) {
                    weekly[weekKey] = { tasks: 0, hours: 0 };
                }
                weekly[weekKey].tasks++;
                weekly[weekKey].hours += (task.hoursLogged || 0);
            }
            return weekly;
        }, {}),
        
        // Average calculations using aggregation
        averageHoursPerTask: tasks.length > 0 ? 
            tasks.reduce((sum, task) => sum + (task.hoursLogged || 0), 0) / tasks.length : 0,
        
        // Complex nested aggregation for parent-child relationships
        hierarchicalStats: tasks
            .filter(t => !t.parentId) // Main tasks only
            .reduce((stats, mainTask) => {
                const subtasks = tasks.filter(t => t.parentId === mainTask.id);
                stats.mainTasks++;
                stats.totalSubtasks += subtasks.length;
                stats.avgSubtasksPerMain = stats.totalSubtasks / stats.mainTasks;
                
                // Aggregate subtask completion rates
                const completedSubtasks = subtasks.filter(t => t.completed).length;
                stats.subtaskCompletionRate = subtasks.length > 0 ? 
                    (completedSubtasks / subtasks.length) * 100 : 0;
                
                return stats;
            }, { mainTasks: 0, totalSubtasks: 0, avgSubtasksPerMain: 0, subtaskCompletionRate: 0 })
    };
}

// Aggregation for progress tracking
function calculateOverallProgress(tasks) {
    const aggregatedData = tasks.reduce((acc, task) => {
        // Skip subtasks to avoid double counting
        if (task.parentId) return acc;
        
        acc.totalTasks++;
        acc.totalEstimatedHours += (task.estimatedHours || 0);
        acc.totalLoggedHours += (task.hoursLogged || 0);
        
        if (task.completed) {
            acc.completedTasks++;
            acc.completedHours += (task.hoursLogged || 0);
        }
        
        // Aggregate by due date proximity
        if (task.dueDate) {
            const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) acc.overdueTasks++;
            else if (daysUntilDue <= 7) acc.dueSoonTasks++;
        }
        
        return acc;
    }, {
        totalTasks: 0,
        completedTasks: 0,
        totalEstimatedHours: 0,
        totalLoggedHours: 0,
        completedHours: 0,
        overdueTasks: 0,
        dueSoonTasks: 0
    });
    
    // Calculate derived metrics
    return {
        ...aggregatedData,
        completionRate: aggregatedData.totalTasks > 0 ? 
            (aggregatedData.completedTasks / aggregatedData.totalTasks) * 100 : 0,
        hoursEfficiency: aggregatedData.totalEstimatedHours > 0 ? 
            (aggregatedData.totalLoggedHours / aggregatedData.totalEstimatedHours) * 100 : 0
    };
}

// Time-based aggregation for productivity insights
function aggregateProductivityMetrics(tasks) {
    const now = new Date();
    
    return {
        // Daily aggregation
        today: tasks
            .filter(t => t.completedDate && 
                new Date(t.completedDate).toDateString() === now.toDateString())
            .reduce((acc, task) => ({
                tasks: acc.tasks + 1,
                hours: acc.hours + (task.hoursLogged || 0)
            }), { tasks: 0, hours: 0 }),
        
        // Weekly aggregation
        thisWeek: tasks
            .filter(t => {
                if (!t.completedDate) return false;
                const completedDate = new Date(t.completedDate);
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                return completedDate >= weekStart;
            })
            .reduce((acc, task) => ({
                tasks: acc.tasks + 1,
                hours: acc.hours + (task.hoursLogged || 0),
                priorities: {
                    ...acc.priorities,
                    [task.priority || 'medium']: (acc.priorities[task.priority || 'medium'] || 0) + 1
                }
            }), { tasks: 0, hours: 0, priorities: {} }),
        
        // Monthly aggregation with trend analysis
        monthlyTrend: tasks
            .filter(t => t.completedDate)
            .reduce((months, task) => {
                const date = new Date(task.completedDate);
                const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                
                if (!months[monthKey]) {
                    months[monthKey] = { tasks: 0, hours: 0, avgHoursPerTask: 0 };
                }
                
                months[monthKey].tasks++;
                months[monthKey].hours += (task.hoursLogged || 0);
                months[monthKey].avgHoursPerTask = months[monthKey].hours / months[monthKey].tasks;
                
                return months;
            }, {})
    };
}

// Helper function for week key generation
function getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
}

// Complex aggregation for dashboard summary
function generateDashboardSummary(tasks) {
    const summary = tasks.reduce((acc, task) => {
        // Basic counts
        acc.total++;
        if (task.completed) acc.completed++;
        if (!task.parentId) acc.mainTasks++;
        else acc.subtasks++;
        
        // Hours aggregation
        acc.totalHours += (task.hoursLogged || 0);
        acc.estimatedHours += (task.estimatedHours || 0);
        
        // Priority distribution
        const priority = task.priority || 'medium';
        acc.byPriority[priority] = (acc.byPriority[priority] || 0) + 1;
        
        // Status with time analysis
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            
            if (!task.completed && dueDate < today) {
                acc.overdue++;
            } else if (!task.completed && dueDate.toDateString() === today.toDateString()) {
                acc.dueToday++;
            }
        }
        
        return acc;
    }, {
        total: 0,
        completed: 0,
        mainTasks: 0,
        subtasks: 0,
        totalHours: 0,
        estimatedHours: 0,
        overdue: 0,
        dueToday: 0,
        byPriority: {}
    });
    
    // Add calculated fields
    summary.completionPercentage = summary.total > 0 ? 
        Math.round((summary.completed / summary.total) * 100) : 0;
    summary.hoursEfficiency = summary.estimatedHours > 0 ? 
        Math.round((summary.totalHours / summary.estimatedHours) * 100) : 0;
    
    return summary;
}