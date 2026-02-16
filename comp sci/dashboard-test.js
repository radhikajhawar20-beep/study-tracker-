// Simple test script
console.log('Dashboard script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Test basic functionality
    const editTasksBtn = document.getElementById('editTasksGoal');
    const editHoursBtn = document.getElementById('editHoursGoal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    
    console.log('Buttons found:', { editTasksBtn, editHoursBtn, addTaskBtn });
    
    if (editTasksBtn) {
        editTasksBtn.addEventListener('click', function() {
            alert('Tasks edit button clicked!');
        });
    }
    
    if (editHoursBtn) {
        editHoursBtn.addEventListener('click', function() {
            alert('Hours edit button clicked!');
        });
    }
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            alert('Add task button clicked!');
        });
    }
});