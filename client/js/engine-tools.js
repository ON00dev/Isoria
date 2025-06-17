// Isoria Engine Tools - Interface Visual para Framework de Scripts
// Sistema integrado de desenvolvimento visual e por código

class EngineTools {
    constructor() {
        this.currentMode = 'visual';
        this.selectedObject = null;
        this.isRunning = false;
        this.engine = window.IsoriaEngineInstance;
        this.resizers = new Map();
        this.panels = new Map();
        this.activeTab = 'scene';
        this.activeTool = 'select';
        
        this.initializeInterface();
        this.initializeEventListeners();
        this.initializeResizers();
        this.loadDocumentation();
    }

    initializeInterface() {
        this.setupPanels();
        this.setupTabs();
        this.setupTools();
        this.setupInspector();
        this.setupConsole();
        this.updateInterface();
    }

    initializeEventListeners() {
        this.setupHeaderControls();
        this.setupHierarchyEvents();
        this.setupAssetsEvents();
        this.setupPreviewEvents();
        this.setupInspectorEvents();
        this.setupToolsEvents();
        this.setupConsoleEvents();
        this.setupKeyboardShortcuts();
     }

     setupKeyboardShortcuts() {
         document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S - Salvar
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
            
            // Ctrl/Cmd + O - Abrir
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.openProject();
            }
            
            // Ctrl/Cmd + Z - Desfazer
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl/Cmd + Y - Refazer
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
            
            // Delete - Deletar objeto selecionado
            if (e.key === 'Delete' && this.selectedObject) {
                this.deleteSelectedObject();
            }
            
            // F5 - Play/Pause
            if (e.key === 'F5') {
                e.preventDefault();
                this.togglePlayPause();
            }
            
            // Escape - Deselecionar
            if (e.key === 'Escape') {
                this.deselectAll();
            }
        });
    }
    
    // Métodos auxiliares para funcionalidades da interface
    switchPreviewTab(tabName) {
        document.querySelectorAll('.preview-tabs .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = Array.from(document.querySelectorAll('.preview-tabs .tab'))
            .find(tab => tab.textContent.toLowerCase() === tabName);
        
        if (activeTab) {
            activeTab.classList.add('active');
            this.logMessage(`Aba do preview alterada para: ${tabName}`);
        }
    }
    
    switchBottomTab(tabName) {
        document.querySelectorAll('.panel-tabs .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = Array.from(document.querySelectorAll('.panel-tabs .tab'))
            .find(tab => tab.textContent.toLowerCase() === tabName);
        
        if (activeTab) {
            activeTab.classList.add('active');
            this.logMessage(`Aba do painel inferior alterada para: ${tabName}`);
        }
    }
    
    selectTool(toolName, btnElement) {
        // Remover seleção anterior
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Selecionar ferramenta atual
        btnElement.classList.add('active');
        this.currentTool = toolName;
        this.logMessage(`Ferramenta selecionada: ${toolName}`);
    }
    
    selectPreviewTool(toolId) {
        // Remover seleção anterior
        document.querySelectorAll('.preview-controls .btn-icon').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Selecionar ferramenta atual
        const btn = document.getElementById(toolId);
        if (btn) {
            btn.classList.add('active');
            this.logMessage(`Ferramenta de preview selecionada: ${toolId}`);
        }
    }
    
    updateObjectProperty(element) {
        const property = element.name || element.id;
        const value = element.type === 'checkbox' ? element.checked : element.value;
        
        if (this.selectedObject) {
            this.logMessage(`Propriedade ${property} do objeto ${this.selectedObject} alterada para: ${value}`);
        }
    }
    
    updateInspector(objectName) {
        // Simular atualização do inspector com dados do objeto
        const positionInputs = document.querySelectorAll('.vector-input input');
        if (positionInputs.length >= 3) {
            positionInputs[0].value = Math.random() * 10;
            positionInputs[1].value = Math.random() * 10;
            positionInputs[2].value = Math.random() * 10;
        }
        
        this.logMessage(`Inspector atualizado para: ${objectName}`);
    }
    
    filterAssets(searchTerm) {
        const assets = document.querySelectorAll('.asset-item');
        assets.forEach(asset => {
            const assetName = asset.querySelector('.asset-name').textContent.toLowerCase();
            const matches = assetName.includes(searchTerm.toLowerCase());
            asset.style.display = matches ? 'block' : 'none';
        });
        
        this.logMessage(`Filtro de assets aplicado: "${searchTerm}"`);
    }
    
    addObjectToScene(assetName) {
        // Simular adição de objeto à cena
        const hierarchy = document.querySelector('.hierarchy-tree');
        if (hierarchy) {
            const newItem = document.createElement('div');
            newItem.className = 'tree-item';
            newItem.innerHTML = `<span class="tree-icon">📦</span> ${assetName}_${Date.now()}`;
            hierarchy.appendChild(newItem);
            
            // Adicionar eventos ao novo item
            newItem.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
                newItem.classList.add('selected');
                this.selectedObject = newItem.textContent.trim();
                this.updateInspector(this.selectedObject);
            });
        }
    }
    
    updatePlayControls() {
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        
        if (this.isRunning) {
            if (playBtn) playBtn.classList.add('active');
            if (pauseBtn) pauseBtn.classList.remove('active');
        } else {
            if (playBtn) playBtn.classList.remove('active');
            if (pauseBtn) pauseBtn.classList.add('active');
        }
    }
    
    // Métodos para atalhos de teclado
    saveProject() {
        this.logMessage('Projeto salvo', 'info');
    }
    
    openProject() {
        this.logMessage('Abrindo projeto...', 'info');
    }
    
    undo() {
        this.logMessage('Desfazer última ação', 'warning');
    }
    
    redo() {
        this.logMessage('Refazer última ação', 'warning');
    }
    
    deleteSelectedObject() {
        if (this.selectedObject) {
            this.logMessage(`Objeto ${this.selectedObject} deletado`, 'error');
            const selectedElement = document.querySelector('.tree-item.selected');
            if (selectedElement) {
                selectedElement.remove();
            }
            this.selectedObject = null;
        }
    }
    
    togglePlayPause() {
        this.isRunning = !this.isRunning;
        this.logMessage(this.isRunning ? 'Jogo iniciado' : 'Jogo pausado', this.isRunning ? 'info' : 'warning');
        this.updatePlayControls();
    }
    
    deselectAll() {
        document.querySelectorAll('.tree-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.asset-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        this.selectedObject = null;
        this.logMessage('Seleção removida');
    }

    setupHeaderControls() {
        // Controles de reprodução
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isRunning = true;
                this.logMessage('Jogo iniciado', 'info');
                this.updatePlayControls();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.isRunning = false;
                this.logMessage('Jogo pausado', 'warning');
                this.updatePlayControls();
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.isRunning = false;
                this.logMessage('Jogo parado', 'error');
                this.updatePlayControls();
            });
        }
    }

    setupHierarchyEvents() {
        // Eventos da árvore de hierarquia
        document.querySelectorAll('.tree-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remover seleção anterior
                document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
                
                // Selecionar item atual
                item.classList.add('selected');
                
                const objectName = item.textContent.trim();
                this.selectedObject = objectName;
                this.logMessage(`Objeto selecionado: ${objectName}`);
                this.updateInspector(objectName);
            });
            
            // Toggle de expansão para itens com filhos
            const toggle = item.querySelector('.tree-toggle');
            if (toggle) {
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const children = item.querySelector('.tree-children');
                    if (children) {
                        const isExpanded = children.style.display !== 'none';
                        children.style.display = isExpanded ? 'none' : 'block';
                        toggle.textContent = isExpanded ? '▶' : '▼';
                    }
                });
            }
        });
    }

    setupAssetsEvents() {
        // Eventos do painel de assets
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAssets(e.target.value);
            });
        }
        
        // Eventos dos assets
        document.querySelectorAll('.asset-item').forEach(asset => {
            asset.addEventListener('click', (e) => {
                // Remover seleção anterior
                document.querySelectorAll('.asset-item').forEach(a => a.classList.remove('selected'));
                
                // Selecionar asset atual
                asset.classList.add('selected');
                
                const assetName = asset.querySelector('.asset-name').textContent;
                this.logMessage(`Asset selecionado: ${assetName}`);
            });
            
            // Drag and drop
            asset.addEventListener('dragstart', (e) => {
                const assetName = asset.querySelector('.asset-name').textContent;
                e.dataTransfer.setData('text/plain', assetName);
                this.logMessage(`Iniciando drag: ${assetName}`);
            });
        });
    }

    setupPreviewEvents() {
        // Eventos do viewport 3D
        const viewport = document.getElementById('viewport');
        if (viewport) {
            let isDragging = false;
            let lastMouseX = 0;
            let lastMouseY = 0;
            
            viewport.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                viewport.style.cursor = 'grabbing';
            });
            
            viewport.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const deltaX = e.clientX - lastMouseX;
                    const deltaY = e.clientY - lastMouseY;
                    
                    // Simular rotação da câmera
                    this.logMessage(`Rotação da câmera: X=${deltaX}, Y=${deltaY}`);
                    
                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;
                }
            });
            
            viewport.addEventListener('mouseup', () => {
                isDragging = false;
                viewport.style.cursor = 'grab';
            });
            
            viewport.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoom = e.deltaY > 0 ? 'out' : 'in';
                this.logMessage(`Zoom ${zoom}`);
            });
            
            // Drop de assets no viewport
            viewport.addEventListener('dragover', (e) => {
                e.preventDefault();
                viewport.classList.add('drag-over');
            });
            
            viewport.addEventListener('dragleave', () => {
                viewport.classList.remove('drag-over');
            });
            
            viewport.addEventListener('drop', (e) => {
                e.preventDefault();
                viewport.classList.remove('drag-over');
                
                const assetName = e.dataTransfer.getData('text/plain');
                this.logMessage(`Asset ${assetName} adicionado à cena`, 'info');
                this.addObjectToScene(assetName);
            });
        }
    }

    initializeResizers() {
        this.createResizer('.sidebar-left', 'right', 200, 500);
        this.createResizer('.sidebar-right', 'left', 200, 500);
        this.createResizer('.bottom-panel', 'top', 100, 400);
    }

    loadDocumentation() {
        // Placeholder for documentation loading
    }

    setupPanels() {
        // Configurar painéis colapsáveis
        document.querySelectorAll('.panel-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const panel = e.target.closest('.panel');
                const content = panel.querySelector('.panel-content');
                const isCollapsed = content.style.display === 'none';
                
                content.style.display = isCollapsed ? 'block' : 'none';
                e.target.textContent = isCollapsed ? '−' : '+';
                
                this.logMessage(`Painel ${isCollapsed ? 'expandido' : 'colapsado'}`);
            });
        });
    }

    setupTabs() {
        // Configurar abas do preview
        document.querySelectorAll('.preview-tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.textContent.toLowerCase();
                this.switchPreviewTab(tabName);
            });
        });
        
        // Configurar abas do painel inferior
        document.querySelectorAll('.panel-tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.textContent.toLowerCase();
                this.switchBottomTab(tabName);
            });
        });
    }

    setupTools() {
        // Configurar ferramentas do painel direito
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolName = btn.querySelector('.tool-label').textContent.toLowerCase();
                this.selectTool(toolName, btn);
            });
        });
        
        // Configurar controles do preview
        document.querySelectorAll('.preview-controls .btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolId = btn.id;
                this.selectPreviewTool(toolId);
            });
        });
    }

    setupInspector() {
        // Configurar inputs do inspector
        document.querySelectorAll('.vector-input input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateObjectProperty(e.target);
            });
        });
        
        document.querySelectorAll('.property-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateObjectProperty(e.target);
            });
        });
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateObjectProperty(e.target);
            });
        });
    }

    setupConsole() {
        // Configurar console com auto-scroll
        this.consoleOutput = document.getElementById('console-output');
        if (this.consoleOutput) {
            this.consoleOutput.addEventListener('scroll', () => {
                const isAtBottom = this.consoleOutput.scrollTop + this.consoleOutput.clientHeight >= this.consoleOutput.scrollHeight - 5;
                this.autoScroll = isAtBottom;
            });
        }
    }

    setupPreview() {
        const canvas = document.getElementById('game-preview');
        if (canvas) {
            this.previewCanvas = canvas;
            this.previewContext = canvas.getContext('2d');
            this.initializePreview();
        }
        
        // Setup preview controls
        const fullscreenBtn = document.getElementById('fullscreen-preview');
        const resetBtn = document.getElementById('reset-preview');
        const resolutionSelect = document.getElementById('preview-resolution');
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetPreview());
        }
        
        if (resolutionSelect) {
            resolutionSelect.addEventListener('change', (e) => this.changeResolution(e.target.value));
        }
    }

    setupDocumentation() {
        const showDocsBtn = document.getElementById('show-docs');
        if (showDocsBtn) {
            showDocsBtn.addEventListener('click', () => this.showDocumentation());
        }
    }

    updateInterface() {
        // Update interface based on current mode
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.updateInterface();
    }

    selectVisualTool(toolId) {
        this.logMessage(`Tool selected: ${toolId}`);
    }

    runScript() {
        this.logMessage('Running script...');
    }

    stopScript() {
        this.logMessage('Script stopped');
    }

    clearConsole() {
        const consoleElement = document.getElementById('console-output');
        if (consoleElement) {
            consoleElement.innerHTML = '';
        }
    }

    saveScript() {
        this.logMessage('Script saved');
    }

    loadScript() {
        this.logMessage('Script loaded');
    }

    switchTerminalTab(tabType) {
        this.logMessage(`Switched to ${tabType} tab`);
    }

    initializePreview() {
        // Initialize preview canvas
    }

    toggleFullscreen() {
        this.logMessage('Toggling fullscreen');
    }

    changeResolution(resolution) {
        this.logMessage(`Resolution changed to ${resolution}`);
    }

    showDocumentation() {
         const modal = document.getElementById('docs-modal');
         if (modal) {
             modal.style.display = 'block';
         }
     }

     resetPreview() {
         if (this.previewContext) {
             this.previewContext.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
             this.previewContext.fillStyle = '#000';
             this.previewContext.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
         }
         this.logMessage('Preview reset');
     }

     logMessage(message, type = 'info') {
         const consoleElement = document.getElementById('console-output');
         if (consoleElement) {
             const timestamp = new Date().toLocaleTimeString();
             const messageClass = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';
             const messageDiv = document.createElement('div');
             messageDiv.className = `console-line ${messageClass}`;
             messageDiv.innerHTML = `<span class="timestamp">${timestamp}</span><span class="message">${message}</span>`;
             consoleElement.appendChild(messageDiv);
             
             if (this.autoScroll !== false) {
                 consoleElement.scrollTop = consoleElement.scrollHeight;
             }
         } else {
             console.log(message);
         }
     }
     
     createResizer(targetSelector, direction, minSize, maxSize) {
         const target = document.querySelector(targetSelector);
         if (!target) return;
         
         const resizer = document.createElement('div');
         resizer.className = `resizer resizer-${direction}`;
         
         if (direction === 'right') {
             target.appendChild(resizer);
         } else if (direction === 'left') {
             target.insertBefore(resizer, target.firstChild);
         } else if (direction === 'top') {
             target.insertBefore(resizer, target.firstChild);
         }
         
         let isResizing = false;
         let startPos = 0;
         let startSize = 0;
         
         resizer.addEventListener('mousedown', (e) => {
             isResizing = true;
             startPos = direction === 'top' ? e.clientY : e.clientX;
             startSize = direction === 'top' ? target.offsetHeight : target.offsetWidth;
             
             document.addEventListener('mousemove', handleMouseMove);
             document.addEventListener('mouseup', handleMouseUp);
             
             e.preventDefault();
         });
         
         const handleMouseMove = (e) => {
             if (!isResizing) return;
             
             const currentPos = direction === 'top' ? e.clientY : e.clientX;
             let delta = currentPos - startPos;
             
             if (direction === 'left' || direction === 'top') {
                 delta = -delta;
             }
             
             let newSize = startSize + delta;
             newSize = Math.max(minSize, Math.min(maxSize, newSize));
             
             if (direction === 'top') {
                 target.style.height = newSize + 'px';
             } else {
                 target.style.width = newSize + 'px';
             }
         };
         
         const handleMouseUp = () => {
             isResizing = false;
             document.removeEventListener('mousemove', handleMouseMove);
             document.removeEventListener('mouseup', handleMouseUp);
         };
     }

     /**
      * Inicializa o sistema de ferramentas
     */
    init() {
        this.setupEventListeners();
        this.initializeHelpers();
        this.updateConnectionStatus();
        this.startPerformanceMonitor();
    }

    /**
     * Configura os event listeners da interface
     */
    setupEventListeners() {
        // Navegação entre categorias
        document.querySelectorAll('.category').forEach(category => {
            category.addEventListener('click', (e) => {
                this.switchCategory(e.currentTarget.dataset.category);
            });
        });

        // Controles de camadas do mapa
        document.getElementById('ground-layer').addEventListener('change', (e) => {
            this.toggleMapLayer('ground', e.target.checked);
        });
        document.getElementById('obstacles-layer').addEventListener('change', (e) => {
            this.toggleMapLayer('obstacles', e.target.checked);
        });
        document.getElementById('decoration-layer').addEventListener('change', (e) => {
            this.toggleMapLayer('decoration', e.target.checked);
        });

        // Monitoramento de eventos de rede
        document.getElementById('log-movement').addEventListener('change', (e) => {
            this.toggleEventLogging('movement', e.target.checked);
        });
        document.getElementById('log-chat').addEventListener('change', (e) => {
            this.toggleEventLogging('chat', e.target.checked);
        });
        document.getElementById('log-combat').addEventListener('change', (e) => {
            this.toggleEventLogging('combat', e.target.checked);
        });

        // Performance monitor
        document.getElementById('show-fps').addEventListener('change', (e) => {
            this.togglePerformanceDisplay('fps', e.target.checked);
        });
        document.getElementById('show-memory').addEventListener('change', (e) => {
            this.togglePerformanceDisplay('memory', e.target.checked);
        });
    }

    /**
     * Inicializa os helpers da engine
     */
    initializeHelpers() {
        this.isoHelper = new IsometricHelper(CONFIG.game);
    }

    /**
     * Troca entre categorias de ferramentas
     */
    switchCategory(category) {
        // Remove active de todas as categorias
        document.querySelectorAll('.category').forEach(cat => {
            cat.classList.remove('active');
        });
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Ativa a categoria selecionada
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        document.getElementById(`${category}-tools`).classList.add('active');
    }

    /**
     * Controla a visibilidade das camadas do mapa
     */
    toggleMapLayer(layer, visible) {
        if (this.mapManager && this.mapManager.layers[layer]) {
            this.mapManager.layers[layer].setVisible(visible);
            this.logMessage(`Camada ${layer}: ${visible ? 'visível' : 'oculta'}`);
        }
    }

    /**
     * Controla o logging de eventos de rede
     */
    toggleEventLogging(eventType, enabled) {
        if (this.socketManager) {
            this.socketManager.setEventLogging(eventType, enabled);
        }
        this.logMessage(`Log de ${eventType}: ${enabled ? 'ativado' : 'desativado'}`);
    }

    /**
     * Controla a exibição de informações de performance
     */
    togglePerformanceDisplay(type, enabled) {
        if (this.performanceMonitor) {
            this.performanceMonitor.toggle(type, enabled);
        }
    }

    /**
     * Atualiza o status da conexão
     */
    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (this.isConnected) {
            statusElement.textContent = 'Conectado';
            statusElement.className = 'connected';
        } else {
            statusElement.textContent = 'Desconectado';
            statusElement.className = 'disconnected';
        }
    }

    /**
     * Inicia o monitor de performance
     */
    startPerformanceMonitor() {
        this.performanceMonitor = {
            fps: 0,
            memory: 0,
            showFps: false,
            showMemory: false,
            
            update: () => {
                if (this.game && this.game.loop) {
                    this.performanceMonitor.fps = Math.round(this.game.loop.actualFps);
                }
                
                if (performance.memory) {
                    this.performanceMonitor.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
                }
                
                this.updatePerformanceDisplay();
            },
            
            toggle: (type, enabled) => {
                this.performanceMonitor[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] = enabled;
            }
        };
        
        setInterval(() => this.performanceMonitor.update(), 1000);
    }

    /**
     * Atualiza a exibição de performance
     */
    updatePerformanceDisplay() {
        const statsElement = document.getElementById('performance-stats');
        let html = '';
        
        if (this.performanceMonitor.showFps) {
            html += `<div class="stat-item"><span class="stat-label">FPS:</span><span class="stat-value">${this.performanceMonitor.fps}</span></div>`;
        }
        
        if (this.performanceMonitor.showMemory) {
            html += `<div class="stat-item"><span class="stat-label">Memória:</span><span class="stat-value">${this.performanceMonitor.memory} MB</span></div>`;
        }
        
        statsElement.innerHTML = html;
    }

    /**
     * Adiciona uma mensagem ao log
     */
    logMessage(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logElement = document.getElementById('event-log');
        if (logElement) {
            logElement.innerHTML += `[${timestamp}] ${message}\n`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        console.log(`[Engine Tools] ${message}`);
    }

    /**
     * Exibe uma mensagem de status
     */
    showMessage(message, type = 'info', targetElement = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        if (targetElement) {
            targetElement.appendChild(messageDiv);
        }
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// Instância global das ferramentas
let engineTools;

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    engineTools = new EngineTools();
});

// Funções globais para os botões da interface

/**
 * Gera um mapa isométrico automaticamente
 */
function generateIsometricMap() {
    const width = parseInt(document.getElementById('map-width').value);
    const height = parseInt(document.getElementById('map-height').value);
    const terrainType = document.getElementById('terrain-type').value;
    const obstacleDensity = parseInt(document.getElementById('obstacle-density').value);
    
    if (!width || !height || width < 200 || height < 200) {
        engineTools.showMessage('Digite dimensões válidas (mínimo 200px)', 'warning');
        return;
    }
    
    engineTools.logMessage(`Gerando mapa isométrico: ${width}x${height}px, terreno: ${terrainType}`);
    
    // Configurações do tile isométrico
    const tileWidth = 64;
    const tileHeight = 32;
    const tilesX = Math.floor(width / (tileWidth / 2));
    const tilesY = Math.floor(height / (tileHeight / 2));
    
    // Gera a estrutura do mapa
    const mapData = {
        width: tilesX,
        height: tilesY,
        tileWidth: tileWidth,
        tileHeight: tileHeight,
        orientation: 'isometric',
        layers: [
            generateGroundLayer(tilesX, tilesY, terrainType),
            generateObstacleLayer(tilesX, tilesY, obstacleDensity),
            generateDecorationLayer(tilesX, tilesY, terrainType)
        ],
        tilesets: generateTilesets(terrainType)
    };
    
    // Salva o mapa gerado
    engineTools.generatedMap = mapData;
    
    // Atualiza o preview
    updateMapPreview(mapData);
    
    engineTools.logMessage(`Mapa gerado: ${tilesX}x${tilesY} tiles (${width}x${height}px)`);
    engineTools.showMessage('Mapa isométrico gerado com sucesso!', 'success');
    
    // Disponibiliza download do mapa
    createDownloadLink(mapData);
}

/**
 * Gera a camada de chão
 */
function generateGroundLayer(tilesX, tilesY, terrainType) {
    const layer = {
        name: 'ground',
        type: 'tilelayer',
        width: tilesX,
        height: tilesY,
        data: []
    };
    
    const terrainTiles = {
        grass: [1, 2, 3],
        stone: [4, 5, 6],
        sand: [7, 8, 9],
        water: [10, 11, 12],
        mixed: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    };
    
    const tiles = terrainTiles[terrainType] || terrainTiles.grass;
    
    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            // Adiciona variação no terreno
            const tileId = tiles[Math.floor(Math.random() * tiles.length)];
            layer.data.push(tileId);
        }
    }
    
    return layer;
}

/**
 * Gera a camada de obstáculos
 */
function generateObstacleLayer(tilesX, tilesY, density) {
    const layer = {
        name: 'obstacles',
        type: 'tilelayer',
        width: tilesX,
        height: tilesY,
        data: []
    };
    
    const obstacleTiles = [13, 14, 15, 16, 17]; // IDs dos tiles de obstáculos
    
    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            if (Math.random() * 100 < density) {
                const tileId = obstacleTiles[Math.floor(Math.random() * obstacleTiles.length)];
                layer.data.push(tileId);
            } else {
                layer.data.push(0); // Tile vazio
            }
        }
    }
    
    return layer;
}

/**
 * Gera a camada de decoração
 */
function generateDecorationLayer(tilesX, tilesY, terrainType) {
    const layer = {
        name: 'decoration',
        type: 'tilelayer',
        width: tilesX,
        height: tilesY,
        data: []
    };
    
    const decorationTiles = {
        grass: [18, 19, 20], // Flores, arbustos
        stone: [21, 22], // Rochas pequenas
        sand: [23, 24], // Conchas, pedras
        water: [25, 26], // Plantas aquáticas
        mixed: [18, 19, 20, 21, 22, 23, 24]
    };
    
    const tiles = decorationTiles[terrainType] || decorationTiles.grass;
    
    for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
            // 15% de chance de ter decoração
            if (Math.random() < 0.15) {
                const tileId = tiles[Math.floor(Math.random() * tiles.length)];
                layer.data.push(tileId);
            } else {
                layer.data.push(0);
            }
        }
    }
    
    return layer;
}

/**
 * Gera os tilesets para o mapa
 */
function generateTilesets(terrainType) {
    return [
        {
            firstgid: 1,
            name: 'terrain',
            tilewidth: 64,
            tileheight: 32,
            tilecount: 30,
            columns: 6,
            image: `assets/tilesets/${terrainType}_tileset.png`,
            imagewidth: 384,
            imageheight: 160
        }
    ];
}

/**
 * Atualiza o preview do mapa
 */
function updateMapPreview(mapData) {
    const previewElement = document.getElementById('game-preview');
    
    // Cria uma representação visual simples do mapa
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    
    // Fundo
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha uma representação simplificada do mapa isométrico
    const scaleX = canvas.width / mapData.width;
    const scaleY = canvas.height / mapData.height;
    
    for (let y = 0; y < Math.min(mapData.height, 20); y++) {
        for (let x = 0; x < Math.min(mapData.width, 30); x++) {
            const isoX = (x - y) * (scaleX / 2) + canvas.width / 2;
            const isoY = (x + y) * (scaleY / 4) + 50;
            
            // Desenha tile base
            ctx.fillStyle = getTileColor(mapData.layers[0].data[y * mapData.width + x]);
            drawIsometricTile(ctx, isoX, isoY, scaleX / 2, scaleY / 2);
            
            // Desenha obstáculos se existirem
            const obstacleId = mapData.layers[1].data[y * mapData.width + x];
            if (obstacleId > 0) {
                ctx.fillStyle = '#8b4513';
                drawIsometricTile(ctx, isoX, isoY - 5, scaleX / 3, scaleY / 3);
            }
        }
    }
    
    previewElement.innerHTML = '';
    previewElement.appendChild(canvas);
    
    // Adiciona informações do mapa
    const info = document.createElement('div');
    info.innerHTML = `
        <p><strong>Dimensões:</strong> ${mapData.width}x${mapData.height} tiles</p>
        <p><strong>Tamanho do Tile:</strong> ${mapData.tileWidth}x${mapData.tileHeight}px</p>
        <p><strong>Camadas:</strong> ${mapData.layers.length}</p>
    `;
    info.style.color = '#4cc9f0';
    info.style.fontSize = '12px';
    info.style.marginTop = '10px';
    previewElement.appendChild(info);
}

/**
 * Desenha um tile isométrico
 */
function drawIsometricTile(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x - width, y + height / 2);
    ctx.closePath();
    ctx.fill();
}

/**
 * Retorna a cor baseada no ID do tile
 */
function getTileColor(tileId) {
    const colors = {
        1: '#4a7c59', 2: '#5d8a66', 3: '#6b9674', // Grama
        4: '#6b6b6b', 5: '#7a7a7a', 6: '#8a8a8a', // Pedra
        7: '#d2b48c', 8: '#ddbf94', 9: '#e8ca9c', // Areia
        10: '#4682b4', 11: '#5f9ea0', 12: '#6495ed' // Água
    };
    return colors[tileId] || '#4a7c59';
}

/**
 * Cria link para download do mapa
 */
function createDownloadLink(mapData) {
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `mapa_isometrico_${mapData.width}x${mapData.height}.json`;
    downloadLink.textContent = 'Baixar Mapa JSON';
    downloadLink.style.display = 'block';
    downloadLink.style.marginTop = '10px';
    downloadLink.style.color = '#4cc9f0';
    
    const previewElement = document.getElementById('game-preview');
    const existingLink = previewElement.querySelector('a');
    if (existingLink) {
        existingLink.remove();
    }
    previewElement.appendChild(downloadLink);
}

/**
 * Converte coordenadas
 */
function convertCoordinates() {
    const x = parseFloat(document.getElementById('coord-x').value);
    const y = parseFloat(document.getElementById('coord-y').value);
    
    if (isNaN(x) || isNaN(y)) {
        engineTools.showMessage('Digite coordenadas válidas', 'warning');
        return;
    }
    
    const cartToIso = engineTools.isoHelper.cartesianToIsometric(x, y);
    const isoToCart = engineTools.isoHelper.isometricToCartesian(x, y);
    
    const result = `
Cartesiano para Isométrico:
X: ${cartToIso.x.toFixed(2)}, Y: ${cartToIso.y.toFixed(2)}

Isométrico para Cartesiano:
X: ${isoToCart.x.toFixed(2)}, Y: ${isoToCart.y.toFixed(2)}`;
    
    document.getElementById('coord-result').textContent = result;
}

/**
 * Carrega um tileset
 */
function loadTileset() {
    const fileInput = document.getElementById('tileset-file');
    const file = fileInput.files[0];
    
    if (!file) {
        engineTools.showMessage('Selecione um arquivo de tileset', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        engineTools.logMessage(`Tileset carregado: ${file.name}`);
        engineTools.showMessage('Tileset carregado com sucesso!', 'success');
        
        // Aqui você implementaria a lógica para carregar o tileset
    };
    reader.readAsDataURL(file);
}

/**
 * Visualiza um asset
 */
function previewAsset() {
    const assetName = document.getElementById('asset-selector').value;
    engineTools.logMessage(`Visualizando asset: ${assetName}`);
    
    // Aqui você implementaria a lógica para mostrar o preview do asset
    const previewArea = document.getElementById('game-preview');
    previewArea.innerHTML = `<p>Preview do asset: ${assetName}</p>`;
}

/**
 * Carrega um arquivo de áudio
 */
function loadAudio() {
    const fileInput = document.getElementById('audio-file');
    const file = fileInput.files[0];
    
    if (!file) {
        engineTools.showMessage('Selecione um arquivo de áudio', 'warning');
        return;
    }
    
    engineTools.logMessage(`Áudio carregado: ${file.name}`);
    engineTools.showMessage('Áudio carregado com sucesso!', 'success');
}

/**
 * Reproduz o áudio carregado
 */
function playAudio() {
    engineTools.logMessage('Reproduzindo áudio...');
    // Aqui você implementaria a lógica para reproduzir o áudio
}

/**
 * Cria um personagem
 */
function createCharacter() {
    const name = document.getElementById('char-name').value;
    const type = document.getElementById('char-type').value;
    
    if (!name.trim()) {
        engineTools.showMessage('Digite um nome para o personagem', 'warning');
        return;
    }
    
    engineTools.logMessage(`Personagem criado: ${name} (${type})`);
    engineTools.showMessage('Personagem criado com sucesso!', 'success');
    
    // Aqui você implementaria a lógica para criar o personagem
}

/**
 * Testa animações
 */
function testAnimation() {
    const direction = document.getElementById('anim-direction').value;
    const type = document.getElementById('anim-type').value;
    
    engineTools.logMessage(`Testando animação: ${direction}_${type}`);
    
    // Aqui você implementaria a lógica para testar a animação
}

/**
 * Atualiza atributos do personagem
 */
function updateCharacterStats() {
    const hp = document.getElementById('char-hp').value;
    const speed = document.getElementById('char-speed').value;
    
    engineTools.logMessage(`Atributos atualizados: HP=${hp}, Velocidade=${speed}`);
    engineTools.showMessage('Atributos atualizados!', 'success');
}

/**
 * Testa o pathfinding
 */
function testPathfinding() {
    const startX = parseInt(document.getElementById('path-start-x').value);
    const startY = parseInt(document.getElementById('path-start-y').value);
    const endX = parseInt(document.getElementById('path-end-x').value);
    const endY = parseInt(document.getElementById('path-end-y').value);
    
    if (engineTools.pathfinder) {
        const path = engineTools.pathfinder.findPath(startX, startY, endX, endY);
        if (path) {
            engineTools.logMessage(`Caminho encontrado: ${path.length} passos`);
            engineTools.showMessage('Caminho calculado com sucesso!', 'success');
        } else {
            engineTools.showMessage('Nenhum caminho encontrado', 'warning');
        }
    } else {
        engineTools.showMessage('Pathfinder não inicializado', 'error');
    }
}

/**
 * Alterna visualização do grid
 */
function toggleGridVisualization() {
    const showGrid = document.getElementById('show-grid').checked;
    const showObstacles = document.getElementById('show-obstacles').checked;
    
    engineTools.logMessage(`Grid: ${showGrid ? 'visível' : 'oculto'}, Obstáculos: ${showObstacles ? 'visíveis' : 'ocultos'}`);
    
    // Aqui você implementaria a lógica para mostrar/ocultar o grid
}

/**
 * Define o modo de edição
 */
function setEditMode(mode) {
    engineTools.editMode = mode;
    engineTools.logMessage(`Modo de edição: ${mode}`);
    
    const buttons = document.querySelectorAll('#pathfinding-tools button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (mode !== 'none') {
        event.target.classList.add('active');
    }
}

/**
 * Conecta ao servidor
 */
function connectToServer() {
    engineTools.logMessage('Tentando conectar ao servidor...');
    
    // Simula conexão
    setTimeout(() => {
        engineTools.isConnected = true;
        engineTools.updateConnectionStatus();
        engineTools.logMessage('Conectado ao servidor');
        engineTools.showMessage('Conectado com sucesso!', 'success');
    }, 1000);
}

/**
 * Desconecta do servidor
 */
function disconnectFromServer() {
    engineTools.isConnected = false;
    engineTools.updateConnectionStatus();
    engineTools.logMessage('Desconectado do servidor');
    engineTools.showMessage('Desconectado', 'info');
}

/**
 * Adiciona bots para teste
 */
function addBots() {
    const count = parseInt(document.getElementById('bot-count').value);
    
    for (let i = 0; i < count; i++) {
        const bot = {
            id: `bot_${Date.now()}_${i}`,
            name: `Bot ${engineTools.bots.length + i + 1}`,
            x: Math.random() * 800,
            y: Math.random() * 600
        };
        engineTools.bots.push(bot);
    }
    
    engineTools.logMessage(`${count} bot(s) adicionado(s)`);
    engineTools.showMessage(`${count} bot(s) adicionado(s)!`, 'success');
}

/**
 * Remove todos os bots
 */
function removeBots() {
    const count = engineTools.bots.length;
    engineTools.bots = [];
    engineTools.logMessage(`${count} bot(s) removido(s)`);
    engineTools.showMessage('Bots removidos!', 'info');
}

/**
 * Executa comando de debug
 */
function executeDebugCommand() {
    const command = document.getElementById('debug-console').value;
    const outputElement = document.getElementById('debug-output');
    
    if (!command.trim()) {
        engineTools.showMessage('Digite um comando', 'warning');
        return;
    }
    
    try {
        const result = eval(command);
        outputElement.textContent += `> ${command}\n${result}\n\n`;
        engineTools.logMessage(`Comando executado: ${command}`);
    } catch (error) {
        outputElement.textContent += `> ${command}\nErro: ${error.message}\n\n`;
        engineTools.logMessage(`Erro no comando: ${error.message}`);
    }
    
    outputElement.scrollTop = outputElement.scrollHeight;
}

/**
 * Captura screenshot
 */
function takeScreenshot() {
    engineTools.logMessage('Capturando screenshot...');
    
    if (engineTools.game && engineTools.game.renderer) {
        engineTools.game.renderer.snapshot((image) => {
            const previewElement = document.getElementById('capture-preview');
            previewElement.innerHTML = `<img src="${image.src}" alt="Screenshot">`;
            engineTools.showMessage('Screenshot capturado!', 'success');
        });
    } else {
        engineTools.showMessage('Jogo não inicializado', 'warning');
    }
}

/**
 * Grava GIF
 */
function recordGif() {
    engineTools.logMessage('Iniciando gravação de GIF...');
    engineTools.showMessage('Funcionalidade em desenvolvimento', 'info');
}

/**
 * Inicia o preview
 */
function startPreview() {
    const previewElement = document.getElementById('game-preview');
    
    if (engineTools.game) {
        engineTools.showMessage('Jogo já está rodando', 'warning');
        return;
    }
    
    // Configuração básica do Phaser para preview
    const config = {
        type: Phaser.AUTO,
        width: 380,
        height: 280,
        parent: 'game-preview',
        backgroundColor: '#1a1a2e',
        scene: {
            preload: function() {
                // Carrega assets básicos
            },
            create: function() {
                this.add.text(190, 140, 'Preview da Engine', {
                    fontSize: '16px',
                    fill: '#4cc9f0',
                    align: 'center'
                }).setOrigin(0.5);
            }
        }
    };
    
    engineTools.game = new Phaser.Game(config);
    engineTools.logMessage('Preview iniciado');
    engineTools.showMessage('Preview iniciado!', 'success');
}

/**
 * Para o preview
 */
function stopPreview() {
    if (engineTools.game) {
        engineTools.game.destroy(true);
        engineTools.game = null;
        document.getElementById('game-preview').innerHTML = 'Preview parado';
        engineTools.logMessage('Preview parado');
        engineTools.showMessage('Preview parado!', 'info');
    }
}

/**
 * Reseta o preview
 */
function resetPreview() {
    stopPreview();
    document.getElementById('game-preview').innerHTML = 'Clique em "Iniciar Preview" para começar';
    engineTools.logMessage('Preview resetado');
}