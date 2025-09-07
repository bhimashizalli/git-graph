// Advanced Git Network Visualizer Application
class AdvancedGitVisualizer {
    constructor() {
        this.data = null;
        this.filteredData = null;
        this.currentZoom = 1;
        this.maxZoom = 50; // Increased from 3 to 50 for unlimited zoom
        this.minZoom = 0.05;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.sidebarCollapsed = false;

        // Performance tracking
        this.renderStartTime = 0;
        this.visibleCommits = [];
        this.commitChunkSize = 500;
        this.currentChunk = 0;

        // D3.js integration
        this.d3Container = null;
        this.d3Simulation = null;
        this.forceEnabled = false;

        // Filtering state
        this.branchFilters = {};
        this.searchTerm = '';
        this.timeFilter = { from: null, to: null };

        this.branchColors = {
            'main': '#1FB8CD',
            'master': '#1FB8CD',
            'develop': '#FFC185',
            'dev': '#FFC185',
            'feature': '#B4413C',
            'feat': '#B4413C',
            'hotfix': '#DB4545',
            'fix': '#DB4545',
            'release': '#D2BA4C',
            'rel': '#D2BA4C',
            'bugfix': '#964325',
            'bug': '#964325',
            'support': '#944454',
            'chore': '#ECEBD5'
        };

        this.init();
    }

    init() {
        this.loadSampleData();
        this.bindEvents();
        this.setupSVGInteractions();
        this.initializeMinimap();
        this.initializeD3();
    }

    loadSampleData() {
        const sampleData = {
            "repository_info": {
                "name": "advanced-git-demo",
                "total_branches": 5,
                "total_commits": 12
            },
            "branches": [
                { "name": "main", "type": "local" },
                { "name": "develop", "type": "local" },
                { "name": "feature/auth", "type": "local" },
                { "name": "feature/ui", "type": "local" },
                { "name": "hotfix/critical", "type": "local" }
            ],
            "commits": [
                {
                    "hash": "a1b2c3d",
                    "parents": [],
                    "author": "Developer",
                    "date": "2024-01-01 10:00:00 +0000",
                    "message": "Initial commit",
                    "branch": "main"
                },
                {
                    "hash": "e4f5g6h",
                    "parents": ["a1b2c3d"],
                    "author": "Developer",
                    "date": "2024-01-02 10:00:00 +0000",
                    "message": "Add project structure",
                    "branch": "develop"
                },
                {
                    "hash": "i7j8k9l",
                    "parents": ["e4f5g6h"],
                    "author": "Developer",
                    "date": "2024-01-03 10:00:00 +0000",
                    "message": "Start authentication feature",
                    "branch": "feature/auth"
                },
                {
                    "hash": "m1n2o3p",
                    "parents": ["e4f5g6h"],
                    "author": "Developer",
                    "date": "2024-01-03 11:00:00 +0000",
                    "message": "Start UI components",
                    "branch": "feature/ui"
                },
                {
                    "hash": "q4r5s6t",
                    "parents": ["i7j8k9l"],
                    "author": "Developer",
                    "date": "2024-01-04 10:00:00 +0000",
                    "message": "Implement login logic",
                    "branch": "feature/auth"
                },
                {
                    "hash": "u7v8w9x",
                    "parents": ["m1n2o3p"],
                    "author": "Developer",
                    "date": "2024-01-04 11:00:00 +0000",
                    "message": "Create dashboard UI",
                    "branch": "feature/ui"
                },
                {
                    "hash": "y1z2a3b",
                    "parents": ["q4r5s6t"],
                    "author": "Developer",
                    "date": "2024-01-05 10:00:00 +0000",
                    "message": "Complete auth system",
                    "branch": "feature/auth"
                },
                {
                    "hash": "c4d5e6f",
                    "parents": ["e4f5g6h", "y1z2a3b"],
                    "author": "Developer",
                    "date": "2024-01-06 10:00:00 +0000",
                    "message": "Merge auth feature to develop",
                    "branch": "develop"
                },
                {
                    "hash": "g7h8i9j",
                    "parents": ["u7v8w9x"],
                    "author": "Developer",
                    "date": "2024-01-06 11:00:00 +0000",
                    "message": "Finalize UI components",
                    "branch": "feature/ui"
                },
                {
                    "hash": "k1l2m3n",
                    "parents": ["c4d5e6f", "g7h8i9j"],
                    "author": "Developer",
                    "date": "2024-01-07 10:00:00 +0000",
                    "message": "Merge UI feature to develop",
                    "branch": "develop"
                },
                {
                    "hash": "o4p5q6r",
                    "parents": ["a1b2c3d"],
                    "author": "Developer",
                    "date": "2024-01-07 15:00:00 +0000",
                    "message": "Critical hotfix",
                    "branch": "hotfix/critical"
                },
                {
                    "hash": "s7t8u9v",
                    "parents": ["a1b2c3d", "k1l2m3n", "o4p5q6r"],
                    "author": "Developer",
                    "date": "2024-01-08 10:00:00 +0000",
                    "message": "Release v1.0 - merge develop and hotfix",
                    "branch": "main"
                }
            ]
        };

        this.processData(sampleData);
    }

    bindEvents() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());

        // Import/Export - Fix the file input issue
        const importBtn = document.getElementById('importBtn');
        const fileInput = document.getElementById('fileInput');

        importBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFileImport(e);
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => this.exportSVG());

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('fitToScreen').addEventListener('click', () => this.fitToScreen());

        // D3.js force layout toggle
        const forceToggle = document.createElement('button');
        forceToggle.className = 'btn btn--sm btn--outline';
        forceToggle.textContent = 'Force Layout';
        forceToggle.id = 'forceToggle';
        forceToggle.addEventListener('click', () => this.toggleForceLayout());
        document.querySelector('.zoom-controls').appendChild(forceToggle);

        // Branch filters
        document.getElementById('selectAllBranches').addEventListener('click', () => this.selectAllBranches(true));
        document.getElementById('deselectAllBranches').addEventListener('click', () => this.selectAllBranches(false));
        document.getElementById('branchSearch').addEventListener('input', (e) => this.filterBranches(e.target.value));

        // Time filters
        document.getElementById('applyTimeFilter').addEventListener('click', () => this.applyTimeFilter());
        document.getElementById('resetTimeFilter').addEventListener('click', () => this.resetTimeFilter());

        // Search - Fix overlapping issue by ensuring proper event handling
        const commitSearch = document.getElementById('commitSearch');
        const searchBtn = document.getElementById('searchBtn');

        commitSearch.addEventListener('input', (e) => {
            e.stopPropagation();
            this.searchCommits(e.target.value);
        });

        commitSearch.addEventListener('focus', (e) => {
            e.stopPropagation();
        });

        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.searchCommits(commitSearch.value);
        });

        // Modal
        document.getElementById('modalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('modalBackdrop').addEventListener('click', () => this.hideModal());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupSVGInteractions() {
        const svg = document.getElementById('gitGraph');

        // Mouse wheel zoom - unlimited zoom
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta, e.clientX, e.clientY);
        });

        // Pan functionality - ensure SVG events don't bubble to search elements
        svg.addEventListener('mousedown', (e) => {
            if (e.target.tagName !== 'circle' && e.target.tagName !== 'text') {
                this.isDragging = true;
                this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
                svg.style.cursor = 'grabbing';
                e.preventDefault();
                e.stopPropagation();
            }
        });

        svg.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.panX = e.clientX - this.dragStart.x;
                this.panY = e.clientY - this.dragStart.y;
                this.updateTransform();
                this.updateMinimap();
                e.preventDefault();
                e.stopPropagation();
            }
        });

        svg.addEventListener('mouseup', (e) => {
            this.isDragging = false;
            svg.style.cursor = 'grab';
            e.preventDefault();
            e.stopPropagation();
        });

        svg.addEventListener('mouseleave', () => {
            this.isDragging = false;
            svg.style.cursor = 'grab';
            this.hideTooltip();
        });
    }

    initializeMinimap() {
        const minimap = document.getElementById('minimapSvg');
        minimap.addEventListener('click', (e) => this.handleMinimapClick(e));
    }

    initializeD3() {
        // Initialize D3.js container for enhanced interactions
        this.d3Container = d3.select('#gitGraph');
        
        // Setup D3 force simulation for dynamic network layout
        this.d3Simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.hash).distance(80))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(400, 300))
            .force('collision', d3.forceCollide().radius(20));
            
        // Add D3-powered smooth transitions
        this.d3Container
            .style('transition', 'all 0.3s ease-in-out');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const icon = document.getElementById('sidebarIcon');

        this.sidebarCollapsed = !this.sidebarCollapsed;

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            icon.textContent = '▶';
            icon.style.transform = 'rotate(0deg)';
        } else {
            sidebar.classList.remove('collapsed');
            icon.textContent = '◀';
            icon.style.transform = 'rotate(0deg)';
        }

        setTimeout(() => this.handleResize(), 300);
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('File selected:', file.name, 'Size:', file.size);
        this.showLoading('Processing repository file...');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                console.log('JSON parsed successfully, commits:', jsonData.commits?.length || 0);
                this.validateAndProcessData(jsonData);
            } catch (error) {
                console.error('JSON parsing error:', error);
                this.showError('Invalid JSON file format: ' + error.message);
                this.hideLoading();
            }
        };

        reader.onerror = (error) => {
            console.error('File reading error:', error);
            this.showError('Error reading file: ' + error.message);
            this.hideLoading();
        };

        reader.readAsText(file);

        // Clear the input so the same file can be selected again
        event.target.value = '';
    }

    validateAndProcessData(data) {
        try {
            if (!data.repository_info || !data.branches || !data.commits) {
                throw new Error('Missing required fields: repository_info, branches, or commits');
            }

            if (!Array.isArray(data.branches) || !Array.isArray(data.commits)) {
                throw new Error('Branches and commits must be arrays');
            }

            if (data.commits.length === 0) {
                throw new Error('No commits found in the data');
            }

            console.log('Data validation passed. Commits:', data.commits.length);

            // Show progress for large datasets
            if (data.commits.length > 1000) {
                this.processLargeDataset(data);
            } else {
                this.processData(data);
                this.showSuccess(`Successfully loaded ${data.commits.length} commits from ${data.repository_info.path}`);
                setTimeout(() => {
                    this.hideSuccess();
                    this.hideLoading();
                }, 2000);
            }

        } catch (error) {
            console.error('Data validation error:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    processLargeDataset(data) {
        const totalCommits = data.commits.length;
        let processedCommits = 0;

        console.log('Processing large dataset:', totalCommits, 'commits');

        const processChunk = () => {
            const chunkSize = Math.min(100, totalCommits - processedCommits);
            const endIndex = processedCommits + chunkSize;

            // Process chunk
            for (let i = processedCommits; i < endIndex; i++) {
                const commit = data.commits[i];
                if (!commit.branch) {
                    commit.branch = this.inferBranch(commit);
                }
            }

            processedCommits = endIndex;
            const progress = Math.round((processedCommits / totalCommits) * 100);
            this.updateProgress(progress);

            if (processedCommits < totalCommits) {
                setTimeout(processChunk, 10);
            } else {
                console.log('Large dataset processing complete');
                this.processData(data);
                this.showSuccess(`Successfully loaded ${totalCommits} commits from ${data.repository_info.path}`);
                setTimeout(() => {
                    this.hideSuccess();
                    this.hideLoading();
                }, 2000);
            }
        };

        processChunk();
    }

    processData(data) {
        this.renderStartTime = performance.now();

        this.data = data;
        this.filteredData = JSON.parse(JSON.stringify(data));

        // Update repository name
        document.getElementById('repoName').textContent = data.repository_info.path;

        // Initialize branch filters
        this.initializeBranchFilters();

        // Process commits for visualization
        this.processCommitsForVisualization();

        // Update UI
        this.updateStats();
        this.updateBranchFilters();
        this.updateTimeRange();
        this.render();

        // Update performance info
        const renderTime = performance.now() - this.renderStartTime;
        document.getElementById('renderTime').textContent = Math.round(renderTime) + 'ms';
    }

    initializeBranchFilters() {
        this.branchFilters = {};
        this.data.branches.forEach(branch => {
            this.branchFilters[branch.name] = true;
        });
    }

    processCommitsForVisualization() {
        // Sort commits by date (newest first for proper display)
        this.filteredData.commits.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Detect branch splits and merges
        this.detectBranchTopology();

        // Assign lanes and positions
        this.assignCommitPositions();
    }

    detectBranchTopology() {
        const splits = [];
        const merges = [];

        this.filteredData.commits.forEach(commit => {
            // Detect merges (commits with multiple parents)
            if (commit.parents && commit.parents.length > 1) {
                merges.push({
                    commit: commit.hash,
                    parents: commit.parents,
                    type: 'merge'
                });
            }

            // Detect splits (when a commit spawns multiple children)
            const children = this.getCommitChildren(commit.hash);
            if (children.length > 1) {
                splits.push({
                    commit: commit.hash,
                    children: children,
                    type: 'split'
                });
            }
        });

        this.filteredData.splits = splits;
        this.filteredData.merges = merges;
    }

    getCommitChildren(commitHash) {
        return this.filteredData.commits.filter(commit =>
            commit.parents && commit.parents.includes(commitHash)
        );
    }

    assignCommitPositions() {
        const laneMap = new Map();
        let nextLane = 0;

        this.filteredData.commits.forEach((commit, index) => {
            // Assign lane based on branch or create new lane
            if (!laneMap.has(commit.branch)) {
                laneMap.set(commit.branch, nextLane++);
            }

            commit.lane = laneMap.get(commit.branch);
            commit.x = index * 120 + 80; // Increased spacing for better readability
            commit.y = commit.lane * 80 + 100; // Increased vertical spacing
            commit.shortHash = commit.hash.substring(0, 7); // Extract short hash
        });
    }

    inferBranch(commit) {
        if (commit.refs) {
            // Try to extract branch from refs
            const refMatch = commit.refs.match(/origin\/([^,\s]+)/);
            if (refMatch) return refMatch[1];

            const branchMatch = commit.refs.match(/([^\/\s,]+)$/);
            if (branchMatch) return branchMatch[1];
        }

        // Fallback to lane-based naming
        return `branch-${commit.graph_indent || 0}`;
    }

    updateStats() {
        const commits = this.getVisibleCommits();
        const branches = this.filteredData.branches;
        const authors = [...new Set(commits.map(c => c.author))];

        document.getElementById('totalCommits').textContent = this.data.commits.length;
        document.getElementById('totalBranches').textContent = branches.length;
        document.getElementById('totalAuthors').textContent = authors.length;
        document.getElementById('visibleCommits').textContent = commits.length;
    }

    getVisibleCommits() {
        return this.filteredData.commits.filter(commit => {
            // Branch filter
            if (!this.branchFilters[commit.branch]) return false;

            // Time filter
            if (this.timeFilter.from || this.timeFilter.to) {
                const commitDate = new Date(commit.date);
                if (this.timeFilter.from && commitDate < this.timeFilter.from) return false;
                if (this.timeFilter.to && commitDate > this.timeFilter.to) return false;
            }

            // Search filter
            if (this.searchTerm) {
                const searchLower = this.searchTerm.toLowerCase();
                return commit.hash.toLowerCase().includes(searchLower) ||
                    commit.message.toLowerCase().includes(searchLower) ||
                    commit.author.toLowerCase().includes(searchLower);
            }

            return true;
        });
    }

    updateBranchFilters() {
        const container = document.getElementById('branchFilters');
        container.innerHTML = '';

        // Count commits per branch
        const branchCommitCounts = {};
        this.data.commits.forEach(commit => {
            branchCommitCounts[commit.branch] = (branchCommitCounts[commit.branch] || 0) + 1;
        });

        this.data.branches.forEach(branch => {
            const filterDiv = document.createElement('div');
            filterDiv.className = 'branch-filter';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.branchFilters[branch.name];
            checkbox.addEventListener('change', () => this.toggleBranchFilter(branch.name, checkbox.checked));

            const label = document.createElement('span');
            label.className = 'branch-name';
            label.textContent = branch.name;

            const commitCount = document.createElement('span');
            commitCount.className = 'branch-commit-count';
            commitCount.textContent = branchCommitCounts[branch.name] || 0;

            const indicator = document.createElement('div');
            indicator.className = 'branch-indicator';
            indicator.style.backgroundColor = this.getBranchColor(branch.name);

            filterDiv.appendChild(checkbox);
            filterDiv.appendChild(label);
            filterDiv.appendChild(commitCount);
            filterDiv.appendChild(indicator);
            container.appendChild(filterDiv);
        });
    }

    updateTimeRange() {
        if (this.data.commits.length === 0) return;

        const dates = this.data.commits.map(c => new Date(c.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        document.getElementById('dateFrom').value = minDate.toISOString().split('T')[0];
        document.getElementById('dateTo').value = maxDate.toISOString().split('T')[0];
    }

    getBranchColor(branchName) {
        const lowerName = branchName.toLowerCase();
        for (const [key, color] of Object.entries(this.branchColors)) {
            if (lowerName.includes(key)) {
                return color;
            }
        }
        return '#5D878F';
    }

    render() {
        this.renderStartTime = performance.now();

        const svg = document.getElementById('gitGraph');

        // Clear SVG completely to prevent overlapping issues
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        const visibleCommits = this.getVisibleCommits();
        if (visibleCommits.length === 0) {
            this.renderEmptyState(svg);
            return;
        }

        // Enhanced bounds calculation with D3 scales
        const bounds = this.calculateBounds(visibleCommits);
        svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);

        // Create main group for transformations
        const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mainGroup.setAttribute('id', 'mainGroup');

        // Apply D3.js network layout if enabled
        if (this.forceEnabled && visibleCommits.length > 0) {
            this.applyD3ForceLayout(visibleCommits);
        }

        // Render components in proper order with enhanced visual fidelity
        this.renderBranchLines(mainGroup, visibleCommits);
        this.renderMergeLines(mainGroup, visibleCommits);
        this.renderCommits(mainGroup, visibleCommits);
        this.renderBranchLabels(mainGroup, visibleCommits);

        svg.appendChild(mainGroup);
        this.updateTransform();
        this.updateMinimap();

        // Enhanced performance tracking with D3
        const renderTime = performance.now() - this.renderStartTime;
        document.getElementById('renderTime').textContent = Math.round(renderTime) + 'ms';
        document.getElementById('visibleArea').textContent = `${Math.round((this.currentZoom * 100))}%`;
        
        // Apply D3 smooth transitions
        this.applyD3Transitions(mainGroup);
    }

    calculateBounds(commits) {
        if (commits.length === 0) return { width: 800, height: 600 };

        const maxX = Math.max(...commits.map(c => c.x)) + 100;
        const maxY = Math.max(...commits.map(c => c.y)) + 100;

        return {
            width: Math.max(maxX, 800),
            height: Math.max(maxY, 600)
        };
    }

    renderEmptyState(svg) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '400');
        text.setAttribute('y', '300');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'var(--font-family-base)');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', 'var(--color-text-secondary)');
        text.textContent = 'No commits match current filters';
        svg.appendChild(text);
    }

    renderBranchLines(container, commits) {
        const branches = {};

        // Group commits by branch
        commits.forEach(commit => {
            if (!branches[commit.branch]) {
                branches[commit.branch] = [];
            }
            branches[commit.branch].push(commit);
        });

        // Draw lines for each branch
        Object.entries(branches).forEach(([branchName, branchCommits]) => {
            if (branchCommits.length < 2) return;

            // Sort by x position
            branchCommits.sort((a, b) => a.x - b.x);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const path = branchCommits.map((commit, index) =>
                `${index === 0 ? 'M' : 'L'} ${commit.x} ${commit.y}`
            ).join(' ');

            line.setAttribute('d', path);
            line.setAttribute('class', 'branch-line');
            line.setAttribute('stroke', this.getBranchColor(branchName));
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-width', '2');
            container.appendChild(line);
        });
    }

    renderMergeLines(container, commits) {
        if (!this.filteredData.merges) return;

        this.filteredData.merges.forEach(merge => {
            const mergeCommit = commits.find(c => c.hash === merge.commit);
            if (!mergeCommit) return;

            merge.parents.forEach(parentHash => {
                const parentCommit = commits.find(c => c.hash === parentHash);
                if (!parentCommit || parentCommit.lane === mergeCommit.lane) return;

                // Draw curved merge line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const midX = (parentCommit.x + mergeCommit.x) / 2;
                const path = `M ${parentCommit.x} ${parentCommit.y} Q ${midX} ${parentCommit.y} ${mergeCommit.x} ${mergeCommit.y}`;

                line.setAttribute('d', path);
                line.setAttribute('class', 'branch-line merge-line');
                line.setAttribute('stroke', this.getBranchColor(mergeCommit.branch));
                line.setAttribute('fill', 'none');
                line.setAttribute('stroke-dasharray', '4,2');
                line.setAttribute('stroke-width', '1.5');
                container.appendChild(line);
            });
        });
    }

    renderCommits(container, commits) {
        commits.forEach(commit => {
            // Enhanced commit circle with D3-like scaling
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', commit.x);
            circle.setAttribute('cy', commit.y);
            
            // D3-inspired radius calculation with better visual fidelity
            const baseRadius = 6;
            const radius = Math.max(4, baseRadius / Math.sqrt(this.currentZoom));
            circle.setAttribute('r', radius);
            circle.setAttribute('class', 'commit-circle');
            
            // Enhanced color scheme with D3 interpolation concept
            const branchColor = this.getBranchColor(commit.branch);
            circle.setAttribute('fill', branchColor);
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', '2');
            
            // Add D3-style data binding
            circle.commitData = commit;

            // Enhanced event listeners with smooth animations
            circle.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                // Smooth scaling on hover
                circle.style.transition = 'all 0.2s ease-out';
                const currentRadius = parseFloat(circle.getAttribute('r'));
                circle.setAttribute('r', currentRadius * 1.3);
                circle.style.strokeWidth = '3px';
                this.showTooltip(e, commit);
            });
            
            circle.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                // Smooth scaling on leave
                circle.style.transition = 'all 0.2s ease-out';
                circle.setAttribute('r', radius);
                circle.style.strokeWidth = '2px';
                this.hideTooltip();
            });
            
            circle.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Click animation
                circle.style.transition = 'all 0.1s ease-out';
                const currentRadius = parseFloat(circle.getAttribute('r'));
                circle.setAttribute('r', currentRadius * 1.5);
                setTimeout(() => {
                    circle.setAttribute('r', radius);
                }, 100);
                this.showCommitModal(commit);
            });

            container.appendChild(circle);

            // Enhanced commit hash label with D3-style positioning
            if (this.currentZoom > 0.5) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', commit.x);
                text.setAttribute('y', commit.y - 15);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('class', 'commit-text');
                text.setAttribute('font-size', Math.max(8, 10 / Math.sqrt(this.currentZoom)));
                text.setAttribute('fill', 'var(--color-text)');
                text.setAttribute('font-family', 'var(--font-family-mono)');
                text.textContent = commit.shortHash;
                
                // Add smooth fade-in animation
                text.style.opacity = '0';
                text.style.transition = 'opacity 0.3s ease-in-out';
                container.appendChild(text);
                setTimeout(() => {
                    text.style.opacity = '1';
                }, 200);
            }
        });
    }

    renderBranchLabels(container, commits) {
        const lanes = [...new Set(commits.map(c => c.lane))].sort((a, b) => a - b);

        lanes.forEach(lane => {
            const laneCommits = commits.filter(c => c.lane === lane);
            if (laneCommits.length === 0) return;

            const branchName = laneCommits[0].branch;
            const y = lane * 80 + 100;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '20');
            text.setAttribute('y', y + 5);
            text.setAttribute('class', 'branch-label');
            text.setAttribute('fill', this.getBranchColor(branchName));
            text.setAttribute('font-family', 'var(--font-family-base)');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', '600');
            text.textContent = branchName;
            container.appendChild(text);
        });
    }

    // Event handlers
    toggleBranchFilter(branchName, enabled) {
        this.branchFilters[branchName] = enabled;
        this.render();
        this.updateStats();
    }

    selectAllBranches(select) {
        Object.keys(this.branchFilters).forEach(branch => {
            this.branchFilters[branch] = select;
        });
        this.updateBranchFilters();
        this.render();
        this.updateStats();
    }

    filterBranches(searchTerm) {
        const filters = document.querySelectorAll('.branch-filter');
        filters.forEach(filter => {
            const branchName = filter.querySelector('.branch-name').textContent;
            const matches = branchName.toLowerCase().includes(searchTerm.toLowerCase());
            filter.style.display = matches ? 'flex' : 'none';
        });
    }

    searchCommits(searchTerm) {
        this.searchTerm = searchTerm;
        this.render();
        this.updateStats();
    }

    applyTimeFilter() {
        const fromValue = document.getElementById('dateFrom').value;
        const toValue = document.getElementById('dateTo').value;

        this.timeFilter.from = fromValue ? new Date(fromValue) : null;
        this.timeFilter.to = toValue ? new Date(toValue + 'T23:59:59') : null;

        this.render();
        this.updateStats();
    }

    resetTimeFilter() {
        this.timeFilter = { from: null, to: null };
        this.updateTimeRange();
        this.render();
        this.updateStats();
    }

    // Zoom and navigation
    zoomIn() {
        this.zoom(1.3);
    }

    zoomOut() {
        this.zoom(0.7);
    }

    zoom(factor, centerX = null, centerY = null) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom * factor));

        if (centerX && centerY) {
            const rect = document.getElementById('gitGraph').getBoundingClientRect();
            const x = centerX - rect.left;
            const y = centerY - rect.top;

            this.panX = x - (x - this.panX) * (newZoom / this.currentZoom);
            this.panY = y - (y - this.panY) * (newZoom / this.currentZoom);
        }

        this.currentZoom = newZoom;
        this.updateZoomDisplay();
        this.updateTransform();
        this.render(); // Re-render to adjust text sizes
    }

    resetView() {
        this.currentZoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoomDisplay();
        this.updateTransform();
        this.render();
    }

    fitToScreen() {
        const visibleCommits = this.getVisibleCommits();
        if (visibleCommits.length === 0) return;

        const bounds = this.calculateBounds(visibleCommits);
        const container = document.getElementById('gitGraph').getBoundingClientRect();

        const scaleX = container.width / bounds.width;
        const scaleY = container.height / bounds.height;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, scale));
        this.panX = (container.width - bounds.width * this.currentZoom) / 2;
        this.panY = (container.height - bounds.height * this.currentZoom) / 2;

        this.updateZoomDisplay();
        this.updateTransform();
        this.render();
    }

    updateZoomDisplay() {
        const percentage = Math.round(this.currentZoom * 100);
        document.getElementById('zoomLevel').textContent = `${percentage}%`;
    }

    updateTransform() {
        const mainGroup = document.getElementById('mainGroup');
        if (mainGroup) {
            mainGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.currentZoom})`);
        }
    }

    // Minimap functionality
    updateMinimap() {
        // Simplified minimap implementation
        const minimap = document.getElementById('minimapSvg');
        const viewportRect = document.getElementById('viewportRect');

        // Update viewport rectangle
        const scale = 0.1;
        viewportRect.setAttribute('x', -this.panX * scale);
        viewportRect.setAttribute('y', -this.panY * scale);
        viewportRect.setAttribute('width', 800 / this.currentZoom * scale);
        viewportRect.setAttribute('height', 600 / this.currentZoom * scale);
    }

    handleMinimapClick(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.panX = -x * 10;
        this.panY = -y * 10;
        this.updateTransform();
        this.updateMinimap();
    }

    toggleForceLayout() {
        this.forceEnabled = !this.forceEnabled;
        const button = document.getElementById('forceToggle');
        
        if (this.forceEnabled) {
            button.textContent = 'Static Layout';
            button.classList.add('btn--primary');
            button.classList.remove('btn--outline');
        } else {
            button.textContent = 'Force Layout';
            button.classList.remove('btn--primary');
            button.classList.add('btn--outline');
        }
        
        this.render(); // Re-render with new layout mode
    }

    applyD3ForceLayout(commits) {
        // Prepare data for D3 force simulation
        const nodes = commits.map(commit => ({
            ...commit,
            fx: commit.x, // Fixed x position to maintain git flow
            fy: null      // Allow y to be adjusted by force
        }));

        const links = [];
        commits.forEach(commit => {
            if (commit.parents) {
                commit.parents.forEach(parentHash => {
                    const parent = commits.find(c => c.hash === parentHash);
                    if (parent) {
                        links.push({
                            source: parent.hash,
                            target: commit.hash
                        });
                    }
                });
            }
        });

        // Update simulation with current data
        this.d3Simulation
            .nodes(nodes)
            .force('link', d3.forceLink(links).id(d => d.hash).distance(60));

        // Let simulation run for a few ticks to improve layout
        this.d3Simulation.tick(50);

        // Update commit positions based on simulation
        nodes.forEach((node, index) => {
            if (commits[index]) {
                commits[index].y = Math.max(50, Math.min(550, node.y));
            }
        });
    }

    applyD3Transitions(mainGroup) {
        // Apply smooth transitions to all elements without D3 dependency
        const circles = mainGroup.querySelectorAll('circle');
        const paths = mainGroup.querySelectorAll('path');
        
        // Animate commit circles
        circles.forEach((circle, index) => {
            circle.style.transition = 'all 0.5s ease-in-out';
            circle.style.opacity = '0';
            setTimeout(() => {
                circle.style.opacity = '1';
            }, index * 50);
        });

        // Animate branch lines
        paths.forEach((path, index) => {
            path.style.transition = 'all 0.7s ease-in-out';
            path.style.opacity = '0';
            setTimeout(() => {
                path.style.opacity = '1';
            }, index * 100 + 200);
        });
    }

    // Enhanced Tooltip and modal with smooth animations
    showTooltip(event, commit) {
        const tooltip = document.getElementById('tooltip');

        // Enhanced tooltip content with better formatting
        document.getElementById('tooltipHash').textContent = commit.shortHash;
        document.getElementById('tooltipDate').textContent = new Date(commit.date).toLocaleDateString();
        document.getElementById('tooltipAuthor').textContent = commit.author;
        document.getElementById('tooltipMessage').textContent = commit.message;
        document.getElementById('tooltipBranch').textContent = commit.branch;
        document.getElementById('tooltipParents').textContent = commit.parents ? commit.parents.map(p => p.substring(0, 7)).join(', ') : 'None';

        // Enhanced positioning with better viewport handling
        const rect = event.target.getBoundingClientRect();
        
        let left = event.pageX + 10;
        let top = event.pageY - 10;
        
        // Prevent tooltip from going off-screen
        const tooltipRect = tooltip.getBoundingClientRect();
        if (left + 350 > window.innerWidth) { // Approximate tooltip width
            left = event.pageX - 350 - 10;
        }
        if (top + 150 > window.innerHeight) { // Approximate tooltip height
            top = event.pageY - 150 - 10;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        // Smooth fade-in animation
        tooltip.classList.remove('hidden');
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.2s ease-in-out';
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        
        // Smooth fade-out animation
        tooltip.style.transition = 'opacity 0.15s ease-in-out';
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.classList.add('hidden');
        }, 150);
    }

    showCommitModal(commit) {
        document.getElementById('modalHash').textContent = commit.hash;
        document.getElementById('modalShortHash').textContent = commit.shortHash;
        document.getElementById('modalAuthor').textContent = commit.author;
        document.getElementById('modalDate').textContent = new Date(commit.date).toLocaleString();
        document.getElementById('modalMessage').textContent = commit.message;
        document.getElementById('modalParents').textContent = commit.parents ? commit.parents.join(', ') : 'None';
        document.getElementById('modalRefs').textContent = commit.refs || 'None';
        document.getElementById('modalLane').textContent = `${commit.lane} (${commit.branch})`;

        document.getElementById('commitModal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('commitModal').classList.add('hidden');
    }

    // Utility functions
    handleKeyboard(event) {
        // Don't interfere with form inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '=':
            case '+':
                event.preventDefault();
                this.zoomIn();
                break;
            case '-':
                event.preventDefault();
                this.zoomOut();
                break;
            case '0':
                event.preventDefault();
                this.resetView();
                break;
            case 'f':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    document.getElementById('commitSearch').focus();
                }
                break;
            case 'Escape':
                this.hideModal();
                break;
        }
    }

    handleResize() {
        setTimeout(() => this.render(), 100);
    }

    exportSVG() {
        const svg = document.getElementById('gitGraph');
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.data.repository_info.path}-git-network.svg`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Loading and error states
    showLoading(message = 'Loading repository data...') {
        document.getElementById('loadingText').textContent = message;
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('loadingProgress').textContent = '0%';
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    updateProgress(percentage) {
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('loadingProgress').textContent = percentage + '%';
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('errorMessage').classList.add('hidden');
        }, 5000);
    }

    showSuccess(message) {
        document.getElementById('successText').textContent = message;
        document.getElementById('successMessage').classList.remove('hidden');
    }

    hideSuccess() {
        document.getElementById('successMessage').classList.add('hidden');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedGitVisualizer();
});