
document.addEventListener('DOMContentLoaded', () => {
    const ideaId = window.location.pathname.split('/').pop(); 
    const editForm = document.getElementById('edit-idea-form');
    const relatedPapersContainer = document.getElementById('related-papers-container');
    const addRelatedPaperForm = document.getElementById('add-related-paper-form');

        const fetchIdeaDetail = () => {
        fetch(`/api/ideas/${ideaId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    const idea = data.data;
                                        document.getElementById('edit-title').value = idea.title;
                    document.getElementById('edit-description').value = idea.description;
                    document.getElementById('edit-background').value = idea.background || '';
                    document.getElementById('edit-motivation').value = idea.motivation || '';
                    document.getElementById('edit-challenge').value = idea.challenge || '';
                    document.getElementById('edit-method').value = idea.method || '';
                    document.getElementById('edit-experiment').value = idea.experiment || '';
                    document.getElementById('edit-innovation').value = idea.innovation || '';
                                        
                    const colors = [
                        '#FF5733',                          '#33FF57',                          '#3357FF',                          '#FF33A1',                          '#FFD700',                          '#9B59B6',                          '#1F77B4',                          '#E74C3C',                          '#2ECC71',                          '#F39C12'                       ];
                
                                        function getColorByTitle(title) {
                                                let hash = 0;
                        for (let i = 0; i < title.length; i++) {
                            hash = (hash << 5) - hash + title.charCodeAt(i);
                            hash = hash & hash;                         }
                
                                                const index = Math.abs(hash) % colors.length;
                        return colors[index];
                    }

                                        relatedPapersContainer.innerHTML = '';
                    idea.related_papers.forEach(paper => {
                        const li = document.createElement('li');

                        let link = paper.link;

                        if (!link.startsWith('http://') && !link.startsWith('https://')) {
                            link = 'https://' + link;
                        }
                        
                        li.innerHTML = `
                            <div class="related-paper-div">
                                <strong>${paper.title}</strong>
                                <p>${paper.content || ''}</p>
                                <a href='${link}' target="_blank" class="back-button" style="margin-bottom:0px">查看</a>
                                <button class="delete-related-paper" data-paper-id="${paper.id}"><i class="fas fa-trash"></i></button>
                            </div>
                        `;
                        const color = getColorByTitle(paper.title);
                        li.style.borderLeft = `15px solid ${color}`;

                        relatedPapersContainer.appendChild(li);
                    });
                } else {
                    console.error('获取想法详情失败:', data);
                    alert('获取想法详情失败。');
                }
            })
            .catch(error => {
                console.error('获取想法详情出错:', error);
                alert('获取想法详情出错。');
            });
    };

        const updateIdeaDetail = (details) => {
        fetch(`/api/ideas/${ideaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(details)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    alert('想法更新成功。');
                } else {
                    alert(data.data.error || '更新想法失败。');
                }
            })
            .catch(error => {
                console.error('更新想法出错:', error);
                alert('更新想法出错。');
            });
    };

        const addRelatedPaper = (paperData) => {
        fetch(`/api/ideas/${ideaId}/related_papers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paperData)
        })
            .then(response => response.json())
            .then(data => {
                fetchIdeaDetail();
                addRelatedPaperForm.reset();
            })
            .catch(error => {
                console.error('添加关联论文出错:', error);
                alert('添加关联论文出错。');
            });
    };

        const deleteRelatedPaper = (paperId) => {
        fetch(`/api/ideas/${ideaId}/related_papers/${paperId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    fetchIdeaDetail();
                } else {
                    alert(data.data.error || '删除关联论文失败。');
                }
            })
            .catch(error => {
                console.error('删除关联论文出错:', error);
                alert('删除关联论文出错。');
            });
    };

        editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const details = {
            title: document.getElementById('edit-title').value.trim(),
            description: document.getElementById('edit-description').value.trim(),
            background: document.getElementById('edit-background').value.trim(),
            motivation: document.getElementById('edit-motivation').value.trim(),
            challenge: document.getElementById('edit-challenge').value.trim(),
            method: document.getElementById('edit-method').value.trim(),
            experiment: document.getElementById('edit-experiment').value.trim(),
            innovation: document.getElementById('edit-innovation').value.trim(),
                    };
        if (details.title && details.description) {
            updateIdeaDetail(details);
        } else {
            alert('标题和描述均为必填项。');
        }
    });

        addRelatedPaperForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const paperData = {
            title: addRelatedPaperForm.querySelector('input[name="title"]').value.trim(),
            content: addRelatedPaperForm.querySelector('input[name="content"]').value.trim(),
            link: addRelatedPaperForm.querySelector('input[name="link"]').value.trim(),
        };
        if (paperData.title) {
            addRelatedPaper(paperData);
        } else {
            alert('关联论文标题为必填项。');
        }
    });

        relatedPapersContainer.addEventListener('click', (e) => {
        if (e.target.closest('.delete-related-paper')) {
            const paperId = e.target.closest('.delete-related-paper').dataset.paperId;
            if (confirm('确定要删除这个关联论文吗？')) {
                deleteRelatedPaper(paperId);
            }
        }
    });

        fetchIdeaDetail();
});
