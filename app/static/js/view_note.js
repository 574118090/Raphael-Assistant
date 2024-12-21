document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button');
    const saveButton = document.getElementById('save-button');
    const currentPathDisplay = document.getElementById('current-path');
    const editorElement = document.getElementById('editor');
    const viewerElement = document.getElementById('viewer');
    const saveModal = document.getElementById('save-modal');
    const confirmSaveButton = document.getElementById('confirm-save');
    const discardSaveButton = document.getElementById('discard-save');
    const cancelSaveButton = document.getElementById('cancel-save');
    const closeModalButton = document.querySelector('.close-button');
    const exportPdfButton = document.getElementById('export-pdf');
    const exportMdButton = document.getElementById('export-md');
    const exportTxtButton = document.getElementById('export-txt');

    // 初始化 markdown-it
    const md = window.markdownit({
        html: true,             // 允许渲染 HTML 标签
        linkify: true,          // 自动将 URL 转换为链接
        typographer: true,      // 启用一些语言增强
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs"><code>' +
                           hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                           '</code></pre>';
                } catch (__) {}
            }

            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    });

    // 添加 markdown-it 的 MathJax 插件
    // 这里我们手动处理 $...$ 和 $$...$$ 语法
    const defaultRender = md.renderer.rules.text || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.text = function (tokens, idx, options, env, self) {
        let text = tokens[idx].content;
        
        // 处理行内数学公式 $...$
        text = text.replace(/\$(.+?)\$/g, function(match, p1) {
            return '\\(' + p1 + '\\)';
        });

        // 处理块级数学公式 $$...$$
        text = text.replace(/\$\$(.+?)\$\$/g, function(match, p1) {
            return '\\[' + p1 + '\\]';
        });

        return defaultRender(tokens, idx, options, env, self);
    };

    // 快捷键 Ctrl+G 保存并渲染
    document.addEventListener('keydown', (e) => {
        if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            renderMarkdown();
            saveNote();
        }
    });

    let originalContent = '';
    let notePath = '';
    let isModified = false;

    // 获取URL参数
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    notePath = getQueryParam('path') || '';
    currentPathDisplay.textContent = `当前笔记: /${notePath}`;

    // 加载笔记内容
    function loadNote() {
        fetch(`/api/notes/get_content?path=${encodeURIComponent(notePath)}`)
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    originalContent = data.content;
                    editorElement.value = originalContent;
                    renderMarkdown();
                } else {
                    alert('加载笔记失败：' + data.message);
                    editorElement.value = '加载失败';
                    viewerElement.textContent = '加载失败';
                }
            })
            .catch(error => {
                console.error('Error loading note:', error);
                alert('加载笔记失败。');
                editorElement.value = '加载失败';
                viewerElement.textContent = '加载失败';
            });
    }

    loadNote();

    // 渲染Markdown
    function renderMarkdown() {
        const markdownText = editorElement.value;
        const htmlContent = md.render(markdownText);
        viewerElement.innerHTML = htmlContent;
        
        // MathJax 渲染数学公式
        if (window.MathJax) {
            MathJax.typesetPromise([viewerElement]).catch(function (err) {
                console.error('MathJax typeset failed: ' + err.message);
            });
        }
    }

    // 监听编辑器内容变化
    editorElement.addEventListener('input', () => {
        const currentContent = editorElement.value;
        isModified = (currentContent !== originalContent);
        if(isModified) {
            saveButton.style.display = 'inline-flex';
        } else {
            saveButton.style.display = 'none';
        }
        renderMarkdown();
    });

    // 保存按钮点击事件
    saveButton.addEventListener('click', () => {
        renderMarkdown();
        saveNote();
    });

    // 保存笔记内容
    function saveNote() {
        const updatedContent = editorElement.value.trim();
        if(updatedContent === originalContent) {
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

    // 返回按钮点击事件
    backButton.addEventListener('click', () => {
        if(isModified) {
            openSaveModal();
        } else {
            window.history.back();
        }
    });

    // 打开保存模态窗口
    function openSaveModal() {
        saveModal.style.display = 'block';
    }

    // 关闭保存模态窗口
    function closeSaveModal() {
        saveModal.style.display = 'none';
    }

    // 模态窗口按钮事件
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

    // 点击模态窗口外部关闭
    window.onclick = function(event) {
        if (event.target == saveModal) {
            closeSaveModal();
        }
    }

    // 关闭按钮点击事件
    closeModalButton.addEventListener('click', () => {
        closeSaveModal();
    });

    // Escape键事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if(isModified) {
                openSaveModal();
            } else {
                window.history.back();
            }
        }
    });

    // 防止未保存直接关闭
    window.addEventListener('beforeunload', (e) => {
        if (isModified) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    // 导出按钮事件
    exportPdfButton.addEventListener('click', () => {
        exportPDF();
    });

    exportMdButton.addEventListener('click', () => {
        exportMarkdown();
    });

    exportTxtButton.addEventListener('click', () => {
        exportText();
    });

    // 导出为PDF
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

    // 导出为Markdown
    function exportMarkdown() {
        const markdownContent = editorElement.value;
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

    // 导出为纯文本
    function exportText() {
        const textContent = editorElement.value;
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${notePath.replace(/\.[^/.]+$/, "")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
