// static/js/view_project.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.animate__animated.animate__fadeIn');
    const projectName = container.getAttribute('data-project-name');

    // File Management Elements
    const fileList = document.getElementById('file-list');
    const uploadFileForm = document.getElementById('upload-file-form');
    const fileInput = document.getElementById('file-input');
    const fileCategoryInput = document.getElementById('file-category');
    const fileSearchInput = document.getElementById('file-search');

    // Task Management Elements
    const addTaskForm = document.getElementById('add-task-form');
    const taskCardsContainer = document.getElementById('task-cards');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const fileChoosen = document.getElementById('file-choosen');
    let currentTaskPage = 1;
    const tasksPerPage = 6;
    let totalTaskPages = 1;
    let allTasks = [];

    // Milestone Management Elements
    const milestoneList = document.getElementById('milestone-list');
    const addMilestoneForm = document.getElementById('add-milestone-form');
    const timelineContainer = document.getElementById('timeline');
    let timeline; // TimelineJS instance
    let allMilestones = [];

    // Back Button
    const backBtn = document.getElementById('back-btn');

    // Mapping between English and Chinese statuses
    const statusMapping = {
        'Pending': '待完成',
        'In Progress': '进行中',
        'Completed': '已完成'
    };

    const reverseStatusMapping = {
        '待完成': 'Pending',
        '进行中': 'In Progress',
        '已完成': 'Completed'
    };

    // File Management Functions
    function fetchProjectFiles() {
        fetch(`/api/projects/${encodeURIComponent(projectName)}/files`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    displayFiles(data.data);
                } else {
                    console.error('Error fetching project files:', data.data);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function displayFiles(files) {
        fileList.innerHTML = '';
        if (files.length === 0) {
            fileList.innerHTML = '<li>暂无文件</li>';
            return;
        }

        // Filter files based on search
        const searchQuery = fileSearchInput.value.toLowerCase();
        const filteredFiles = files.filter(file => file.toLowerCase().includes(searchQuery));

        if (filteredFiles.length === 0) {
            fileList.innerHTML = '<li>无匹配项</li>';
            return;
        }

        filteredFiles.forEach(file => {
            const listItem = document.createElement('li');

            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');

            const fileIcon = document.createElement('i');
            fileIcon.classList.add('fas', 'fa-file-alt');

            const fileLink = document.createElement('a');
            fileLink.href = `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(file)}`;
            fileLink.textContent = file;
            fileLink.target = '_blank'; // Open in new tab

            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileLink);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-file');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => deleteFile(file));

            listItem.appendChild(fileItem);
            listItem.appendChild(deleteBtn);

            fileList.appendChild(listItem);
        });
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; // 获取选择的文件
        if (file) {
            fileChoosen.textContent = `选择文件：${file.name}`;
            // 这里可以做更多的操作，比如显示文件名、文件预览等
        } else {
            console.log('没有选择文件');
        }
    });

    uploadFileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        const category = fileCategoryInput.value.trim() || 'Uncategorized';
        if (!file) {
            alert('请选择要上传的文件');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        fetch(`/api/projects/${encodeURIComponent(projectName)}/upload`, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    uploadFileForm.reset();
                    fetchProjectFiles();
                } else {
                    alert(data.data.error || '文件上传失败');
                }
            })
            .catch(error => console.error('Error:', error));
    });

    fileSearchInput.addEventListener('input', () => {
        fetchProjectFiles();
    });

    function deleteFile(fileName) {
        if (!confirm(`确定要删除文件 "${fileName}" 吗？`)) {
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(fileName)}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchProjectFiles();
                } else {
                    alert(data.data.error || '文件删除失败');
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Task Management Functions
    function fetchTasks() {
        fetch(`/api/projects/${encodeURIComponent(projectName)}/tasks`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    allTasks = data.data;
                    totalTaskPages = Math.ceil(allTasks.length / tasksPerPage) || 1;
                    currentTaskPage = 1;
                    displayTasks();
                } else {
                    console.error('Error fetching tasks:', data.data);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function displayTasks() {
        taskCardsContainer.innerHTML = '';

        const start = (currentTaskPage - 1) * tasksPerPage;
        const end = start + tasksPerPage;
        const tasksToDisplay = allTasks.slice(start, end);

        if (tasksToDisplay.length === 0) {
            taskCardsContainer.innerHTML = '<p>暂无任务</p>';
            return;
        }

        tasksToDisplay.forEach(task => {
            const card = document.createElement('div');
            card.classList.add('task-card', 'animate__animated', 'animate__fadeIn');

            // Task Title (Editable)
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = task.title;
            titleInput.classList.add('task-title');
            titleInput.addEventListener('change', () => updateTask(task.id, { title: titleInput.value }));

            // Task Description (Editable)
            const descriptionTextarea = document.createElement('textarea');
            descriptionTextarea.value = task.description;
            descriptionTextarea.classList.add('task-description');
            descriptionTextarea.addEventListener('change', () => updateTask(task.id, { description: descriptionTextarea.value }));

            // Task Status (Dropdown)
            const statusSelect = document.createElement('select');
            statusSelect.classList.add('task-status');

            // Create options with Chinese display
            ['Pending', 'In Progress', 'Completed'].forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = statusMapping[status];
                if (status === task.status) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            });

            statusSelect.addEventListener('change', () => updateTask(task.id, { status: statusSelect.value }));

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-task');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            // Assemble Card
            card.appendChild(titleInput);
            card.appendChild(descriptionTextarea);
            card.appendChild(statusSelect);
            card.appendChild(deleteBtn);

            taskCardsContainer.appendChild(card);
        });

        // Update Pagination
        currentPageSpan.textContent = `${currentTaskPage} / ${totalTaskPages}`;
        prevPageBtn.disabled = currentTaskPage === 1;
        nextPageBtn.disabled = currentTaskPage === totalTaskPages;
    }

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const status = document.getElementById('task-status').value;

        if (title === '') {
            alert('请输入任务标题');
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, status })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    addTaskForm.reset();
                    fetchTasks();
                } else {
                    alert(data.data.error || '任务创建失败');
                }
            })
            .catch(error => console.error('Error:', error));
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentTaskPage > 1) {
            currentTaskPage--;
            displayTasks();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentTaskPage < totalTaskPages) {
            currentTaskPage++;
            displayTasks();
        }
    });

    function updateTask(taskId, updates) {
        fetch(`/api/projects/${encodeURIComponent(projectName)}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchTasks();
                } else {
                    alert(data.data.error || '任务更新失败');
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function deleteTask(taskId) {
        if (!confirm('确定要删除此任务吗？')) {
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}/tasks/${taskId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchTasks();
                } else {
                    alert(data.data.error || '任务删除失败');
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Milestone Management Functions
    function fetchMilestones() {
        fetch(`/api/projects/${encodeURIComponent(projectName)}/milestones`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    allMilestones = data.data;
                    displayMilestones();
                    initializeTimeline();
                } else {
                    console.error('Error fetching milestones:', data.data);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function displayMilestones() {
        milestoneList.innerHTML = '';
        if (allMilestones.length === 0) {
            milestoneList.innerHTML = '<li>暂无日程</li>';
            return;
        }

        allMilestones.forEach(milestone => {
            const listItem = document.createElement('li');

            const milestoneItem = document.createElement('div');
            milestoneItem.classList.add('milestone-item');

            const title = document.createElement('span');
            title.classList.add('milestone-title');
            title.textContent = milestone.title;

            const date = document.createElement('span');
            date.classList.add('milestone-date');
            date.textContent = milestone.date;

            milestoneItem.appendChild(title);
            milestoneItem.appendChild(date);

            const actions = document.createElement('div');
            actions.classList.add('milestone-actions');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-milestone');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            editBtn.addEventListener('click', () => editMilestone(milestone));

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-milestone');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
            deleteBtn.addEventListener('click', () => deleteMilestone(milestone.id));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            listItem.appendChild(milestoneItem);
            listItem.appendChild(actions);

            milestoneList.appendChild(listItem);
        });
    }

    addMilestoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('milestone-title').value.trim();
        const description = document.getElementById('milestone-description').value.trim();
        const date = document.getElementById('milestone-date').value;

        if (title === '' || date === '') {
            alert('请输入日程标题和日期');
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}/milestones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, date })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    addMilestoneForm.reset();
                    fetchMilestones();
                } else {
                    alert(data.data.error || '日程创建失败');
                }
            })
            .catch(error => console.error('Error:', error));
    });

    function editMilestone(milestone) {
        const newTitle = prompt('编辑日程标题:', milestone.title);
        if (newTitle === null) return; // 取消操作

        const newDescription = prompt('编辑日程描述:', milestone.description);
        if (newDescription === null) return; // 取消操作

        const newDate = prompt('编辑日程日期 (YYYY-MM-DD):', milestone.date);
        if (newDate === null) return; // 取消操作

        if (!newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            alert('日期格式不正确，应为 YYYY-MM-DD');
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}/milestones/${milestone.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: newTitle, description: newDescription, date: newDate })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchMilestones();
                } else {
                    alert(data.data.error || '日程更新失败');
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function deleteMilestone(milestoneId) {
        if (!confirm('确定要删除此日程吗？')) {
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}/milestones/${milestoneId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchMilestones();
                } else {
                    alert(data.data.error || '日程删除失败');
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // TimelineJS Initialization
    function initializeTimeline() {
        // Prepare TimelineJS data
        const timelineData = {
            "title": {
                "text": {
                    "headline": "项目时间线",
                    "text": ""
                }
            },
            "events": allMilestones.map(milestone => ({
                "start_date": {
                    "year": milestone.date.split('-')[0],
                    "month": milestone.date.split('-')[1],
                    "day": milestone.date.split('-')[2]
                },
                "text": {
                    "headline": milestone.title,
                    "text": milestone.description || ""
                }
            }))
        };

        // Clear existing timeline if any
        if (timeline) {
            timeline.destroy(); // Destroy the existing timeline instance
        }

        // Initialize TimelineJS
        timeline = new TL.Timeline('timeline', timelineData, {
            width: '100%',
            height: '500px', // Adjust as needed
            initial_zoom: 1
        });
    }

    // Milestone Management Functions
    function fetchMilestones() {
        fetch(`/api/projects/${encodeURIComponent(projectName)}/milestones`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    allMilestones = data.data;
                    displayMilestones();
                    initializeTimeline();
                } else {
                    console.error('Error fetching milestones:', data.data);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    // Initialize Functions
    function initialize() {
        fetchProjectFiles();
        fetchTasks();
        fetchMilestones();
    }

    // Handle returning to project list
    backBtn.addEventListener('click', () => {
        window.location.href = '/projects';
    });

    // Initialize on load
    initialize();
});
