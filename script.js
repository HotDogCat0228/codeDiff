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
        }
        if (side === 'right' || side === 'both') {
            this.codeRight.value = '';
            this.updateLineNumbers('right');
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
