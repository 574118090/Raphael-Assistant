
document.addEventListener('DOMContentLoaded', () => {
    let currentPath = '';
    let hoveredItem = null; 
    const notesContainer = document.getElementById('notes-container');
    const backButton = document.getElementById('back-button');
    const newFolderButton = document.getElementById('new-folder-button');
    const newNoteButton = document.getElementById('new-note-button');
    const currentPathDisplay = document.getElementById('current-path');
    const contextMenu = document.getElementById('context-menu');
    const deleteModal = document.getElementById('delete-modal');
    const deleteItemName = document.getElementById('delete-item-name');
    const confirmDeleteButton = document.getElementById('confirm-delete');
    const cancelDeleteButton = document.getElementById('cancel-delete');
    let selectedItem = null;
    let renameInProgress = false;
    let createInProgress = false;

        function getUniqueName(existingNames, baseName, extension = '') {
        let uniqueName = baseName;
        let counter = 1;
        while (existingNames.includes(uniqueName + extension)) {
            uniqueName = `${baseName}${counter}`;
            counter++;
        }
        return uniqueName + extension;
    }

    function fetchNotes(path = '') {
        fetch(`/api/notes/list?path=${encodeURIComponent(path)}`)
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    currentPath = data.current_path;
                    const parentPath = data.parent_path;

                                        if(currentPath) {
                        backButton.style.display = 'flex';
                        backButton.disabled = false;
                        backButton.onclick = () => {
                            fetchNotes(parentPath);
                        };
                    } else {
                        backButton.style.display = 'flex';
                        backButton.disabled = true;
                    }

                                        currentPathDisplay.textContent = `当前目录: /${currentPath}`;

                    notesContainer.innerHTML = ''; 
                    let existingNames = [];

                    if(data.data.length === 0) {
                        notesContainer.innerHTML = '<p>该目录为空。</p>';
                    } else {
                        data.data.forEach(item => {
                            existingNames.push(item.name);
                            const noteItem = document.createElement('div');
                            noteItem.classList.add('note-item');

                            let iconClass = '';
                            if(item.type === 'folder') {
                                iconClass = 'fas fa-folder';
                            } else if(item.type === 'file') {
                                iconClass = 'fas fa-file-alt';
                            }

                            noteItem.innerHTML = `
                                <i class="${iconClass}"></i>
                                <span>${item.name}</span>
                            `;

                                                        const span = noteItem.querySelector('span');

                                                        span.addEventListener('click', (e) => {
                                e.stopPropagation();                                 renameItem(item);
                            });

                                                        noteItem.addEventListener('click', () => {
                                if(item.type === 'folder') {
                                    fetchNotes(item.path);
                                } else if(item.type === 'file') {
                                                                        window.location.href = `/api/notes/view?path=${encodeURIComponent(item.path)}`;
                                }
                            });

                                                        noteItem.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                selectedItem = item;
                                showContextMenu(e.pageX, e.pageY);
                            });

                                                        noteItem.addEventListener('mouseenter', () => {
                                hoveredItem = item;
                            });

                            noteItem.addEventListener('mouseleave', () => {
                                hoveredItem = null;
                            });

                            notesContainer.appendChild(noteItem);
                        });
                    }

                                        notesContainer.dataset.existingNames = JSON.stringify(existingNames);
                } else {
                    console.error('Failed to load notes:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching notes:', error);
            });
    }

    function renameItem(item) {
        if (renameInProgress || createInProgress) return;         renameInProgress = true;

        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach(elem => {
            const span = elem.querySelector('span');
            if(span.textContent === item.name) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = item.name;
                input.classList.add('rename-input');
                span.replaceWith(input);
                input.focus();

                                input.addEventListener('blur', () => {
                    const newName = input.value.trim();
                    if(newName && newName !== item.name) {
                        renameRequest(item, newName);
                    } else {
                                                input.replaceWith(span);
                        renameInProgress = false;
                    }
                });

                input.addEventListener('keypress', (e) => {
                    if(e.key === 'Enter') {
                        input.blur();
                    }
                    if(e.key === 'Escape') {
                        input.replaceWith(span);
                        renameInProgress = false;
                    }
                });

                                input.addEventListener('keydown', (e) => {
                    if(e.key === 'Escape') {
                        input.replaceWith(span);
                        renameInProgress = false;
                    }
                });
            }
        });
    }

    function renameRequest(item, newName) {
        const data = {
            path: currentPath,
            old_name: item.name,
            new_name: newName
        };

        fetch('/api/notes/rename', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                renameInProgress = false;
                if(data.status === 'success') {
                    fetchNotes(currentPath);
                } else {
                    alert('重命名失败：' + data.message);
                    fetchNotes(currentPath);                 }
            })
            .catch(error => {
                console.error('Error renaming item:', error);
                alert('重命名失败。');
                renameInProgress = false;
            });
    }

    function showContextMenu(x, y) {
        contextMenu.style.top = `${y}px`;
        contextMenu.style.left = `${x}px`;
        contextMenu.style.display = 'block';
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
        selectedItem = null;
    }

        document.addEventListener('click', (e) => {
        if(!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

        const contextRename = document.getElementById('context-rename');
    const contextDelete = document.getElementById('context-delete');

    contextRename.addEventListener('click', () => {
        if(selectedItem) {
            renameItem(selectedItem);
            hideContextMenu();
        }
    });

    contextDelete.addEventListener('click', () => {
        if(selectedItem) {
            openDeleteModal(selectedItem);
            hideContextMenu();
        }
    });

    function openDeleteModal(item) {
        deleteItemName.textContent = item.name;
        deleteModal.style.display = 'block';

                deleteModal.querySelector('.modal-content').classList.add('animate__animated', 'animate__zoomIn');

        confirmDeleteButton.onclick = () => {
            deleteRequest(item);
            closeDeleteModal();
        };

        cancelDeleteButton.onclick = () => {
            closeDeleteModal();
        };
    }

    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        deleteModal.querySelector('.modal-content').classList.remove('animate__animated', 'animate__zoomIn');
        selectedItem = null;
    }

    function deleteRequest(item) {
        const data = {
            path: currentPath,
            name: item.name
        };

        fetch('/api/notes/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    fetchNotes(currentPath);
                } else {
                    alert('删除失败：' + data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting item:', error);
                alert('删除失败。');
            });
    }

        newFolderButton.addEventListener('click', () => {
        if (renameInProgress || createInProgress) return;         createInProgress = true;

                const existingNames = JSON.parse(notesContainer.dataset.existingNames || '[]').filter(name => !name.endsWith('.md'));

                const baseName = '新文件夹';
        const uniqueName = getUniqueName(existingNames, baseName);

        const data = {
            path: currentPath,
            folder_name: uniqueName
        };

        fetch('/api/notes/create_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    fetchNotes(currentPath);
                                        setTimeout(() => {
                        const noteItems = document.querySelectorAll('.note-item');
                        noteItems.forEach(elem => {
                            const span = elem.querySelector('span');
                            if(span.textContent === uniqueName) {
                                const input = document.createElement('input');
                                input.type = 'text';
                                input.value = uniqueName;
                                input.classList.add('rename-input');
                                span.replaceWith(input);
                                input.focus();

                                                                input.addEventListener('blur', () => {
                                    const newName = input.value.trim();
                                    if(newName && newName !== uniqueName) {
                                        renameRequest({type: 'folder', name: uniqueName}, newName);
                                    } else {
                                                                                input.replaceWith(span);
                                        createInProgress = false;
                                    }
                                });

                                input.addEventListener('keypress', (e) => {
                                    if(e.key === 'Enter') {
                                        input.blur();
                                    }
                                    if(e.key === 'Escape') {
                                                                                cancelCreateFolder(uniqueName, currentPath);
                                    }
                                });

                                                                input.addEventListener('keydown', (e) => {
                                    if(e.key === 'Escape') {
                                        cancelCreateFolder(uniqueName, currentPath);
                                    }
                                });
                            }
                        });
                    }, 300);                 } else {
                    alert('创建文件夹失败：' + data.message);
                    createInProgress = false;
                }
            })
            .catch(error => {
                console.error('Error creating folder:', error);
                alert('创建文件夹失败。');
                createInProgress = false;
            });
    });

    function cancelCreateFolder(uniqueName, path) {
        const data = {
            path: path,
            name: uniqueName
        };

        fetch('/api/notes/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: path,
                name: uniqueName
            })
        })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    fetchNotes(path);
                } else {
                    alert('取消创建失败：' + data.message);
                }
                createInProgress = false;
            })
            .catch(error => {
                console.error('Error cancelling folder creation:', error);
                alert('取消创建失败。');
                createInProgress = false;
            });
    }

        newNoteButton.addEventListener('click', () => {
        if (renameInProgress || createInProgress) return;         createInProgress = true;

                const existingNames = JSON.parse(notesContainer.dataset.existingNames || '[]').filter(name => name.endsWith('.md'));

                const baseName = '新笔记';
        const extension = '.md';
        const uniqueName = getUniqueName(existingNames, baseName, extension);

        const data = {
            path: currentPath,
            file_name: uniqueName
        };

        fetch('/api/notes/create_file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    fetchNotes(currentPath);
                                        setTimeout(() => {
                        const noteItems = document.querySelectorAll('.note-item');
                        noteItems.forEach(elem => {
                            const span = elem.querySelector('span');
                            if(span.textContent === uniqueName) {
                                const input = document.createElement('input');
                                input.type = 'text';
                                input.value = uniqueName;
                                input.classList.add('rename-input');
                                span.replaceWith(input);
                                input.focus();

                                                                input.addEventListener('blur', () => {
                                    const newName = input.value.trim();
                                    if(newName && newName !== uniqueName) {
                                        renameRequest({type: 'file', name: uniqueName}, newName);
                                    } else {
                                                                                input.replaceWith(span);
                                        createInProgress = false;
                                    }
                                });

                                input.addEventListener('keypress', (e) => {
                                    if(e.key === 'Enter') {
                                        input.blur();
                                    }
                                    if(e.key === 'Escape') {
                                                                                cancelCreateFile(uniqueName, currentPath);
                                    }
                                });

                                                                input.addEventListener('keydown', (e) => {
                                    if(e.key === 'Escape') {
                                        cancelCreateFile(uniqueName, currentPath);
                                    }
                                });
                            }
                        });
                    }, 300);                 } else {
                    alert('创建笔记失败：' + data.message);
                    createInProgress = false;
                }
            })
            .catch(error => {
                console.error('Error creating note:', error);
                alert('创建笔记失败。');
                createInProgress = false;
            });
    });

    function cancelCreateFile(uniqueName, path) {
        const data = {
            path: path,
            name: uniqueName
        };

        fetch('/api/notes/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: path,
                name: uniqueName
            })
        })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    fetchNotes(path);
                } else {
                    alert('取消创建失败：' + data.message);
                }
                createInProgress = false;
            })
            .catch(error => {
                console.error('Error cancelling file creation:', error);
                alert('取消创建失败。');
                createInProgress = false;
            });
    }

        window.onclick = function(event) {
        if (event.target == deleteModal) {
            closeDeleteModal();
        }
    }

    function handleBlockKeydown(e) {
        if (!hoveredItem) return;

        if (e.key === 'F2') {
            e.preventDefault();
            renameItem(hoveredItem);
        }

        if (e.key === 'Delete') {
            e.preventDefault();
            openDeleteModal(hoveredItem);
        }
    }

        deleteModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmDeleteButton.click();
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            closeDeleteModal();
        }
    });

        document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('rename-input')) {
            if (e.key === 'Escape') {
                activeElement.blur();
            }
        }
    });

        document.addEventListener('keydown', (e) => {
        if (deleteModal.style.display === 'block') {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmDeleteButton.click();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDeleteModal();
            }
        }
    });

        fetchNotes();
});
