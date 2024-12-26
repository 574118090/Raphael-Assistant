document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('back-button');
    const saveButton = document.getElementById('save-button');
    const currentPathDisplay = document.getElementById('current-path');
    const viewerElement = document.getElementById('viewer');
    const saveModal = document.getElementById('save-modal');
    const confirmSaveButton = document.getElementById('confirm-save');
    const discardSaveButton = document.getElementById('discard-save');
    const cancelSaveButton = document.getElementById('cancel-save');
    const closeModalButton = document.querySelector('.close-button');
    const exportPdfButton = document.getElementById('export-pdf');
    const exportMdButton = document.getElementById('export-md');
    const exportTxtButton = document.getElementById('export-txt');

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
                    viewerElement.innerHTML = originalContent; // 直接插入内容
                    triggerRendering();
                    ensureAtLeastOneDiv(); // 确保至少有一个div
                } else {
                    alert('加载笔记失败：' + data.message);
                    viewerElement.textContent = '加载失败';
                    ensureAtLeastOneDiv(); // 即使加载失败，也确保有一个div
                }
            })
            .catch(error => {
                console.error('Error loading note:', error);
                alert('加载笔记失败。');
                viewerElement.textContent = '加载失败';
                ensureAtLeastOneDiv(); // 即使加载失败，也确保有一个div
            });
    }

    loadNote();

    // 渲染并触发 Highlight.js（假设仍需高亮）
    function triggerRendering() {
        // 触发 Highlight.js
        document.querySelectorAll('#viewer pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    // 设置光标到元素的末尾
    function setCursorToEnd(element) {
        if (!(element instanceof Node)) {
            console.error('setCursorToEnd: element is not a Node', element);
            return;
        }

        const range = document.createRange();
        const sel = window.getSelection();
        try {
            range.selectNodeContents(element);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (error) {
            console.error('setCursorToEnd error:', error);
        }
    }

    // 设置光标到元素的起始位置
    function setCursorToStart(element) {
        if (!(element instanceof Node)) {
            console.error('setCursorToStart: element is not a Node', element);
            return;
        }

        const range = document.createRange();
        const sel = window.getSelection();
        try {
            range.selectNodeContents(element);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (error) {
            console.error('setCursorToStart error:', error);
        }
    }

    // 确保编辑区域至少有一个div
    function ensureAtLeastOneDiv() {
        if (viewerElement.querySelectorAll('div').length === 0) {
            const defaultDiv = document.createElement('div');
            defaultDiv.innerHTML = '<p><br></p>'; // 空段落
            viewerElement.appendChild(defaultDiv);
        }
    }

    // 监听输入事件，处理动态转换
    let isProcessing = false; // 防止事件循环
    let isComposing = false; // 标记是否正在进行组合

    // 监听组合事件
    viewerElement.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    viewerElement.addEventListener('compositionend', () => {
        isComposing = false;
        // 触发 input 事件处理
        viewerElement.dispatchEvent(new Event('input'));
    });

    viewerElement.addEventListener('input', (e) => {
        if (isProcessing || isComposing) {
            return;
        }
        isProcessing = true;

        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            isProcessing = false;
            return; // 确保有选区
        }
        const range = selection.getRangeAt(0);
        const currentNode = range.startContainer;
        const currentLine = getCurrentLine(currentNode);

        if (currentLine) {
            const text = currentLine.textContent.trim();
            const transformedHTML = transformMarkdown(text);

            if (transformedHTML) {
                // 判断是否是第一行
                const isFirstLine = currentLine === viewerElement.firstChild;

                if (isFirstLine) {
                    // 更新第一个div的内容，而不是替换整个节点
                    currentLine.innerHTML = transformedHTML;
                    setCursorToEnd(currentLine);
                } else {
                    // 替换当前行的 HTML
                    const newNode = document.createElement('div');
                    newNode.innerHTML = transformedHTML;

                    if (newNode.firstChild && newNode.firstChild.nodeType === Node.ELEMENT_NODE) {
                        const clonedNode = newNode.firstChild.cloneNode(true);
                        currentLine.replaceWith(clonedNode);

                        // 重新设置光标位置
                        setCursorToEnd(clonedNode);
                    } else {
                        console.warn('newNode.firstChild is null or not a Node.', newNode.firstChild);
                    }
                }

                // 更新保存状态
                const updatedContent = viewerElement.innerHTML;
                isModified = (updatedContent !== originalContent);
                toggleSaveButton();

                // 重新触发高亮
                triggerRendering();
            }

            ensureAtLeastOneDiv(); // 确保至少有一个div
        }

        isProcessing = false;
    });

    // 获取当前行的元素节点
    function getCurrentLine(node) {
        while (node && node !== viewerElement) {
            if (node.nodeType === Node.ELEMENT_NODE && ['DIV', 'P', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'LI'].includes(node.tagName)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    // 根据 Markdown 语法转换 HTML
    let listType = null; // 'ul' 或 'ol'

    function transformMarkdown(text) {
        // 行首匹配规则
        const patterns = [
            { regex: /^# (.+)/, replacement: '<h1>$1</h1>' },
            { regex: /^## (.+)/, replacement: '<h2>$1</h2>' },
            { regex: /^### (.+)/, replacement: '<h3>$1</h3>' },
            { regex: /^> (.+)/, replacement: '<blockquote>$1</blockquote>' },
            { regex: /^```(\w+)?/, replacement: '<pre><code class="$1">' },
            { regex: /^```$/, replacement: '</code></pre>' },
            // 处理无序列表
            { regex: /^\* (.+)/, replacement: (match, p1) => {
                if (listType !== 'ul') {
                    listType = 'ul';
                    return '<ul><li>' + p1 + '</li></ul>';
                }
                return '<li>' + p1 + '</li>';
            }},
            // 处理有序列表
            { regex: /^\d+\.\s+(.+)/, replacement: (match, p1) => {
                if (listType !== 'ol') {
                    listType = 'ol';
                    return '<ol><li>' + p1 + '</li></ol>';
                }
                return '<li>' + p1 + '</li>';
            }}
        ];

        for (let pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                return pattern.replacement instanceof Function ?
                       pattern.replacement(match[0], match[1]) :
                       pattern.replacement.replace(/\$(\d+)/g, (m, p1) => match[p1]);
            }
        }

        // 如果不是列表项，重置 listType
        listType = null;
        return null; // 不匹配任何规则
    }

    // 显示或隐藏保存按钮
    function toggleSaveButton() {
        if(isModified) {
            saveButton.style.display = 'inline-flex';
        } else {
            saveButton.style.display = 'none';
        }
    }

    // 保存按钮点击事件
    saveButton.addEventListener('click', () => {
        saveNote();
    });

    // 保存笔记内容
    function saveNote() {
        const renderedContent = viewerElement.innerHTML;
        // 直接保存 HTML 内容
        const data = {
            path: notePath,
            content: renderedContent
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
                    originalContent = renderedContent;
                    isModified = false;
                    toggleSaveButton();
                    alert('保存成功。');
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
        // 使用 Turndown 将 HTML 转换为 Markdown
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(viewerElement.innerHTML);
        const blob = new Blob([markdown], { type: 'text/markdown' });
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
        const textContent = viewerElement.innerText;
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

    // 新增：监听 keydown 事件，处理退格键以清除格式和方向下键以插入空行
    viewerElement.addEventListener('keydown', (e) => {
        // 处理退格键以清除格式
        if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const currentNode = range.startContainer;
            const currentLine = getCurrentLine(currentNode);

            if (!currentLine) return;

            // 判断光标是否位于当前行的起始位置
            const isAtStart = isCursorAtStart(range);

            if (isAtStart) {
                // 检查当前行是否为标题（h1, h2, h3）或引用（blockquote）
                if (['H1', 'H2', 'H3', 'BLOCKQUOTE'].includes(currentLine.tagName)) {
                    e.preventDefault(); // 阻止默认的退格行为

                    // 获取当前行的文本内容，移除格式标记
                    const textContent = currentLine.textContent;

                    // 将当前行转换为普通段落
                    const p = document.createElement('p');
                    p.innerHTML = textContent || '<br>'; // 确保段落不为空

                    // 替换当前行的元素
                    currentLine.replaceWith(p);

                    // 设置光标到段落的起始位置
                    setCursorToStart(p);

                    // 更新保存状态
                    const updatedContent = viewerElement.innerHTML;
                    isModified = (updatedContent !== originalContent);
                    toggleSaveButton();

                    // 重新触发高亮
                    triggerRendering();
                }
            }
        }

        // 处理方向下键，自动插入空行
        if (e.key === 'ArrowDown') {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const currentNode = range.startContainer;
            const currentLine = getCurrentLine(currentNode);

            if (!currentLine) return;

            // 检查当前行是否为空
            const isCurrentLineEmpty = currentLine.textContent.trim() === '';

            // 获取所有行
            const allLines = viewerElement.querySelectorAll('div, p, h1, h2, h3, blockquote, pre, li');

            // 获取最后一行
            const lastLine = allLines[allLines.length - 1];
            const isLastLineEmpty = lastLine.textContent.trim() === '';

            // 判断当前行是否是最后一行
            const isCurrentLineLast = currentLine === lastLine;

            if (isCurrentLineLast && !isCurrentLineEmpty && !isLastLineEmpty) {
                // 插入一个新的空div
                const newDiv = document.createElement('div');
                newDiv.innerHTML = '<p><br></p>'; // 空段落
                viewerElement.appendChild(newDiv);

                // 设置光标到新插入的空div
                setCursorToEnd(newDiv);

                // 更新保存状态
                const updatedContent = viewerElement.innerHTML;
                isModified = (updatedContent !== originalContent);
                toggleSaveButton();

                // 重新触发高亮
                triggerRendering();

                // 阻止默认的方向下键行为，以避免光标移动不必要的位置
                e.preventDefault();
            }
        }
    });

    // 新增：监听 paste 事件，条件性插入内容
    viewerElement.addEventListener('paste', (e) => {
        e.preventDefault(); // 阻止默认的粘贴行为

        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');

        if (htmlData) {
            // 创建一个临时容器来解析 HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlData.trim();

            // 判断是否复制了整个div
            if (tempDiv.childNodes.length === 1 && tempDiv.firstChild.tagName === 'DIV') {
                // 复制了整个div，保留格式
                const selection = window.getSelection();
                if (!selection.rangeCount) return;

                const range = selection.getRangeAt(0);
                range.deleteContents();

                // Insert the entire div's HTML
                const fragment = range.createContextualFragment(htmlData);
                range.insertNode(fragment);

                // Move the cursor to the end of the inserted content
                const insertedNode = fragment.lastChild;
                setCursorToEnd(insertedNode);

                // 更新保存状态
                const updatedContent = viewerElement.innerHTML;
                isModified = (updatedContent !== originalContent);
                toggleSaveButton();

                // 重新触发高亮
                triggerRendering();

                return;
            }
        }

        // 如果不是复制整个div，插入纯文本
        if (textData) {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            // 创建一个文本节点
            const textNode = document.createTextNode(textData);
            range.insertNode(textNode);

            // 移动光标到插入文本的末尾
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            // 触发 input 事件以进行 Markdown 转换
            viewerElement.dispatchEvent(new Event('input'));
        }
    });

    // 判断光标是否位于元素的起始位置
    function isCursorAtStart(range) {
        const { startContainer, startOffset } = range;
        if (startContainer.nodeType === Node.TEXT_NODE) {
            return startOffset === 0;
        } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
            return startOffset === 0;
        }
        return false;
    }
});
