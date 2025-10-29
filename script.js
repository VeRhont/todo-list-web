
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



function generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}




class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = FilterState.ALL;
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
        switch (this.currentFilter) {
            case FilterState.ACTIVE:
                return this.tasks.filter(task => !task.completed);
            case FilterState.COMPLETED:
                return this.tasks.filter(task => task.completed);
            case FilterState.ALL:
            default:
                return this.tasks;
        }
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
        sortButton.addEventListener('click', () => {
            this.sortTasksByDate();
        });
    }

    renderTasks() {
        while (this.tasksContainer.firstChild) {
            this.tasksContainer.removeChild(this.tasksContainer.firstChild);
        }

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
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
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

    }

    handleSearch(searchTerm) {

    }

    sortTasksByDate() {

    }
}


document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});