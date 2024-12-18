

document.addEventListener('DOMContentLoaded', () => {
    const createModal = document.getElementById('create-paper-modal');
    const openCreateModalButton = document.getElementById('open-create-paper');
    const closeCreateModalButton = createModal.querySelector('.close-button');
    const createForm = document.getElementById('create-paper-form');
    const papersContainer = document.getElementById('papers-container');

    const filterCategoryInput = document.getElementById('filter-category');
    const loadingIndicator = document.getElementById('loading-indicator'); 

    
    let papersCache = [];
    let isFetching = false; 

    
    const debounce = (func, delay) => {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        }
    };

    
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

    
    const showError = (message) => {
        alert(message); 
    };

    const openPDF = (url) => {
        console.log(url)
        window.open(url, '_blank');
    };
    

    
    const renderPapers = async (papers) => {
        
        papersContainer.innerHTML = '';
    
        
        for (const paper of papers) {
            const li = document.createElement('li');
            li.classList.add('paper-item');
            li.setAttribute('data-id', paper.id);
    
            try {
                const firstFile = paper.files.length > 0 ? paper.files[0] : null;
                const viewUrl = firstFile ? `/api/papers/view/${encodeURIComponent(paper.id)}/${encodeURIComponent(firstFile)}` : '#';

                li.innerHTML = `
                    <button class="star-button ${paper.starred ? '' : 'unstarred'}" title="${paper.starred ? '取消标星' : '标星'}">
                        <i class="fas fa-star"></i>
                    </button>
                    <div class="paper-details" style="cursor: ${firstFile ? 'pointer' : 'default'};">
                        <h3>${paper.title}</h3>
                        <p>分类：${paper.category.toLowerCase() || '未分类'}</p>
                    </div>
                    <button class="delete-button" title="删除论文"><i class="fas fa-trash"></i></button>
                `;
    
                if (firstFile) {
                    const paperDetails = li.querySelector('.paper-details');
                    paperDetails.addEventListener('click', () => {
                        openPDF(viewUrl);
                    });
                }
    
                papersContainer.appendChild(li);

                setTimeout(() => {
                    li.classList.add('fade-in');
                }, 10); 
            } catch (error) {
                console.error(`获取论文ID: ${paper.id} 的文件夹路径时出错:`, error);
                
                li.innerHTML = `
                    <button class="star-button ${paper.starred ? '' : 'unstarred'}" title="${paper.starred ? '取消标星' : '标星'}">
                        <i class="fas fa-star"></i>
                    </button>
                    <div style="cursor: default;">
                        <h3>${paper.title}</h3>
                        <p>分类：${paper.category || '未分类'}</p>
                        <p style="color: red;">无法获取文件夹路径</p>
                    </div>
                    <button class="delete-button" title="删除论文"><i class="fas fa-trash"></i></button>
                `;
                papersContainer.appendChild(li);
            }
        }
    };
    

    
    const updateCache = async () => {
        if (isFetching) return; 
        isFetching = true;
        loadingIndicator.style.display = 'block';

        try {
            const response = await fetch('/api/papers');
            const data = await response.json();
            if (data.status === 200) {
                papersCache = data.data;
                renderPapers(papersCache);
            } else {
                console.error('获取论文失败:', data);
                showError('无法获取论文列表。请稍后再试。');
            }
        } catch (error) {
            console.error('获取论文出错:', error);
            showError('获取论文时发生错误。请检查网络连接并重试。');
        } finally {
            isFetching = false;
            loadingIndicator.style.display = 'none';
        }
    };

    
    const refreshCache = async () => {
        await updateCache();
    };

    
    const filterAndRenderPapers = () => {
        const filter = filterCategoryInput.value.trim().toLowerCase();
        if (filter === '') {
            renderPapers(papersCache);
        } else {
            const filteredPapers = papersCache.filter(paper => 
                paper.category && paper.category.toLowerCase().includes(filter) || 
                paper.title && paper.title.toLowerCase().includes(filter)
            );
            renderPapers(filteredPapers);
        }
    };

    
    const createPaper = async (formData) => {
        try {
            const response = await fetch('/api/papers', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.status === 200) {
                await refreshCache();
                closeModal(createModal);
                createForm.reset();
            } else {
                console.error('创建论文失败:', data);
                showError('创建论文失败：' + (data.data.error || '未知错误'));
            }
        } catch (error) {
            console.error('创建论文出错:', error);
            showError('创建论文时发生错误。请检查网络连接并重试。');
        }
    };

    
    const deletePaper = async (paperId) => {
        if (confirm('确定要删除这篇论文吗？这将删除所有相关文件。')) {
            try {
                const response = await fetch(`/api/papers/${paperId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (data.status === 200) {
                    await refreshCache();
                } else {
                    console.error('删除论文失败:', data);
                    showError('删除论文失败：' + (data.data.error || '未知错误'));
                }
            } catch (error) {
                console.error('删除论文出错:', error);
                showError('删除论文时发生错误。请检查网络连接并重试。');
            }
        }
    };

    
    const toggleStarPaper = async (paperId, currentStarred) => {
        try {
            const response = await fetch(`/api/papers/${paperId}/star`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ starred: !currentStarred })
            });
            const data = await response.json();
            if (data.status === 200) {
                await refreshCache();
            } else {
                console.error('更新星标状态失败:', data);
                showError('更新星标状态失败：' + (data.data.error || '未知错误'));
            }
        } catch (error) {
            console.error('更新星标状态出错:', error);
            showError('更新星标状态时发生错误。请检查网络连接并重试。');
        }
    };

    
    createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(createForm);

        
        formData.delete('files');

        createPaper(formData);
    });

    
    papersContainer.addEventListener('click', (e) => {
        if (e.target.closest('.delete-button')) {
            const paperItem = e.target.closest('.paper-item');
            const paperId = paperItem.getAttribute('data-id');
            deletePaper(paperId);
        }

        if (e.target.closest('.star-button')) {
            const paperItem = e.target.closest('.paper-item');
            const paperId = paperItem.getAttribute('data-id');
            const isStarred = !paperItem.querySelector('.star-button').classList.contains('unstarred');
            toggleStarPaper(paperId, isStarred);
        }
    });

    
    filterCategoryInput.addEventListener('input', debounce(() => {
        filterAndRenderPapers();
    }, 300)); 

    
    updateCache();
});
