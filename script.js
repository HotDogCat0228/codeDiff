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
    }

    attachEventListeners() {
        // 文本輸入事件
        this.codeLeft.addEventListener('input', () => this.updateLineNumbers('left'));
        this.codeRight.addEventListener('input', () => this.updateLineNumbers('right'));
        
        // 滾動同步
        this.codeLeft.addEventListener('scroll', () => this.syncScroll('left'));
        this.codeRight.addEventListener('scroll', () => this.syncScroll('right'));

        // 按鈕事件
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
        const lineNumbers = [];
        for (let i = 1; i <= lines; i++) {
            lineNumbers.push(i);
        }
        lineNumbersDiv.textContent = lineNumbers.join('\n');
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
    }

    hideResults() {
        this.statsSection.style.display = 'none';
        this.diffSection.style.display = 'none';
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
            } else if (leftIndex < leftLines.length && rightIndex < rightLines.length) {
                // 可能是修改的行
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
            } else if (leftIndex < leftLines.length) {
                // 刪除的行
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
            } else if (rightIndex < rightLines.length) {
                // 新增的行
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

        return diff;
    }

    displayDiff(diff) {
        this.displaySideDiff(diff.left, this.diffLeft);
        this.displaySideDiff(diff.right, this.diffRight);
        this.updateStats(diff.stats);
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
    
    const differ = new CodeDiffer();
    differ.updateLineNumbers();
};
