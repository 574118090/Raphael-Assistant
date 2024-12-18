// static/js/projects.js

document.addEventListener('DOMContentLoaded', () => {
    const projectList = document.querySelector('.project-list');
    const openCreateProjectBtn = document.getElementById('open-create-project-btn');
    const createModal = document.getElementById('create-project-modal');
    const editModal = document.getElementById('edit-project-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const createProjectForm = document.getElementById('create-project-form');
    const editProjectForm = document.getElementById('edit-project-form');
    const searchInput = document.getElementById('search-projects');

    // Utility function to generate a consistent random color based on a string
    function getRandomColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return "#" + "00000".substring(0, 6 - c.length) + c;
    }

    // 打开创建项目弹出窗口
    openCreateProjectBtn.addEventListener('click', () => {
        createModal.style.display = 'block';
    });

    // 打开编辑项目弹出窗口
    function openEditModal(project) {
        editModal.style.display = 'block';
        document.getElementById('edit-project-original-name').value = project.name;
        document.getElementById('edit-project-name').value = project.name;
        document.getElementById('edit-project-description').value = project.description || '';
        document.getElementById('edit-project-client').value = project.client;
        document.getElementById('edit-project-type').value = project.type;
    }

    // 关闭弹出窗口
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            createModal.style.display = 'none';
            editModal.style.display = 'none';
        });
    });

    // 点击窗口外部关闭弹出窗口
    window.addEventListener('click', (event) => {
        if (event.target == createModal) {
            createModal.style.display = 'none';
        }
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    });

    // 加载项目列表，支持过滤
    function loadProjects(filter = '') {
        fetch('/api/projects/')
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    displayProjects(data.data, filter);
                } else {
                    console.error('获取项目列表时出错:', data.data);
                }
            })
            .catch(error => console.error('错误:', error));
    }

    // 显示项目卡牌
    function displayProjects(projects, filter) {
        projectList.innerHTML = '';
        projects.forEach(project => {
            // 过滤项目
            if (filter) {
                const filterLower = filter.toLowerCase();
                const matches = (
                    project.name.toLowerCase().includes(filterLower) ||
                    (project.description && project.description.toLowerCase().includes(filterLower)) ||
                    project.client.toLowerCase().includes(filterLower) ||
                    project.type.toLowerCase().includes(filterLower)
                );
                if (!matches) {
                    return;
                }
            }

            const card = document.createElement('div');
            card.classList.add('project-card', 'animate__animated', 'animate__fadeInUp');

            // Assign a random color based on project name as top-border
            const color = getRandomColor(project.name);
            card.style.borderTop = `5px solid ${color}`;

            // 点击项目卡牌跳转到项目详情页
            card.addEventListener('click', (e) => {
                // 如果点击的是编辑或删除按钮，则不跳转
                if (e.target.closest('.edit-project') || e.target.closest('.delete-project')) {
                    return;
                }
                window.location.href = `/projects/${encodeURIComponent(project.name)}`;
            });

            // 创建一个容器来放置编辑和删除按钮
            const actionButtons = document.createElement('div');
            actionButtons.classList.add('action-buttons');

            // 编辑按钮
            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-project');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止卡牌点击事件
                openEditModal(project);
            });

            // 删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-project');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止卡牌点击事件
                deleteProject(project.name);
            });

            actionButtons.appendChild(editBtn);
            actionButtons.appendChild(deleteBtn);

            const title = document.createElement('h3');
            title.textContent = project.name;

            const description = document.createElement('p');
            description.textContent = project.description || '暂无简介';

            const client = document.createElement('p');
            client.classList.add('client');
            client.textContent = `甲方: ${project.client}`;

            const type = document.createElement('p');
            type.classList.add('type');
            type.textContent = `类型: ${project.type}`;

            card.appendChild(actionButtons);
            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(client);
            card.appendChild(type);

            projectList.appendChild(card);
        });
    }

    // 创建新项目
    createProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const projectName = document.getElementById('project-name').value.trim();
        const projectDescription = document.getElementById('project-description').value.trim();
        const projectClient = document.getElementById('project-client').value.trim();
        const projectType = document.getElementById('project-type').value.trim();

        if (projectName === '' || projectClient === '' || projectType === '') {
            alert('请输入所有必填字段');
            return;
        }

        fetch('/api/projects/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: projectName,
                description: projectDescription,
                client: projectClient,
                type: projectType
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    createModal.style.display = 'none';
                    createProjectForm.reset();
                    loadProjects(searchInput.value.trim());
                } else {
                    alert(data.data.error || '创建项目失败');
                }
            })
            .catch(error => console.error('错误:', error));
    });

    // 编辑项目
    editProjectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const originalName = document.getElementById('edit-project-original-name').value.trim();
        const projectName = document.getElementById('edit-project-name').value.trim();
        const projectDescription = document.getElementById('edit-project-description').value.trim();
        const projectClient = document.getElementById('edit-project-client').value.trim();
        const projectType = document.getElementById('edit-project-type').value.trim();

        if (projectName === '' || projectClient === '' || projectType === '') {
            alert('请输入所有必填字段');
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(originalName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: projectName,
                description: projectDescription,
                client: projectClient,
                type: projectType
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    editModal.style.display = 'none';
                    editProjectForm.reset();
                    loadProjects(searchInput.value.trim());
                } else {
                    alert(data.data.error || '编辑项目失败');
                }
            })
            .catch(error => console.error('错误:', error));
    });

    // 删除项目
    function deleteProject(projectName) {
        if (!confirm(`确定要删除项目 "${projectName}" 吗？`)) {
            return;
        }

        fetch(`/api/projects/${encodeURIComponent(projectName)}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    loadProjects(searchInput.value.trim());
                } else {
                    alert(data.data.error || '删除项目失败');
                }
            })
            .catch(error => console.error('错误:', error));
    }

    // 搜索项目
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.trim();
        loadProjects(filter);
    });

    // 初始化加载
    loadProjects();
});
