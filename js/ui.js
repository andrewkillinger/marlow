// UI Management
class UI {
    constructor() {
        this.currentMaterial = MaterialType.SAND;
        this.currentCategory = 'solid';
        this.brushSize = 3;
        this.isPanelOpen = false;
        this.currentTool = 'material'; // 'material', 'eraser', 'clear'

        this.initElements();
        this.initEventListeners();
        this.updateCurrentTool();
        this.renderMaterialPanel('solid');
    }

    initElements() {
        this.toolbar = document.getElementById('toolbar');
        this.materialPanel = document.getElementById('material-panel');
        this.materialGrid = document.getElementById('material-grid');
        this.currentToolIcon = document.getElementById('current-tool-icon');
        this.currentToolName = document.getElementById('current-tool-name');
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.brushIndicator = document.getElementById('brush-size-indicator');
    }

    initEventListeners() {
        // Category buttons
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                this.selectCategory(category);
            });
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isPanelOpen && !this.materialPanel.contains(e.target) && !this.toolbar.contains(e.target)) {
                this.closePanel();
            }
        });
    }

    selectCategory(category) {
        // Update active state
        this.categoryBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.currentCategory = category;

        if (this.isPanelOpen && this.currentCategory === category) {
            this.closePanel();
        } else {
            this.openPanel();
            this.renderMaterialPanel(category);
        }
    }

    openPanel() {
        this.materialPanel.classList.remove('hidden');
        this.isPanelOpen = true;
    }

    closePanel() {
        this.materialPanel.classList.add('hidden');
        this.isPanelOpen = false;
    }

    renderMaterialPanel(category) {
        this.materialGrid.innerHTML = '';

        const items = MaterialCategories[category];
        if (!items) return;

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'material-btn';

            if (typeof item === 'string') {
                // Tool (eraser, clear)
                btn.innerHTML = `
                    <div class="material-preview material-${item}"></div>
                    <span class="material-name">${item.charAt(0).toUpperCase() + item.slice(1)}</span>
                `;
                btn.addEventListener('click', () => this.selectTool(item));
            } else {
                // Material
                const material = Materials[item];
                btn.innerHTML = `
                    <div class="material-preview material-${material.name.toLowerCase()}"></div>
                    <span class="material-name">${material.name}</span>
                `;
                if (this.currentMaterial === item && this.currentTool === 'material') {
                    btn.classList.add('selected');
                }
                btn.addEventListener('click', () => this.selectMaterial(item));
            }

            this.materialGrid.appendChild(btn);
        });
    }

    selectMaterial(type) {
        this.currentMaterial = type;
        this.currentTool = 'material';
        this.updateCurrentTool();
        this.closePanel();
        this.renderMaterialPanel(this.currentCategory);
    }

    selectTool(tool) {
        if (tool === 'clear') {
            // Clear the canvas
            if (window.game && window.game.engine) {
                window.game.engine.clear();
            }
            this.closePanel();
            return;
        }

        this.currentTool = tool;
        this.updateCurrentTool();
        this.closePanel();
        this.renderMaterialPanel(this.currentCategory);
    }

    updateCurrentTool() {
        if (this.currentTool === 'eraser') {
            this.currentToolIcon.className = '';
            this.currentToolIcon.style.background = 'linear-gradient(135deg, #ff5252, #d32f2f)';
            this.currentToolName.textContent = 'Eraser';
        } else {
            const material = Materials[this.currentMaterial];
            this.currentToolIcon.className = '';
            this.currentToolIcon.classList.add(`material-${material.name.toLowerCase()}`);
            this.currentToolIcon.style.background = '';
            this.currentToolName.textContent = material.name;
        }
    }

    showBrushIndicator(x, y) {
        const size = this.brushSize * (window.game?.engine?.pixelSize || 4);
        this.brushIndicator.style.width = `${size * 2}px`;
        this.brushIndicator.style.height = `${size * 2}px`;
        this.brushIndicator.style.left = `${x}px`;
        this.brushIndicator.style.top = `${y}px`;
        this.brushIndicator.classList.add('visible');
    }

    hideBrushIndicator() {
        this.brushIndicator.classList.remove('visible');
    }

    setBrushSize(size) {
        this.brushSize = Math.max(1, Math.min(20, size));
    }
}
