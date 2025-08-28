class CodeDiffer {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.updateLineNumbers();
    }

    initializeElements() {
        this.codeLeft = document.getElementById('codeLeft');
        this.codeRight = document.getElementById('codeRight');
        this.lineNumbersLeft = document.getElementById('lineNumbersLeft');
        this.lineNumbersRight = document.getElementById('lineNumbersRight');
        this.diffLeft = document.getElementById('diffLeft');
        this.diffRight = document.getElementById('diffRight');
        this.statsSection = document.getElementById('statsSection');
        this.diffSection = document.getElementById('diffSection');
        this.addedLines = document.getElementById('addedLines');
        this.removedLines = document.getElementById('removedLines');
        this.modifiedLines = document.getElementById('modifiedLines');
        this.unchangedLines = document.getElementById('unchangedLines');
        
        // 文件上傳相關元素
        this.fileInputLeft = document.getElementById('fileInputLeft');
        this.fileInputRight = document.getElementById('fileInputRight');
        this.fileNameLeft = document.getElementById('fileNameLeft');
        this.fileNameRight = document.getElementById('fileNameRight');
        this.clearFileLeft = document.getElementById('clearFileLeft');
        this.clearFileRight = document.getElementById('clearFileRight');
        
        // 內聯差異顯示元素
        this.diffHighlightLeft = document.getElementById('diffHighlightLeft');
        this.diffHighlightRight = document.getElementById('diffHighlightRight');
        this.diffConnector = document.getElementById('diffConnector');
        this.codeEditorLeft = document.getElementById('codeEditorLeft');
        this.codeEditorRight = document.getElementById('codeEditorRight');
    }

    attachEventListeners() {
        // 文本輸入事件
        this.codeLeft.addEventListener('input', () => this.updateLineNumbers('left'));
        this.codeRight.addEventListener('input', () => this.updateLineNumbers('right'));
        
        // 滾動同步
        this.codeLeft.addEventListener('scroll', () => this.syncScroll('left'));
        this.codeRight.addEventListener('scroll', () => this.syncScroll('right'));

        // 按鈕事件
        document.getElementById('copyLeft').addEventListener('click', () => this.copyCode('left'));
        document.getElementById('copyRight').addEventListener('click', () => this.copyCode('right'));
        document.getElementById('copyPanelLeft').addEventListener('click', () => this.copyCode('left'));
        document.getElementById('copyPanelRight').addEventListener('click', () => this.copyCode('right'));
        document.getElementById('clearLeft').addEventListener('click', () => this.clearCode('left'));
        document.getElementById('clearRight').addEventListener('click', () => this.clearCode('right'));
        document.getElementById('clearBoth').addEventListener('click', () => this.clearCode('both'));
        document.getElementById('compare').addEventListener('click', () => this.compareCode());
        
        // 文件上傳事件
        this.fileInputLeft.addEventListener('change', (e) => this.handleFileUpload(e, 'left'));
        this.fileInputRight.addEventListener('change', (e) => this.handleFileUpload(e, 'right'));
        this.clearFileLeft.addEventListener('click', () => this.clearFile('left'));
        this.clearFileRight.addEventListener('click', () => this.clearFile('right'));
        
        // 拖拽功能
        this.setupDragAndDrop();
        
        // 差異複製按鈕事件（延遲綁定，因為這些按鈕在比對後才出現）
        this.setupDiffCopyButtons();
    }

    updateLineNumbers(side = 'both') {
        if (side === 'left' || side === 'both') {
            this.updateSingleLineNumbers(this.codeLeft, this.lineNumbersLeft);
        }
        if (side === 'right' || side === 'both') {
            this.updateSingleLineNumbers(this.codeRight, this.lineNumbersRight);
        }
    }

    updateSingleLineNumbers(textarea, lineNumbersDiv) {
        const lines = textarea.value.split('\n').length;
        
        // 清空現有內容
        lineNumbersDiv.innerHTML = '';
        
        // 為每行創建一個 div 元素，確保垂直排列
        for (let i = 1; i <= lines; i++) {
            const lineDiv = document.createElement('div');
            lineDiv.textContent = i;
            lineDiv.style.height = '20px';
            lineDiv.style.lineHeight = '20px';
            lineNumbersDiv.appendChild(lineDiv);
        }
        
        // 備用方案：如果 DOM 方法失敗，使用文字方式
        if (lineNumbersDiv.children.length === 0) {
            const lineNumbers = [];
            for (let i = 1; i <= lines; i++) {
                lineNumbers.push(i);
            }
            lineNumbersDiv.textContent = lineNumbers.join('\n');
        }
    }

    syncScroll(source) {
        const sourceElement = source === 'left' ? this.codeLeft : this.codeRight;
        const targetElement = source === 'left' ? this.codeRight : this.codeLeft;
        const sourceLineNumbers = source === 'left' ? this.lineNumbersLeft : this.lineNumbersRight;
        const targetLineNumbers = source === 'left' ? this.lineNumbersRight : this.lineNumbersLeft;

        targetElement.scrollTop = sourceElement.scrollTop;
        targetLineNumbers.scrollTop = sourceElement.scrollTop;
        sourceLineNumbers.scrollTop = sourceElement.scrollTop;
    }

    clearCode(side) {
        if (side === 'left' || side === 'both') {
            this.codeLeft.value = '';
            this.updateLineNumbers('left');
            this.clearFile('left');
        }
        if (side === 'right' || side === 'both') {
            this.codeRight.value = '';
            this.updateLineNumbers('right');
            this.clearFile('right');
        }
        if (side === 'both') {
            this.hideResults();
        }
        // 清除內聯差異顯示
        this.clearDiffDisplay();
    }

    hideResults() {
        this.statsSection.style.display = 'none';
        this.diffSection.style.display = 'none';
        this.clearDiffDisplay();
    }

    compareCode() {
        const leftCode = this.codeLeft.value;
        const rightCode = this.codeRight.value;

        if (!leftCode && !rightCode) {
            alert('請至少在一個文本框中輸入程式碼');
            return;
        }

        const diff = this.calculateDiff(leftCode, rightCode);
        this.displayDiff(diff);
        this.showResults();
    }

    calculateDiff(leftCode, rightCode) {
        const leftLines = leftCode.split('\n');
        const rightLines = rightCode.split('\n');
        
        // 使用 LCS (最長公共子序列) 算法來計算差異
        const lcs = this.longestCommonSubsequence(leftLines, rightLines);
        const diff = this.buildDiff(leftLines, rightLines, lcs);
        
        return diff;
    }

    longestCommonSubsequence(a, b) {
        const m = a.length;
        const n = b.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        // 回溯找到 LCS
        const lcs = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i - 1] === b[j - 1]) {
                lcs.unshift({ left: i - 1, right: j - 1, line: a[i - 1] });
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }

        return lcs;
    }

    buildDiff(leftLines, rightLines, lcs) {
        const diff = {
            left: [],
            right: [],
            stats: {
                added: 0,
                removed: 0,
                modified: 0,
                unchanged: 0
            }
        };

        let leftIndex = 0;
        let rightIndex = 0;
        let lcsIndex = 0;

        // 改進的差異算法，更準確地識別修改、新增和刪除
        while (leftIndex < leftLines.length || rightIndex < rightLines.length) {
            const nextLcs = lcs[lcsIndex];

            if (nextLcs && leftIndex === nextLcs.left && rightIndex === nextLcs.right) {
                // 相同行
                diff.left.push({
                    lineNumber: leftIndex + 1,
                    content: leftLines[leftIndex],
                    type: 'unchanged'
                });
                diff.right.push({
                    lineNumber: rightIndex + 1,
                    content: rightLines[rightIndex],
                    type: 'unchanged'
                });
                diff.stats.unchanged++;
                leftIndex++;
                rightIndex++;
                lcsIndex++;
            } else {
                // 檢查是否為純新增
                if (leftIndex >= leftLines.length) {
                    diff.left.push({
                        lineNumber: '-',
                        content: '',
                        type: 'context'
                    });
                    diff.right.push({
                        lineNumber: rightIndex + 1,
                        content: rightLines[rightIndex],
                        type: 'added'
                    });
                    diff.stats.added++;
                    rightIndex++;
                } 
                // 檢查是否為純刪除
                else if (rightIndex >= rightLines.length) {
                    diff.left.push({
                        lineNumber: leftIndex + 1,
                        content: leftLines[leftIndex],
                        type: 'removed'
                    });
                    diff.right.push({
                        lineNumber: '-',
                        content: '',
                        type: 'context'
                    });
                    diff.stats.removed++;
                    leftIndex++;
                } 
                // 檢查是否可能為修改
                else {
                    // 向前查看，確定是修改還是新增/刪除
                    const similarity = this.calculateLineSimilarity(leftLines[leftIndex], rightLines[rightIndex]);
                    
                    if (similarity > 0.3) { // 如果相似度超過30%，認為是修改
                        diff.left.push({
                            lineNumber: leftIndex + 1,
                            content: leftLines[leftIndex],
                            type: 'modified'
                        });
                        diff.right.push({
                            lineNumber: rightIndex + 1,
                            content: rightLines[rightIndex],
                            type: 'modified'
                        });
                        diff.stats.modified++;
                        leftIndex++;
                        rightIndex++;
                    } else {
                        // 檢查下一個 LCS 匹配來決定是新增還是刪除
                        const nextLeftMatch = this.findNextLCSMatch(lcs, lcsIndex, leftIndex, 'left');
                        const nextRightMatch = this.findNextLCSMatch(lcs, lcsIndex, rightIndex, 'right');
                        
                        if (nextLeftMatch < nextRightMatch) {
                            // 左側先匹配，當前行是刪除
                            diff.left.push({
                                lineNumber: leftIndex + 1,
                                content: leftLines[leftIndex],
                                type: 'removed'
                            });
                            diff.right.push({
                                lineNumber: '-',
                                content: '',
                                type: 'context'
                            });
                            diff.stats.removed++;
                            leftIndex++;
                        } else {
                            // 右側先匹配，當前行是新增
                            diff.left.push({
                                lineNumber: '-',
                                content: '',
                                type: 'context'
                            });
                            diff.right.push({
                                lineNumber: rightIndex + 1,
                                content: rightLines[rightIndex],
                                type: 'added'
                            });
                            diff.stats.added++;
                            rightIndex++;
                        }
                    }
                }
            }
        }

        return diff;
    }

    // 新增：計算兩行代碼的相似度
    calculateLineSimilarity(line1, line2) {
        if (!line1 || !line2) return 0;
        
        const words1 = line1.trim().split(/\s+/);
        const words2 = line2.trim().split(/\s+/);
        
        if (words1.length === 0 && words2.length === 0) return 1;
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length * 2 / (words1.length + words2.length);
    }

    // 新增：找到下一個 LCS 匹配
    findNextLCSMatch(lcs, currentIndex, lineIndex, side) {
        for (let i = currentIndex; i < lcs.length; i++) {
            if (side === 'left' && lcs[i].left >= lineIndex) {
                return lcs[i].left - lineIndex;
            }
            if (side === 'right' && lcs[i].right >= lineIndex) {
                return lcs[i].right - lineIndex;
            }
        }
        return Infinity;
    }

    displayDiff(diff) {
        // 顯示傳統的底部差異結果
        this.displaySideDiff(diff.left, this.diffLeft);
        this.displaySideDiff(diff.right, this.diffRight);
        this.updateStats(diff.stats);
        
        // 新增：內聯差異顯示
        this.displayInlineDiff(diff);
        this.createDiffConnectors(diff);
    }

    // 新增：內聯差異顯示方法
    displayInlineDiff(diff) {
        // 清除之前的高亮
        this.diffHighlightLeft.innerHTML = '';
        this.diffHighlightRight.innerHTML = '';
        
        // 啟用差異模式
        this.codeEditorLeft.classList.add('diff-mode');
        this.codeEditorRight.classList.add('diff-mode');
        
        // 為左側創建高亮
        diff.left.forEach(line => {
            const highlightDiv = document.createElement('div');
            highlightDiv.className = `diff-highlight-line ${line.type}`;
            this.diffHighlightLeft.appendChild(highlightDiv);
        });
        
        // 為右側創建高亮
        diff.right.forEach(line => {
            const highlightDiv = document.createElement('div');
            highlightDiv.className = `diff-highlight-line ${line.type}`;
            this.diffHighlightRight.appendChild(highlightDiv);
        });
    }

    // 新增：創建連接線
    createDiffConnectors(diff) {
        // 清除之前的連接線
        this.diffConnector.innerHTML = '';
        
        let leftIndex = 0;
        let rightIndex = 0;
        
        // 計算需要連接的行
        for (let i = 0; i < Math.max(diff.left.length, diff.right.length); i++) {
            const leftLine = diff.left[i];
            const rightLine = diff.right[i];
            
            if (leftLine && rightLine) {
                // 如果兩邊都有行，檢查是否需要連接線
                if (leftLine.type !== 'unchanged' || rightLine.type !== 'unchanged') {
                    this.createConnectorLine(i, leftLine.type, rightLine.type);
                }
            }
        }
    }

    // 新增：創建單個連接線
    createConnectorLine(lineIndex, leftType, rightType) {
        const connector = document.createElement('div');
        connector.className = 'diff-line-connector visible';
        
        // 根據差異類型設置顏色
        if (leftType === 'removed' && rightType === 'added') {
            connector.style.background = 'linear-gradient(90deg, #dc3545 0%, #28a745 100%)';
        } else if (leftType === 'modified' || rightType === 'modified') {
            connector.style.background = '#ffc107';
        } else if (leftType === 'added' || rightType === 'added') {
            connector.style.background = '#28a745';
        } else if (leftType === 'removed' || rightType === 'removed') {
            connector.style.background = '#dc3545';
        }
        
        // 計算連接線的位置
        const topOffset = 80 + (lineIndex * 20); // 80px 是面板標題的高度
        connector.style.top = `${topOffset}px`;
        
        this.diffConnector.appendChild(connector);
    }

    // 修改：清除差異顯示
    clearDiffDisplay() {
        this.diffHighlightLeft.innerHTML = '';
        this.diffHighlightRight.innerHTML = '';
        this.diffConnector.innerHTML = '';
        this.codeEditorLeft.classList.remove('diff-mode');
        this.codeEditorRight.classList.remove('diff-mode');
    }

    displaySideDiff(lines, container) {
        container.innerHTML = '';
        
        lines.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.className = `diff-line ${line.type}`;
            
            const lineNumber = document.createElement('div');
            lineNumber.className = 'diff-line-number';
            lineNumber.textContent = line.lineNumber;
            
            const content = document.createElement('div');
            content.className = 'diff-line-content';
            content.textContent = line.content || ' ';
            
            lineDiv.appendChild(lineNumber);
            lineDiv.appendChild(content);
            container.appendChild(lineDiv);
        });
    }

    updateStats(stats) {
        this.addedLines.textContent = stats.added;
        this.removedLines.textContent = stats.removed;
        this.modifiedLines.textContent = stats.modified;
        this.unchangedLines.textContent = stats.unchanged;
    }

    showResults() {
        this.statsSection.style.display = 'block';
        this.diffSection.style.display = 'block';
    }

    // 文件上傳處理
    handleFileUpload(event, side) {
        const file = event.target.files[0];
        if (!file) return;

        // 檢查文件大小 (限制為 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('文件大小不能超過 5MB');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (side === 'left') {
                this.codeLeft.value = content;
                this.fileNameLeft.textContent = file.name;
                this.fileNameLeft.classList.add('has-file');
                this.clearFileLeft.style.display = 'block';
                this.updateLineNumbers('left');
            } else {
                this.codeRight.value = content;
                this.fileNameRight.textContent = file.name;
                this.fileNameRight.classList.add('has-file');
                this.clearFileRight.style.display = 'block';
                this.updateLineNumbers('right');
            }
        };

        reader.onerror = () => {
            alert('讀取文件失敗，請重試');
        };

        reader.readAsText(file);
    }

    // 清除文件
    clearFile(side) {
        if (side === 'left') {
            this.fileInputLeft.value = '';
            this.fileNameLeft.textContent = '未選擇文件';
            this.fileNameLeft.classList.remove('has-file');
            this.clearFileLeft.style.display = 'none';
        } else {
            this.fileInputRight.value = '';
            this.fileNameRight.textContent = '未選擇文件';
            this.fileNameRight.classList.remove('has-file');
            this.clearFileRight.style.display = 'none';
        }
    }

    // 設置拖拽功能
    setupDragAndDrop() {
        const setupDragEvents = (textarea, side) => {
            textarea.addEventListener('dragover', (e) => {
                e.preventDefault();
                textarea.style.background = '#e3f2fd';
                textarea.style.borderColor = '#2196f3';
            });

            textarea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                textarea.style.background = '';
                textarea.style.borderColor = '';
            });

            textarea.addEventListener('drop', (e) => {
                e.preventDefault();
                textarea.style.background = '';
                textarea.style.borderColor = '';

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    this.processDroppedFile(file, side);
                }
            });
        };

        setupDragEvents(this.codeLeft, 'left');
        setupDragEvents(this.codeRight, 'right');
    }

    // 處理拖拽的文件
    processDroppedFile(file, side) {
        // 檢查是否為文本文件
        const textTypes = [
            'text/', 'application/json', 'application/xml', 
            'application/javascript', 'application/typescript'
        ];
        
        const isTextFile = textTypes.some(type => 
            file.type.startsWith(type) || 
            this.isTextFileExtension(file.name)
        );

        if (!isTextFile) {
            alert('請選擇文本或程式文件');
            return;
        }

        // 檢查文件大小
        if (file.size > 5 * 1024 * 1024) {
            alert('文件大小不能超過 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (side === 'left') {
                this.codeLeft.value = content;
                this.fileNameLeft.textContent = file.name;
                this.fileNameLeft.classList.add('has-file');
                this.clearFileLeft.style.display = 'block';
                this.updateLineNumbers('left');
                // 同步文件輸入框
                const dt = new DataTransfer();
                dt.items.add(file);
                this.fileInputLeft.files = dt.files;
            } else {
                this.codeRight.value = content;
                this.fileNameRight.textContent = file.name;
                this.fileNameRight.classList.add('has-file');
                this.clearFileRight.style.display = 'block';
                this.updateLineNumbers('right');
                // 同步文件輸入框
                const dt = new DataTransfer();
                dt.items.add(file);
                this.fileInputRight.files = dt.files;
            }
        };

        reader.onerror = () => {
            alert('讀取文件失敗，請重試');
        };

        reader.readAsText(file);
    }

    // 檢查文件擴展名
    isTextFileExtension(filename) {
        const textExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.less',
            '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.php', '.rb', '.go',
            '.rs', '.swift', '.kt', '.scala', '.sh', '.sql', '.json', '.xml',
            '.yaml', '.yml', '.md', '.txt', '.vue', '.svelte', '.dart',
            '.r', '.m', '.pl', '.lua', '.vim', '.ini', '.cfg', '.conf'
        ];
        
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return textExtensions.includes(extension);
    }

    // 複製功能
    async copyCode(side) {
        try {
            const code = side === 'left' ? this.codeLeft.value : this.codeRight.value;
            
            if (!code.trim()) {
                this.showToast('沒有程式碼可複製', 'error');
                return;
            }

            await navigator.clipboard.writeText(code);
            const sideName = side === 'left' ? '左側' : '右側';
            this.showToast(`${sideName}程式碼已複製到剪貼簿`);
        } catch (err) {
            console.error('複製失敗:', err);
            this.showToast('複製失敗，請重試', 'error');
        }
    }

    // 複製差異結果
    async copyDiff(type) {
        try {
            let content = '';
            
            if (type === 'left') {
                content = this.getDiffContent('left');
            } else if (type === 'right') {
                content = this.getDiffContent('right');
            } else if (type === 'both') {
                const leftContent = this.getDiffContent('left');
                const rightContent = this.getDiffContent('right');
                content = `=== 程式碼 A ===\n${leftContent}\n\n=== 程式碼 B ===\n${rightContent}`;
            }

            if (!content.trim()) {
                this.showToast('沒有差異內容可複製', 'error');
                return;
            }

            await navigator.clipboard.writeText(content);
            
            const typeName = type === 'left' ? '左側差異' : 
                           type === 'right' ? '右側差異' : '完整差異';
            this.showToast(`${typeName}已複製到剪貼簿`);
        } catch (err) {
            console.error('複製差異失敗:', err);
            this.showToast('複製失敗，請重試', 'error');
        }
    }

    // 獲取差異內容的純文字版本
    getDiffContent(side) {
        const container = side === 'left' ? this.diffLeft : this.diffRight;
        const lines = container.querySelectorAll('.diff-line');
        const content = [];

        lines.forEach(line => {
            const lineNumber = line.querySelector('.diff-line-number').textContent;
            const lineContent = line.querySelector('.diff-line-content').textContent;
            const type = line.classList.contains('added') ? '+' :
                        line.classList.contains('removed') ? '-' :
                        line.classList.contains('modified') ? '~' : ' ';
            
            if (lineNumber !== '-' && lineContent.trim()) {
                content.push(`${type}${lineNumber.padStart(4)}: ${lineContent}`);
            }
        });

        return content.join('\n');
    }

    // 顯示複製成功/失敗的提示
    showToast(message, type = 'success') {
        // 移除之前的提示
        const existingToast = document.querySelector('.copy-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `copy-toast ${type === 'error' ? 'error' : ''}`;
        
        const icon = type === 'error' ? 
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>` :
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>`;

        toast.innerHTML = `${icon}<span>${message}</span>`;
        document.body.appendChild(toast);

        // 3秒後自動移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    // 設置差異複製按鈕
    setupDiffCopyButtons() {
        // 這些按鈕在頁面載入時就存在
        const copyDiffLeft = document.getElementById('copyDiffLeft');
        const copyDiffRight = document.getElementById('copyDiffRight');
        const copyDiffBoth = document.getElementById('copyDiffBoth');
        const copyDiffPanelLeft = document.getElementById('copyDiffPanelLeft');
        const copyDiffPanelRight = document.getElementById('copyDiffPanelRight');

        if (copyDiffLeft) copyDiffLeft.addEventListener('click', () => this.copyDiff('left'));
        if (copyDiffRight) copyDiffRight.addEventListener('click', () => this.copyDiff('right'));
        if (copyDiffBoth) copyDiffBoth.addEventListener('click', () => this.copyDiff('both'));
        if (copyDiffPanelLeft) copyDiffPanelLeft.addEventListener('click', () => this.copyDiff('left'));
        if (copyDiffPanelRight) copyDiffPanelRight.addEventListener('click', () => this.copyDiff('right'));
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new CodeDiffer();
});

// 一些示例程式碼可以用來測試
window.loadSample = function() {
    const sampleLeft = `function hello(name) {
    console.log("Hello, " + name);
    return "Hello, " + name;
}

function goodbye(name) {
    console.log("Goodbye, " + name);
}

let message = "Welcome";
console.log(message);`;

    const sampleRight = `function hello(name) {
    console.log("Hi, " + name);
    return "Hi, " + name;
}

function welcome(name) {
    console.log("Welcome, " + name);
}

function goodbye(name) {
    console.log("Goodbye, " + name);
}

let message = "Welcome to our app";
console.log(message);
alert(message);`;

    document.getElementById('codeLeft').value = sampleLeft;
    document.getElementById('codeRight').value = sampleRight;
    
    // 創建新的 CodeDiffer 實例來更新行號
    const differ = new CodeDiffer();
    differ.updateLineNumbers();
};

// 添加鍵盤快捷鍵支援
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + C 複製當前焦點的代碼區域
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id === 'codeLeft') {
            e.preventDefault();
            const differ = new CodeDiffer();
            differ.copyCode('left');
        } else if (activeElement && activeElement.id === 'codeRight') {
            e.preventDefault();
            const differ = new CodeDiffer();
            differ.copyCode('right');
        }
    }
});
