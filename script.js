
const FilterState = Object.freeze({
    ALL: 'all',
    ACTIVE: 'active', 
    COMPLETED: 'completed'
});

const TextContent = Object.freeze({
    TITLE: 'To-Do List',
    PLACEHOLDER: 'Новая задача ...',
    SEARCH_TASKS: 'Поиск задач...',
    ADD_BUTTON: 'Добавить',
    ALL_FILTER: 'Все',
    ACTIVE_FILTER: 'Активные',
    COMPLETED_FILTER: 'Выполненные'
});

const SortOrder = Object.freeze({
    ASC: 'asc',
    DESC: 'desc'
});



function generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}




class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = FilterState.ALL;
        this.currentSearch = '';
        this.sortOrder = SortOrder.DESC;
        this.init();
    }

    init() {
        this.createDOMStructure();
        this.loadFromStorage();
        this.bindEvents();
        this.renderTasks();
    }

    createDOMStructure() {
        const appContainer = document.createElement('div');
        appContainer.className = 'todo-app';
        document.body.appendChild(appContainer);

        this.createHeader(appContainer);
        this.createAddTaskForm(appContainer);
        this.createControlPanel(appContainer);
        
        this.tasksContainer = document.createElement('div');
        this.tasksContainer.className = 'tasks-container';
        appContainer.appendChild(this.tasksContainer);
    }

    createHeader(container) {
        const header = document.createElement('header');
        header.className = 'app-header';
        const title = document.createElement('h1');
        title.textContent = TextContent.TITLE;
        title.className = 'app-title';
        header.appendChild(title);
        container.appendChild(header);
    }

    createAddTaskForm(container) {
        const form = document.createElement('form');
        form.className = 'add-task-form';
        
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.placeholder = TextContent.PLACEHOLDER;
        textInput.className = 'task-text-input';
        textInput.required = true;
        
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.className = 'task-date-input';
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = TextContent.ADD_BUTTON;
        submitButton.className = 'add-task-button';
        
        form.appendChild(textInput);
        form.appendChild(dateInput);
        form.appendChild(submitButton);
        container.appendChild(form);
        
        this.addTaskForm = form;
        this.textInput = textInput;
        this.dateInput = dateInput;
    }

    createControlPanel(container) {
        const controls = document.createElement('div');
        controls.className = 'control-panel';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = TextContent.SEARCH_TASKS;
        searchInput.className = 'search-input';
        
        const filters = document.createElement('div');
        filters.className = 'task-filters';
        
        const allButton = this.createFilterButton(FilterState.ALL, TextContent.ALL_FILTER);
        const activeButton = this.createFilterButton(FilterState.ACTIVE, TextContent.ACTIVE_FILTER);
        const completedButton = this.createFilterButton(FilterState.COMPLETED, TextContent.COMPLETED_FILTER);
        
        filters.appendChild(allButton);
        filters.appendChild(activeButton);
        filters.appendChild(completedButton);
        
        const sortButton = document.createElement('button');
        sortButton.textContent = 'Сортировать по дате'; // вынести в конст
        sortButton.className = 'sort-button';
        
        controls.appendChild(searchInput);
        controls.appendChild(filters);
        controls.appendChild(sortButton);
        container.appendChild(controls);
        
        this.searchInput = searchInput;
        this.filters = filters;
    }

    createFilterButton(filterValue, text) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `filter-button ${this.currentFilter === filterValue ? 'active' : ''}`;
        button.dataset.filter = filterValue;
        
        button.addEventListener('click', () => {
            this.setFilter(filterValue);
        });
        
        return button;
    }

    setFilter(filter) {
        if (!Object.values(FilterState).includes(filter)) {
            console.error('Неизвестный фильтр:', filter);
            return;
        }
        
        this.currentFilter = filter;
        this.updateActiveFilterButtons();
        this.renderTasks();
    }

    updateActiveFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            const isActive = button.dataset.filter === this.currentFilter;
            button.classList.toggle('active', isActive);
        });
    }

    getFilteredTasks() {
        let filteredTasks = this.tasks;
        
        if (this.currentSearch) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(this.currentSearch)
            );
        }
        
        switch (this.currentFilter) {
            case FilterState.ACTIVE:
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case FilterState.COMPLETED:
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
        }
        
        return this.sortTasksByDateLogic(filteredTasks);
    }

    loadFromStorage() {
        try {
            const savedTasks = localStorage.getItem('todo-app-tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            this.tasks = [];
        }
    }

    bindEvents() {
        this.addTaskForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.addTask();
        });

        this.searchInput.addEventListener('input', (event) => {
            this.handleSearch(event.target.value);
        });

        const sortButton = document.querySelector('.sort-button');
        if (sortButton) {
            sortButton.addEventListener('click', () => {
                this.sortTasksByDate();
            });
        }
    }

    renderTasks() {
        while (this.tasksContainer.firstChild) {
            this.tasksContainer.removeChild(this.tasksContainer.firstChild);
        }
        
        const sortInfo = this.sortOrder === SortOrder.ASC ? 
            'Сортировка: по возрастанию даты' : 
            'Сортировка: по убыванию даты';
        this.tasksContainer.setAttribute('data-sort-info', sortInfo);
        
        const tasksToRender = this.getFilteredTasks();
        
        if (tasksToRender.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = this.getEmptyMessage();
            this.tasksContainer.appendChild(emptyMessage);
            return;
        }
        
        tasksToRender.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksContainer.appendChild(taskElement);
        });
    }

    getEmptyMessage() {
        if (this.currentSearch) {
            return 'Задачи по вашему запросу не найдены';
        }
        
        switch (this.currentFilter) {
            case FilterState.ACTIVE:
                return 'Нет активных задач';
            case FilterState.COMPLETED:
                return 'Нет выполненных задач';
            default:
                return 'Задач пока нет. Добавьте первую!';
        }
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.taskId = task.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.className = 'task-checkbox';
        checkbox.addEventListener('change', () => {
            this.toggleTaskCompletion(task.id);
        });
        
        const textSpan = document.createElement('span');
        textSpan.textContent = task.text;
        textSpan.className = 'task-text';
        
        const dateSpan = document.createElement('span');
        dateSpan.textContent = this.formatDate(task.date);
        dateSpan.className = 'task-date';
        
        const editButton = document.createElement('button');
        editButton.textContent = '✎';
        editButton.className = 'edit-button';
        editButton.addEventListener('click', () => {
            this.editTask(task.id);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => {
            this.deleteTask(task.id);
        });
        
        taskElement.appendChild(checkbox);
        taskElement.appendChild(textSpan);
        taskElement.appendChild(dateSpan);
        taskElement.appendChild(editButton);
        taskElement.appendChild(deleteButton);
        
        return taskElement;
    }

    formatDate(dateString) {
        if (!dateString) return 'Без даты';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            return 'Неверная дата';
        }
    }

    addTask() {
        const text = this.textInput.value.trim();
        const date = this.dateInput.value;
        
        if (!text) {
            alert('Введите текст задачи');
            return;
        }
        
        const newTask = {
            id: generateId(),
            text: text,
            date: date || new Date().toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            order: this.tasks.length
        };
        
        this.tasks.push(newTask);
        this.saveToStorage();
        
        this.textInput.value = '';
        this.dateInput.value = '';

        this.renderTasks();
    }

    saveToStorage() {
        try {
            localStorage.setItem('todo-app-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
        }
    }

    deleteTask(taskId) {
        if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
            return;
        }
        
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            
            this.saveToStorage();
            this.renderTasks();
        }
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            
            if (taskElement) {
                taskElement.classList.toggle('completed', task.completed);
                
                const checkbox = taskElement.querySelector('.task-checkbox');
                checkbox.checked = task.completed;
            }
            
            console.log('Статус задачи обновлен:', task);
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) return;

        this.createTaskEditView(taskElement, task);
    }

    createTaskEditView(taskElement, task) {
        while (taskElement.firstChild) {
            taskElement.removeChild(taskElement.firstChild);
        }

        taskElement.dataset.originalText = task.text;
        taskElement.dataset.originalDate = task.date;

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = task.text;
        textInput.className = 'task-edit-text';
        
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = task.date;
        dateInput.className = 'task-edit-date';
        
        const saveButton = document.createElement('button');
        saveButton.textContent = '✓';
        saveButton.className = 'save-button';
        saveButton.addEventListener('click', () => {
            this.saveTaskEdit(task.id, textInput.value, dateInput.value);
        });
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '×';
        cancelButton.className = 'cancel-button';
        cancelButton.addEventListener('click', () => {
            this.cancelTaskEdit(taskElement, task.id);
        });

        taskElement.appendChild(textInput);
        taskElement.appendChild(dateInput);
        taskElement.appendChild(saveButton);
        taskElement.appendChild(cancelButton);
        
        textInput.focus();
    }

    saveTaskEdit(taskId, newText, newDate) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) return;

        task.text = newText.trim();
        task.date = newDate;
        
        this.saveToStorage();
        this.renderTasks();
    }

    cancelTaskEdit(taskElement, taskId) {
        const originalText = taskElement.dataset.originalText;
        const originalDate = taskElement.dataset.originalDate;
        
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.text = originalText;
            task.date = originalDate;
        }
        
        this.renderTasks();
    }

    handleSearch(searchTerm) {
        this.currentSearch = searchTerm.toLowerCase().trim();
        this.renderTasks();
    }

    sortTasksByDate() {
        this.sortOrder = this.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    
        this.updateSortButtonText();
        this.renderTasks();
    }

    updateSortButtonText() {
        const sortButton = document.querySelector('.sort-button');
        if (sortButton) {
            const arrow = this.sortOrder === SortOrder.ASC ? '↑' : '↓';
            const orderText = this.sortOrder === SortOrder.ASC ? ' (старые сверху)' : ' (новые сверху)';
            sortButton.textContent = `Сортировать по дате ${arrow}`;
            
            sortButton.title = `Нажмите для сортировки по ${this.sortOrder === SortOrder.ASC ? 'убыванию' : 'возрастанию'}`;
        }
    }

    sortTasksByDateLogic(tasks) {
        return tasks.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (this.sortOrder === SortOrder.ASC) {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
    }

    resetSortOrder() {
        this.sortOrder = SortOrder.DESC;
        this.updateSortButtonText();
        this.renderTasks();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});