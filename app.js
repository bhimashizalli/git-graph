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

        // Filtering state
        this.branchFilters = {};
        this.searchTerm = '';
        this.timeFilter = { from: null, to: null };

        // D3.js integration
        this.svg = null;
        this.mainGroup = null;
        this.selectedCommit = null;
        this.tooltip = null;

        // Enhanced layout settings
        this.layoutSettings = {
            commitSpacing: 120,
            branchSpacing: 80,
            nodeRadius: 6,
            animationDuration: 300
        };

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
        this.initializeD3();
        this.loadSampleData();
        this.bindEvents();
        this.setupSVGInteractions();
        this.initializeMinimap();
    }

    initializeD3() {
        // Check if D3.js is available
        if (typeof d3 !== 'undefined') {
            // Initialize D3 SVG selection
            this.svg = d3.select('#gitGraph');
            
            // Setup tooltip with D3
            this.tooltip = d3.select('body')
                .append('div')
                .attr('class', 'd3-tooltip')
                .style('opacity', 0)
                .style('position', 'absolute')
                .style('background-color', 'var(--color-surface)')
                .style('border', '1px solid var(--color-border)')
                .style('border-radius', 'var(--radius-base)')
                .style('padding', 'var(--space-8)')
                .style('box-shadow', 'var(--shadow-md)')
                .style('z-index', '1000')
                .style('pointer-events', 'none');
                
            this.d3Available = true;
        } else {
            console.warn('D3.js not available, falling back to vanilla JS implementation');
            this.d3Available = false;
            this.svg = document.getElementById('gitGraph');
        }
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
            commit.x = index * this.layoutSettings.commitSpacing + 80; // Enhanced spacing
            commit.y = commit.lane * this.layoutSettings.branchSpacing + 100; // Enhanced vertical spacing
            commit.shortHash = commit.hash.substring(0, 7); // Extract short hash
        });

        // Apply D3 force simulation for improved network layout
        this.enhanceLayoutWithD3();
    }

    enhanceLayoutWithD3() {
        // Only run D3.js enhancement if D3.js is available
        if (!this.d3Available) {
            console.log('D3.js not available, skipping enhanced layout');
            return;
        }

        const commits = this.filteredData.commits;
        
        // Create links between connected commits
        const links = [];
        commits.forEach(commit => {
            if (commit.parents) {
                commit.parents.forEach(parentHash => {
                    const parent = commits.find(c => c.hash === parentHash);
                    if (parent) {
                        links.push({
                            source: parent,
                            target: commit
                        });
                    }
                });
            }
        });

        // Apply subtle force simulation to improve visual arrangement
        const simulation = d3.forceSimulation(commits)
            .force('link', d3.forceLink(links).id(d => d.hash).distance(this.layoutSettings.commitSpacing * 0.8))
            .force('charge', d3.forceManyBody().strength(-50))
            .force('center', d3.forceCenter(400, 300))
            .force('y', d3.forceY(d => d.lane * this.layoutSettings.branchSpacing + 100).strength(0.8))
            .force('x', d3.forceX().strength(0.1))
            .stop();

        // Run simulation for a few iterations to improve layout without full animation
        for (let i = 0; i < 100; ++i) simulation.tick();
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

        const visibleCommits = this.getVisibleCommits();
        if (visibleCommits.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Calculate bounds
        const bounds = this.calculateBounds(visibleCommits);
        
        if (this.d3Available) {
            // Use D3.js enhanced rendering
            this.svg.attr('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
            
            // Clear and recreate main group with D3
            this.svg.selectAll('*').remove();
            this.mainGroup = this.svg.append('g').attr('id', 'mainGroup');

            // Render components with D3 in proper order
            this.renderBranchLinesD3(visibleCommits);
            this.renderMergeLinesD3(visibleCommits);
            this.renderCommitsD3(visibleCommits);
            this.renderBranchLabelsD3(visibleCommits);
        } else {
            // Fall back to vanilla JS rendering with enhancements
            this.svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
            
            // Clear SVG completely to prevent overlapping issues
            while (this.svg.firstChild) {
                this.svg.removeChild(this.svg.firstChild);
            }

            // Create main group for transformations
            const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            mainGroup.setAttribute('id', 'mainGroup');
            this.mainGroup = mainGroup;

            // Render components in proper order
            this.renderBranchLinesEnhanced(mainGroup, visibleCommits);
            this.renderMergeLinesEnhanced(mainGroup, visibleCommits);
            this.renderCommitsEnhanced(mainGroup, visibleCommits);
            this.renderBranchLabelsEnhanced(mainGroup, visibleCommits);

            this.svg.appendChild(mainGroup);
        }

        this.updateTransform();
        this.updateMinimap();

        // Update performance info
        const renderTime = performance.now() - this.renderStartTime;
        document.getElementById('renderTime').textContent = Math.round(renderTime) + 'ms';
        document.getElementById('visibleArea').textContent = `${Math.round((this.currentZoom * 100))}%`;
    }

    renderEmptyState() {
        if (this.d3Available) {
            this.svg.selectAll('*').remove();
            this.svg.append('text')
                .attr('x', 400)
                .attr('y', 300)
                .attr('text-anchor', 'middle')
                .attr('font-family', 'var(--font-family-base)')
                .attr('font-size', '16')
                .attr('fill', 'var(--color-text-secondary)')
                .text('No commits match current filters');
        } else {
            while (this.svg.firstChild) {
                this.svg.removeChild(this.svg.firstChild);
            }
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '400');
            text.setAttribute('y', '300');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'var(--font-family-base)');
            text.setAttribute('font-size', '16');
            text.setAttribute('fill', 'var(--color-text-secondary)');
            text.textContent = 'No commits match current filters';
            this.svg.appendChild(text);
        }
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

    // Enhanced D3.js rendering methods
    renderCommitsD3(commits) {
        if (!this.d3Available) return;

        const commitGroup = this.mainGroup.append('g').attr('class', 'commits');

        // Bind data and create circles
        const circles = commitGroup.selectAll('.commit-circle')
            .data(commits, d => d.hash);

        // Enter selection with transitions
        const circlesEnter = circles.enter()
            .append('circle')
            .attr('class', 'commit-circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 0)
            .attr('fill', d => this.getBranchColor(d.branch))
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

        // Add interactions with enhanced tooltip
        circlesEnter
            .on('mouseenter', (event, d) => {
                this.showEnhancedTooltip(event, d);
                // Highlight connected commits
                this.highlightConnectedCommits(d);
            })
            .on('mouseleave', () => {
                this.hideEnhancedTooltip();
                this.removeHighlights();
            })
            .on('click', (event, d) => {
                event.stopPropagation();
                this.selectCommit(d);
                this.showCommitModal(d);
            });

        // Animate circles to full size
        circlesEnter
            .transition()
            .duration(this.layoutSettings.animationDuration)
            .attr('r', Math.max(4, this.layoutSettings.nodeRadius / Math.sqrt(this.currentZoom)));

        // Add commit labels for better zoom levels
        if (this.currentZoom > 0.5) {
            const labels = commitGroup.selectAll('.commit-text')
                .data(commits, d => d.hash);

            labels.enter()
                .append('text')
                .attr('class', 'commit-text')
                .attr('x', d => d.x)
                .attr('y', d => d.y - 15)
                .attr('text-anchor', 'middle')
                .attr('font-size', Math.max(8, 10 / Math.sqrt(this.currentZoom)))
                .attr('fill', 'var(--color-text)')
                .attr('font-family', 'var(--font-family-mono)')
                .style('opacity', 0)
                .text(d => d.shortHash)
                .transition()
                .duration(this.layoutSettings.animationDuration)
                .style('opacity', 1);
        }
    }

    renderBranchLinesD3(commits) {
        if (!this.d3Available) return;

        const branches = {};

        // Group commits by branch
        commits.forEach(commit => {
            if (!branches[commit.branch]) {
                branches[commit.branch] = [];
            }
            branches[commit.branch].push(commit);
        });

        const lineGroup = this.mainGroup.append('g').attr('class', 'branch-lines');

        // Draw lines for each branch with D3
        Object.entries(branches).forEach(([branchName, branchCommits]) => {
            if (branchCommits.length < 2) return;

            // Sort by x position
            branchCommits.sort((a, b) => a.x - b.x);

            const lineGenerator = d3.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveLinear);

            lineGroup.append('path')
                .datum(branchCommits)
                .attr('class', 'branch-line')
                .attr('d', lineGenerator)
                .attr('stroke', this.getBranchColor(branchName))
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .style('opacity', 0)
                .transition()
                .duration(this.layoutSettings.animationDuration)
                .style('opacity', 1);
        });
    }

    renderMergeLinesD3(commits) {
        if (!this.d3Available) return;
        if (!this.filteredData.merges) return;

        const mergeGroup = this.mainGroup.append('g').attr('class', 'merge-lines');

        this.filteredData.merges.forEach(merge => {
            const mergeCommit = commits.find(c => c.hash === merge.commit);
            if (!mergeCommit) return;

            merge.parents.forEach(parentHash => {
                const parentCommit = commits.find(c => c.hash === parentHash);
                if (!parentCommit || parentCommit.lane === mergeCommit.lane) return;

                // Create curved merge line with D3
                const curveGenerator = d3.line()
                    .x(d => d.x)
                    .y(d => d.y)
                    .curve(d3.curveCardinal);

                const midX = (parentCommit.x + mergeCommit.x) / 2;
                const curveData = [
                    { x: parentCommit.x, y: parentCommit.y },
                    { x: midX, y: parentCommit.y },
                    { x: mergeCommit.x, y: mergeCommit.y }
                ];

                mergeGroup.append('path')
                    .datum(curveData)
                    .attr('class', 'branch-line merge-line')
                    .attr('d', curveGenerator)
                    .attr('stroke', this.getBranchColor(mergeCommit.branch))
                    .attr('fill', 'none')
                    .attr('stroke-dasharray', '4,2')
                    .attr('stroke-width', 1.5)
                    .style('opacity', 0)
                    .transition()
                    .duration(this.layoutSettings.animationDuration)
                    .style('opacity', 0.7);
            });
        });
    }

    renderBranchLabelsD3(commits) {
        if (!this.d3Available) return;

        const lanes = [...new Set(commits.map(c => c.lane))].sort((a, b) => a - b);
        const labelGroup = this.mainGroup.append('g').attr('class', 'branch-labels');

        const labels = labelGroup.selectAll('.branch-label')
            .data(lanes.map(lane => {
                const laneCommits = commits.filter(c => c.lane === lane);
                return {
                    lane,
                    branchName: laneCommits[0]?.branch,
                    y: lane * this.layoutSettings.branchSpacing + 100
                };
            }));

        labels.enter()
            .append('text')
            .attr('class', 'branch-label')
            .attr('x', 20)
            .attr('y', d => d.y + 5)
            .attr('fill', d => this.getBranchColor(d.branchName))
            .attr('font-family', 'var(--font-family-base)')
            .attr('font-size', '11')
            .attr('font-weight', '600')
            .style('opacity', 0)
            .text(d => d.branchName)
            .transition()
            .duration(this.layoutSettings.animationDuration)
            .style('opacity', 1);
    }

    // Enhanced vanilla JS rendering methods (D3.js fallback)
    renderCommitsEnhanced(container, commits) {
        commits.forEach(commit => {
            // Commit circle with enhanced styling
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', commit.x);
            circle.setAttribute('cy', commit.y);
            circle.setAttribute('r', Math.max(4, this.layoutSettings.nodeRadius / Math.sqrt(this.currentZoom)));
            circle.setAttribute('class', 'commit-circle');
            circle.setAttribute('fill', this.getBranchColor(commit.branch));
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', '2');
            circle.style.cursor = 'pointer';

            // Store commit data
            circle.commitData = commit;

            // Enhanced event listeners
            circle.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                this.showEnhancedTooltipVanilla(e, commit);
                this.highlightConnectedCommitsVanilla(commit);
            });
            circle.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                this.hideEnhancedTooltipVanilla();
                this.removeHighlightsVanilla();
            });
            circle.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectCommitVanilla(commit);
                this.showCommitModal(commit);
            });

            container.appendChild(circle);

            // Commit hash label with better zoom handling
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
                container.appendChild(text);
            }
        });
    }

    renderBranchLinesEnhanced(container, commits) {
        const branches = {};

        // Group commits by branch
        commits.forEach(commit => {
            if (!branches[commit.branch]) {
                branches[commit.branch] = [];
            }
            branches[commit.branch].push(commit);
        });

        // Draw enhanced lines for each branch
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
            line.style.transition = 'opacity 250ms ease';
            container.appendChild(line);
        });
    }

    renderMergeLinesEnhanced(container, commits) {
        if (!this.filteredData.merges) return;

        this.filteredData.merges.forEach(merge => {
            const mergeCommit = commits.find(c => c.hash === merge.commit);
            if (!mergeCommit) return;

            merge.parents.forEach(parentHash => {
                const parentCommit = commits.find(c => c.hash === parentHash);
                if (!parentCommit || parentCommit.lane === mergeCommit.lane) return;

                // Enhanced curved merge line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const midX = (parentCommit.x + mergeCommit.x) / 2;
                const path = `M ${parentCommit.x} ${parentCommit.y} Q ${midX} ${parentCommit.y} ${mergeCommit.x} ${mergeCommit.y}`;

                line.setAttribute('d', path);
                line.setAttribute('class', 'branch-line merge-line');
                line.setAttribute('stroke', this.getBranchColor(mergeCommit.branch));
                line.setAttribute('fill', 'none');
                line.setAttribute('stroke-dasharray', '4,2');
                line.setAttribute('stroke-width', '1.5');
                line.style.opacity = '0.7';
                line.style.transition = 'opacity 250ms ease';
                container.appendChild(line);
            });
        });
    }

    renderBranchLabelsEnhanced(container, commits) {
        const lanes = [...new Set(commits.map(c => c.lane))].sort((a, b) => a - b);

        lanes.forEach(lane => {
            const laneCommits = commits.filter(c => c.lane === lane);
            if (laneCommits.length === 0) return;

            const branchName = laneCommits[0].branch;
            const y = lane * this.layoutSettings.branchSpacing + 100;

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

    // Enhanced interaction methods
    selectCommit(commit) {
        if (this.d3Available) {
            // Remove previous selection
            this.mainGroup.selectAll('.commit-circle')
                .classed('selected', false)
                .attr('stroke-width', 2);

            // Add selection to current commit
            this.mainGroup.selectAll('.commit-circle')
                .filter(d => d.hash === commit.hash)
                .classed('selected', true)
                .attr('stroke-width', 4)
                .attr('stroke', '#FFD700');
        } else {
            this.selectCommitVanilla(commit);
        }
        this.selectedCommit = commit;
    }

    selectCommitVanilla(commit) {
        // Remove previous selection
        const allCircles = this.mainGroup.querySelectorAll('.commit-circle');
        allCircles.forEach(circle => {
            circle.classList.remove('selected');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('stroke', '#ffffff');
        });

        // Add selection to current commit
        allCircles.forEach(circle => {
            if (circle.commitData && circle.commitData.hash === commit.hash) {
                circle.classList.add('selected');
                circle.setAttribute('stroke-width', '4');
                circle.setAttribute('stroke', '#FFD700');
            }
        });
    }

    highlightConnectedCommits(commit) {
        if (this.d3Available) {
            const connectedHashes = new Set([commit.hash]);
            
            // Add parents
            if (commit.parents) {
                commit.parents.forEach(parent => connectedHashes.add(parent));
            }
            
            // Add children
            this.filteredData.commits.forEach(c => {
                if (c.parents && c.parents.includes(commit.hash)) {
                    connectedHashes.add(c.hash);
                }
            });

            // Apply highlighting
            this.mainGroup.selectAll('.commit-circle')
                .style('opacity', d => connectedHashes.has(d.hash) ? 1 : 0.3);

            this.mainGroup.selectAll('.branch-line')
                .style('opacity', 0.2);
        } else {
            this.highlightConnectedCommitsVanilla(commit);
        }
    }

    highlightConnectedCommitsVanilla(commit) {
        const connectedHashes = new Set([commit.hash]);
        
        // Add parents
        if (commit.parents) {
            commit.parents.forEach(parent => connectedHashes.add(parent));
        }
        
        // Add children
        this.filteredData.commits.forEach(c => {
            if (c.parents && c.parents.includes(commit.hash)) {
                connectedHashes.add(c.hash);
            }
        });

        // Apply highlighting with vanilla JS
        const allCircles = this.mainGroup.querySelectorAll('.commit-circle');
        allCircles.forEach(circle => {
            if (circle.commitData) {
                circle.style.opacity = connectedHashes.has(circle.commitData.hash) ? '1' : '0.3';
            }
        });

        const allLines = this.mainGroup.querySelectorAll('.branch-line');
        allLines.forEach(line => {
            line.style.opacity = '0.2';
        });
    }

    removeHighlights() {
        if (this.d3Available) {
            this.mainGroup.selectAll('.commit-circle')
                .style('opacity', 1);
            this.mainGroup.selectAll('.branch-line')
                .style('opacity', 1);
        } else {
            this.removeHighlightsVanilla();
        }
    }

    removeHighlightsVanilla() {
        const allCircles = this.mainGroup.querySelectorAll('.commit-circle');
        allCircles.forEach(circle => {
            circle.style.opacity = '1';
        });

        const allLines = this.mainGroup.querySelectorAll('.branch-line');
        allLines.forEach(line => {
            line.style.opacity = '1';
        });
    }

    showEnhancedTooltip(event, commit) {
        if (this.d3Available) {
            const tooltip = this.tooltip;
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.95);

            const content = `
                <div style="font-weight: 600; margin-bottom: 4px;">${commit.shortHash}</div>
                <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">
                    ${new Date(commit.date).toLocaleDateString()}
                </div>
                <div style="margin-bottom: 4px;"><strong>Author:</strong> ${commit.author}</div>
                <div style="margin-bottom: 4px;"><strong>Branch:</strong> ${commit.branch}</div>
                <div style="margin-bottom: 4px;"><strong>Message:</strong></div>
                <div style="font-size: 12px; max-width: 200px;">${commit.message}</div>
                ${commit.parents ? `<div style="font-size: 11px; margin-top: 8px; color: var(--color-text-secondary);">
                    Parents: ${commit.parents.map(p => p.substring(0, 7)).join(', ')}
                </div>` : ''}
            `;

            tooltip.html(content)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        } else {
            this.showEnhancedTooltipVanilla(event, commit);
        }
    }

    showEnhancedTooltipVanilla(event, commit) {
        // Create enhanced tooltip if it doesn't exist
        let tooltip = document.querySelector('.enhanced-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'enhanced-tooltip d3-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'var(--color-surface)';
            tooltip.style.border = '1px solid var(--color-border)';
            tooltip.style.borderRadius = 'var(--radius-base)';
            tooltip.style.padding = 'var(--space-8)';
            tooltip.style.boxShadow = 'var(--shadow-md)';
            tooltip.style.zIndex = '1000';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 200ms ease';
            document.body.appendChild(tooltip);
        }

        const content = `
            <div style="font-weight: 600; margin-bottom: 4px;">${commit.shortHash}</div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">
                ${new Date(commit.date).toLocaleDateString()}
            </div>
            <div style="margin-bottom: 4px;"><strong>Author:</strong> ${commit.author}</div>
            <div style="margin-bottom: 4px;"><strong>Branch:</strong> ${commit.branch}</div>
            <div style="margin-bottom: 4px;"><strong>Message:</strong></div>
            <div style="font-size: 12px; max-width: 200px;">${commit.message}</div>
            ${commit.parents ? `<div style="font-size: 11px; margin-top: 8px; color: var(--color-text-secondary);">
                Parents: ${commit.parents.map(p => p.substring(0, 7)).join(', ')}
            </div>` : ''}
        `;

        tooltip.innerHTML = content;
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.style.opacity = '0.95';
    }

    hideEnhancedTooltip() {
        if (this.d3Available) {
            this.tooltip.transition()
                .duration(300)
                .style('opacity', 0);
        } else {
            this.hideEnhancedTooltipVanilla();
        }
    }

    hideEnhancedTooltipVanilla() {
        const tooltip = document.querySelector('.enhanced-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
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

    // Tooltip and modal
    showTooltip(event, commit) {
        const tooltip = document.getElementById('tooltip');

        document.getElementById('tooltipHash').textContent = commit.shortHash;
        document.getElementById('tooltipDate').textContent = new Date(commit.date).toLocaleDateString();
        document.getElementById('tooltipAuthor').textContent = commit.author;
        document.getElementById('tooltipMessage').textContent = commit.message;
        document.getElementById('tooltipBranch').textContent = commit.branch;
        document.getElementById('tooltipParents').textContent = commit.parents ? commit.parents.map(p => p.substring(0, 7)).join(', ') : 'None';

        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.add('hidden');
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