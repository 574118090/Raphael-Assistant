
document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById('create-idea-form');
    const titleInput = document.getElementById('idea-title');
    const descriptionInput = document.getElementById('idea-description');
    const ideasContainer = document.getElementById('ideas-container');

    const createModal = document.getElementById('create-idea-modal');
    const openCreateModalButton = document.getElementById('open-create-idea');
    const closeCreateModalButton = createModal.querySelector('.close-button');

        const openModal = (modal) => {
        modal.style.display = 'block';
    };

        const closeModal = (modal) => {
        modal.style.display = 'none';
    };

        openCreateModalButton.addEventListener('click', () => {
        openModal(createModal);
    });

        closeCreateModalButton.addEventListener('click', () => {
        closeModal(createModal);
    });

        window.addEventListener('click', (event) => {
        if (event.target == createModal) {
            closeModal(createModal);
        }
    });

        const fetchIdeas = () => {
        fetch('/api/ideas')
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    ideasContainer.innerHTML = '';
                    data.data.forEach(idea => {
                        const li = document.createElement('li');
                        li.classList.add('idea-item');
                        li.setAttribute('data-id', idea.id);
                        li.innerHTML = `
                            <div class="idea-info">
                                <h3>${idea.title}</h3>
                                <p>${idea.description}</p>
                            </div>
                            <button class="delete-button" data-id="${idea.id}"><i class="fas fa-trash"></i></button>
                        `;
                        ideasContainer.appendChild(li);
                    });
                } else {
                    console.error('获取想法失败:', data);
                }
            })
            .catch(error => {
                console.error('获取想法出错:', error);
            });
    };

        const createIdea = (title, description) => {
        fetch('/api/ideas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchIdeas();
                    closeModal(createModal);
                    createForm.reset();
                } else {
                    alert(data.data.error || '添加想法失败。');
                }
            })
            .catch(error => {
                console.error('创建想法出错:', error);
            });
    };

        const deleteIdea = (id) => {
        fetch(`/api/ideas/${id}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchIdeas();
                } else {
                    alert(data.data.error || '删除想法失败。');
                }
            })
            .catch(error => {
                console.error('删除想法出错:', error);
            });
    };

        createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        if (title && description) {
            createIdea(title, description);
        } else {
            alert('标题和描述均为必填项。');
        }
    });

        ideasContainer.addEventListener('click', (e) => {
        if (e.target.closest('.delete-button')) {
            e.stopPropagation();             const id = e.target.closest('.delete-button').dataset.id;
            if (confirm('确定要删除这个想法吗？')) {
                deleteIdea(id);
            }
        }
    });

        ideasContainer.addEventListener('click', (e) => {
        const ideaItem = e.target.closest('.idea-item');
        if (ideaItem && !e.target.closest('.delete-button')) {
            const id = ideaItem.dataset.id;
            window.location.href = `/ideas/${id}`;
        }
    });

        fetchIdeas();
});
