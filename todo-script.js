 document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterIndicator = document.querySelector('.filter-indicator');

    // State
    let tasks = [];
    let currentFilter = 'all';

    // Initialize
    init();

    // Event Listeners
    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setFilter(filter);
            
            // Animate filter indicator
            const buttonRect = this.getBoundingClientRect();
            const containerRect = this.parentElement.getBoundingClientRect();
            
            filterIndicator.style.width = `${buttonRect.width}px`;
            filterIndicator.style.left = `${buttonRect.left - containerRect.left}px`;
        });
    });

    // Functions
    function init() {
        // Load tasks from localStorage
        loadTasks();
        
        // Render tasks
        renderTasks();
        
        // Initialize filter indicator position
        setTimeout(() => {
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            if (activeFilterBtn) {
                const buttonRect = activeFilterBtn.getBoundingClientRect();
                const containerRect = activeFilterBtn.parentElement.getBoundingClientRect();
                
                filterIndicator.style.width = `${buttonRect.width}px`;
                filterIndicator.style.left = `${buttonRect.left - containerRect.left}px`;
            }
        }, 0);

        // Focus on input
        taskInput.focus();
    }
    
    function loadTasks() {
        const storedTasks = localStorage.getItem('todoTasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    }
    
    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        
        if (taskText === '') {
            shakeElement(taskInput);
            return;
        }
        
        // Create new task object
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            date: new Date()
        };
        
        // Add to tasks array
        tasks.push(newTask);
        
        // Save to localStorage
        saveTasks();
        
        // Clear input
        taskInput.value = '';
        
        // Focus on input
        taskInput.focus();
        
        // Render tasks
        renderTasks();

        // Animation flourish
        playAddSound();
    }

    function deleteTask(id) {
        // Find task
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        
        // Add removing animation
        if (taskElement) {
            taskElement.classList.add('removing');
            
            // Wait for animation to complete
            setTimeout(() => {
                // Filter out the task with the given id
                tasks = tasks.filter(task => task.id !== id);
                
                // Save to localStorage
                saveTasks();
                
                // Render tasks
                renderTasks();
                
                // Play sound
                playRemoveSound();
            }, 300);
        }
    }

    function toggleTaskCompletion(id) {
        // Find the task
        const taskIndex = tasks.findIndex(task => task.id === id);
        
        if (taskIndex !== -1) {
            // Toggle completed status
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            
            // Save to localStorage
            saveTasks();
            
            // Mettre à jour juste l'élément de tâche au lieu de re-rendre toute la liste
            const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskElement) {
                if (tasks[taskIndex].completed) {
                    taskElement.classList.add('completed');
                    playCompleteSound();
                } else {
                    taskElement.classList.remove('completed');
                }
                
                // Mettre à jour le compteur sans re-rendre toute la liste
                updateTasksCounter();
            }
        }
    }

    function clearCompleted() {
        // Get all completed tasks
        const completedTasks = document.querySelectorAll('.task-item.completed');
        
        // Add removing animation to all completed tasks
        completedTasks.forEach(task => {
            task.classList.add('removing');
        });
        
        // Wait for animation to complete
        setTimeout(() => {
            // Filter out completed tasks
            tasks = tasks.filter(task => !task.completed);
            
            // Save to localStorage
            saveTasks();
            
            // Render tasks
            renderTasks();
            
            // Play sound
            playRemoveSound();
        }, 300);
    }

    function setFilter(filter) {
        // Set current filter
        currentFilter = filter;
        
        // Update active button
        filterButtons.forEach(button => {
            if (button.getAttribute('data-filter') === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Render tasks with filter
        renderTasks();
    }

    function renderTasks() {
        // Clear task list
        taskList.innerHTML = '';
        
        // Filter tasks based on current filter
        let filteredTasks = [...tasks];
        
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-list';
            emptyMessage.textContent = currentFilter === 'all' 
                ? 'Aucune tâche à afficher. Ajoutez-en une !' 
                : currentFilter === 'active' 
                    ? 'Aucune tâche active. Bravo !' 
                    : 'Aucune tâche terminée.';
            taskList.appendChild(emptyMessage);
        } else {
            // Sort tasks by date (newest first)
            filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Render each task
            filteredTasks.forEach((task, index) => {
                // Create task element
                const taskElement = document.createElement('li');
                taskElement.className = 'task-item';
                if (task.completed) {
                    taskElement.classList.add('completed');
                }
                taskElement.setAttribute('data-id', task.id);
                
                taskElement.innerHTML = `
                    <div class="checkbox">
                        <div class="check-icon">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                    <span class="task-text">${task.text}</span>
                    <button class="delete-btn">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                
                // Get elements
                const checkbox = taskElement.querySelector('.checkbox');
                const deleteBtn = taskElement.querySelector('.delete-btn');
                
                // Add event listeners
                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task.id);
                });
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });
                
                // Clicking the whole task item also toggles completion
                taskElement.addEventListener('click', (e) => {
                    // Only toggle if not clicking delete button or checkbox
                    if (!e.target.closest('.delete-btn') && !e.target.closest('.checkbox')) {
                        toggleTaskCompletion(task.id);
                    }
                });
                
                // Add task to list with a slight delay for staggered animation
                setTimeout(() => {
                    taskList.appendChild(taskElement);
                }, 50 * index);
            });
        }
        
        // Update counter
        updateTasksCounter();
    }

    function updateTasksCounter() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        let counterText = '';
        
        if (currentFilter === 'all') {
            counterText = `${totalTasks} tâche${totalTasks !== 1 ? 's' : ''} au total`;
        } else if (currentFilter === 'active') {
            counterText = `${activeTasks} tâche${activeTasks !== 1 ? 's' : ''} active${activeTasks !== 1 ? 's' : ''}`;
        } else if (currentFilter === 'completed') {
            counterText = `${completedTasks} tâche${completedTasks !== 1 ? 's' : ''} terminée${completedTasks !== 1 ? 's' : ''}`;
        }
        
        tasksCounter.textContent = counterText;
    }

    // Animation utility functions
    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }

    // Sound effects (subtle audio feedback)
    function playAddSound() {
        // For now just a visual feedback
        addButton.classList.add('pulse');
        setTimeout(() => {
            addButton.classList.remove('pulse');
        }, 300);
    }

    function playRemoveSound() {
        // Visual feedback only
    }

    function playCompleteSound() {
        // Visual feedback only
    }

    // Add CSS for animations that are added via JS
    const style = document.createElement('style');
    style.textContent = `
        .shake {
            animation: shake 0.5s ease;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
        
        .pulse {
            animation: pulse 0.3s ease;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .empty-list {
            text-align: center;
            padding: 20px;
            color: var(--text-light);
            font-style: italic;
            animation: fadeIn 0.5s ease;
        }
    `;
    document.head.appendChild(style);
});
