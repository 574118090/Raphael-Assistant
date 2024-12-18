
document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-button');
    const currentPathDisplay = document.getElementById('current-path');
        const editorElement = document.getElementById('editor');     const viewerElement = document.getElementById('viewer');     const saveModal = document.getElementById('save-modal');
    const confirmSaveButton = document.getElementById('confirm-save');
    const discardSaveButton = document.getElementById('discard-save');
    const cancelSaveButton = document.getElementById('cancel-save');
    const closeModalButton = document.querySelector('.close-button');
    const viewerContent = document.getElementsByClassName('toastui-editor-contents')
    const { chart, codeSyntaxHighlight, colorSyntax, tableMergedCell, uml } = toastui.Editor.plugin;
        const exportPdfButton = document.getElementById('export-pdf');
    const exportMdButton = document.getElementById('export-md');

    let originalContent = '';
    let notePath = '';
    let isModified = false;
    let isEditing = false;

        function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    notePath = getQueryParam('path') || '';
    currentPathDisplay.textContent = `当前笔记: /${notePath}`;

    const chartOptions = {
        minWidth: 100,
        maxWidth: 600,
        minHeight: 100,
        maxHeight: 300
    };

    function latexPlugin() {
        const toHTMLRenderers = {
            latex(node) {
                                const html = katex.renderToString(node.literal, {
                    throwOnError: false,                     displayMode: node.literal.startsWith('$$')                 });

                                return [
                    { type: 'openTag', tagName: 'div', outerNewLine: true },
                    { type: 'html', content: html },
                    { type: 'closeTag', tagName: 'div', outerNewLine: true }
                ];
            },
        }

        return { toHTMLRenderers }
    }

        const editorInstance = new toastui.Editor({
        el: editorElement,
        initialEditType: 'markdown',
        previewStyle: 'tab',         height: '100%',         previewHighlight: false,
        toolbarItems: [],
        initialValue: '加载中...',
        hideModeSwitch: true,
        viewer: false,
        plugins: [
            [chart, chartOptions],
            [codeSyntaxHighlight, { highlighter: Prism }],
            tableMergedCell,
            latexPlugin
        ]
    });

        const viewerInstance = new toastui.Editor.factory({
        el: viewerElement,
        viewer: true,
        height: '500px',
        initialValue: '加载中...',
        plugins: [
            [chart, chartOptions],
            [codeSyntaxHighlight, { highlighter: Prism }],
            tableMergedCell,
            latexPlugin
        ]
    });

        function loadNote() {
        fetch(`/api/notes/get_content?path=${encodeURIComponent(notePath)}`)
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    originalContent = data.content;
                    editorInstance.setMarkdown(originalContent);
                    viewerInstance.setMarkdown(originalContent);
                } else {
                    alert('加载笔记失败：' + data.message);
                    editorInstance.setMarkdown('# 加载失败');
                    viewerInstance.setMarkdown('# 加载失败');
                }
            })
            .catch(error => {
                console.error('Error loading note:', error);
                alert('加载笔记失败。');
                editorInstance.setMarkdown('# 加载失败');
                viewerInstance.setMarkdown('# 加载失败');
            });
    }

    loadNote();

        editorInstance.on('change', () => {
        const currentContent = editorInstance.getMarkdown();
        viewerInstance.setMarkdown(currentContent);
        isModified = (currentContent !== originalContent);
        if(isModified) {
            saveButton.style.display = 'inline-flex';
        } else {
            saveButton.style.display = 'none';
        }
    });

        saveButton.addEventListener('click', () => {
        saveNote();
    });

    function saveNote() {
        const updatedContent = editorInstance.getMarkdown().trim();
        if(updatedContent === originalContent) {
                        exitEditMode();
            return;
        }

        const data = {
            path: notePath,
            content: updatedContent
        };

        fetch('/api/notes/save_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    originalContent = updatedContent;
                    isModified = false;
                    saveButton.style.display = 'none';
                } else {
                    alert('保存失败：' + data.message);
                }
            })
            .catch(error => {
                console.error('Error saving note:', error);
                alert('保存失败。');
            });
    }

        backButton.addEventListener('click', () => {
        if(isModified) {
            openSaveModal();
        } else {
            window.history.back();
        }
    });

        function openSaveModal() {
        saveModal.style.display = 'block';
    }

        function closeSaveModal() {
        saveModal.style.display = 'none';
    }

        confirmSaveButton.addEventListener('click', () => {
        saveNote();
        closeSaveModal();
        window.history.back();
    });

        discardSaveButton.addEventListener('click', () => {
        closeSaveModal();
        window.history.back();
    });

        cancelSaveButton.addEventListener('click', () => {
        closeSaveModal();
    });

        window.onclick = function(event) {
        if (event.target == saveModal) {
            closeSaveModal();
        }
    }

        closeModalButton.addEventListener('click', () => {
        closeSaveModal();
    });

        document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if(isModified) {
                openSaveModal();
            } else {
                window.history.back();
            }
        }
    });

        window.addEventListener('beforeunload', (e) => {
        if (isModified) {
                        e.preventDefault();
            e.returnValue = '';
                        return '';
        }
            });

    exportPdfButton.addEventListener('click', () => {
        exportPDF();
    });

    exportMdButton.addEventListener('click', () => {
        exportMarkdown();
    });


    function exportPDF() {
                const element = viewerElement;
        const opt = {
            margin:       0,
            filename:     `${notePath.replace(/\.[^/.]+$/, "")}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 4 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }

    function exportMarkdown() {
        const markdownContent = editorInstance.getMarkdown();
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${notePath.replace(/\.[^/.]+$/, "")}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
