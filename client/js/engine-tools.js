class EngineTools {
    constructor() {
        this.socket = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.selectedObject = null;
        this.selectedAsset = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.drawStartPos = null;
        this.currentLayer = 'ground';
        this.layerVisibility = {
            ground: true,
            obstacles: true,
            decoration: true
        };
        this.currentColor = 'rgba(255, 0, 0, 1)';
        this.backgroundColor = 'rgba(43, 43, 43, 1)';
        this.gameObjects = new Map();
        this.assets = new Map();
        this.sceneData = null;
        this.projectData = {
            name: 'Untitled Project',
            scenes: [],
            assets: [],
            scripts: []
        };
        
        this.initializeConnection();
        this.initializeIsometricRenderer();
        this.initializeInterface();
        this.loadProjectData();
    }

    // Conexão com o servidor
    initializeConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.logMessage('Conectado ao servidor', 'info');
            this.loadSceneData();
            this.loadAssets();
        });
        
        this.socket.on('disconnect', () => {
            this.logMessage('Desconectado do servidor', 'warning');
        });
        
        this.socket.on('scene_updated', (data) => {
            this.updateSceneFromServer(data);
        });
        
        this.socket.on('asset_added', (asset) => {
            this.addAssetToPanel(asset);
        });
    }

    // Inicialização do renderizador isométrico
    initializeIsometricRenderer() {
        const canvas = document.getElementById('game-canvas');
        const viewport = document.getElementById('preview-viewport');
        
        // Configurar renderizador
        this.renderer = new Phaser.Game({
            type: Phaser.CANVAS,
            canvas: canvas,
            width: viewport.clientWidth,
            height: viewport.clientHeight,
            backgroundColor: '#2b2b2b',
            scene: {
                create: () => this.createIsometricScene()
            }
        });
        
        // Configurar cena isométrica
        this.scene = null; // Será definido em createIsometricScene
        
        // Configurar grade isométrica
        this.setupIsometricGrid();
        
        // Controles de câmera isométrica
        this.setupCameraControls();
        
        // Iniciar loop de renderização
        this.animate();
        
        // Redimensionamento
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    // Criar cena isométrica
    createIsometricScene() {
        // Obter a cena atual do Phaser
        this.scene = this.renderer.scene.scenes[0];
        
        // Configurar projeção isométrica
        this.scene.isometric = true;
        
        // Inicializar dados da cena
        this.sceneData = {
            objects: [],
            tiles: [],
            settings: {
                tileWidth: 80,
                tileHeight: 40,
                gridSize: 20
            }
        };
        
        // Configurar grade isométrica imediatamente
        this.setupIsometricGrid();
        
        this.logMessage('Cena isométrica inicializada com Phaser', 'info');
    }
    
    // Configurar grade isométrica
     setupIsometricGrid() {
         // Esta função será chamada após a cena ser criada
         if (!this.scene) return;
         
         const tileWidth = 80;
         const tileHeight = 40;
         const viewport = document.getElementById('preview-viewport');
         const canvasWidth = viewport.clientWidth || 800;
         const canvasHeight = viewport.clientHeight || 600;
         
         // Criar grupo para os elementos da grade
         this.gridGroup = this.scene.add.group();
         
         // Calcular limites para preencher completamente o viewport
         const maxDistance = Math.max(canvasWidth, canvasHeight);
         const gridRange = Math.ceil(maxDistance / Math.min(tileWidth, tileHeight)) + 5;
         
         // Desenhar grade isométrica cobrindo todo o viewport
         for (let y = -gridRange; y <= gridRange; y++) {
             for (let x = -gridRange; x <= gridRange; x++) {
                 const centerX = x * tileWidth / 2 + y * tileWidth / 2;
                 const centerY = y * tileHeight / 2 - x * tileHeight / 2;
                 
                 const isoX = canvasWidth / 2 + centerX;
                 const isoY = canvasHeight / 2 + centerY;
                 
                 // Verificar se o tile está dentro da área visível (com margem)
                 if (isoX >= -tileWidth && isoX <= canvasWidth + tileWidth &&
                     isoY >= -tileHeight && isoY <= canvasHeight + tileHeight) {
                     
                     // Criar losango usando gráficos do Phaser
                     const diamond = this.scene.add.graphics();
                     diamond.lineStyle(1, 0xcccccc, 1);
                     diamond.beginPath();
                     diamond.moveTo(isoX, isoY - tileHeight / 2); // Top
                     diamond.lineTo(isoX + tileWidth / 2, isoY);  // Right
                     diamond.lineTo(isoX, isoY + tileHeight / 2); // Bottom
                     diamond.lineTo(isoX - tileWidth / 2, isoY);  // Left
                     diamond.closePath();
                     diamond.strokePath();
                     
                     // Criar ponto central
                     const dot = this.scene.add.graphics();
                     dot.fillStyle(0x999999, 1);
                     dot.fillCircle(isoX, isoY, 1.5);
                     
                     this.gridGroup.add(diamond);
                     this.gridGroup.add(dot);
                 }
             }
         }
         
         this.logMessage('Grade isométrica configurada com Phaser', 'info');
     }

    // Configurar controles de câmera
    setupCameraControls() {
        const viewport = document.getElementById('preview-viewport');
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        // Configurar controles de câmera para visão isométrica
        viewport.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.altKey)) { // Botão do meio ou Alt+Click
                isDragging = true;
                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });
        
        viewport.addEventListener('mousemove', (e) => {
            if (isDragging && this.scene && this.scene.cameras) {
                const deltaMove = {
                    x: e.clientX - previousMousePosition.x,
                    y: e.clientY - previousMousePosition.y
                };
                
                // Mover a câmera na visão isométrica
                if (this.scene.cameras && this.scene.cameras.main) {
                    this.scene.cameras.main.scrollX -= deltaMove.x;
                    this.scene.cameras.main.scrollY -= deltaMove.y;
                }
                
                previousMousePosition = { x: e.clientX, y: e.clientY };
                this.updateCameraInfo();
            }
        });
        
        viewport.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Zoom da câmera isométrica
            if (this.scene && this.scene.cameras && this.scene.cameras.main) {
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.scene.cameras.main.zoom *= delta;
                this.scene.cameras.main.zoom = Math.max(0.5, Math.min(2, this.scene.cameras.main.zoom));
                this.updateCameraInfo();
            }
            
        });
    }

    // Loop de animação
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isRunning) {
            this.updateGameLogic();
        }
        
        // Nota: O Phaser gerencia seu próprio loop de renderização
        // Não precisamos chamar renderer.render explicitamente
        this.updateStats();
    }

    // Atualizar estatísticas
    updateStats() {
        // Atualizar FPS real do Phaser
        const fps = this.renderer?.game?.loop?.actualFps || 0;
        document.getElementById('fps-counter').textContent = `FPS: ${Math.round(fps)}`;
        
        // Contar tiles da grade isométrica (losangos visíveis)
        let tileCount = 0;
        
        // Calcular quantidade de losangos visíveis baseado na grade
        const viewport = document.getElementById('preview-viewport');
        if (viewport) {
            const canvasWidth = viewport.clientWidth || 800;
            const canvasHeight = viewport.clientHeight || 600;
            const tileWidth = 80;
            const tileHeight = 40;
            
            // Usar a mesma lógica da setupIsometricGrid para contar tiles visíveis
            const maxDistance = Math.max(canvasWidth, canvasHeight);
            const gridRange = Math.ceil(maxDistance / Math.min(tileWidth, tileHeight)) + 5;
            
            // Contar tiles que estão dentro da área visível
            for (let y = -gridRange; y <= gridRange; y++) {
                for (let x = -gridRange; x <= gridRange; x++) {
                    const centerX = x * tileWidth / 2 + y * tileWidth / 2;
                    const centerY = y * tileHeight / 2 - x * tileHeight / 2;
                    
                    const isoX = canvasWidth / 2 + centerX;
                    const isoY = canvasHeight / 2 + centerY;
                    
                    // Verificar se o tile está dentro da área visível
                    if (isoX >= -tileWidth && isoX <= canvasWidth + tileWidth &&
                        isoY >= -tileHeight && isoY <= canvasHeight + tileHeight) {
                        tileCount++;
                    }
                }
            }
        }
        
        document.getElementById('triangle-counter').textContent = `Tiles: ${tileCount}`;
        
        // Contar apenas objetos/assets adicionados (não tiles da grade)
        let objectCount = 0;
        if (this.sceneData?.objects) {
            // Contar apenas objetos que são assets/sprites, não tiles da grade
            objectCount = this.sceneData.objects.filter(obj => 
                obj.type === 'sprite' || obj.type === 'asset' || 
                (obj.type !== 'tile' && obj.layer !== 'ground' && obj.layer !== 'obstacles' && obj.layer !== 'decoration')
            ).length;
        }
        
        // Adicionar objetos renderizados que não são tiles
        if (this.scene && this.scene.children) {
            const renderedAssets = this.scene.children.list.filter(child => 
                child.texture && 
                child.texture.key !== 'tiles' && 
                child.texture.key !== 'isometric-tileset' &&
                child.texture.key !== 'grid'
            ).length;
            objectCount = Math.max(objectCount, renderedAssets);
        }
        
        document.getElementById('draw-calls').textContent = `Objetos: ${objectCount}`;
    }

    // Atualizar informações da câmera
    updateCameraInfo() {
        if (this.scene?.cameras?.main) {
            const zoom = this.scene.cameras.main.zoom.toFixed(2);
            const scrollX = Math.round(this.scene.cameras.main.scrollX);
            const scrollY = Math.round(this.scene.cameras.main.scrollY);
            document.getElementById('camera-info').textContent = `Camera: Isométrica (Zoom: ${zoom})`;
            document.getElementById('position-info').textContent = `Posição: (${scrollX}, ${scrollY})`;
            document.getElementById('zoom-info').textContent = `Zoom: ${(zoom * 100).toFixed(0)}%`;
        } else {
            document.getElementById('camera-info').textContent = 'Camera: Isométrica';
            document.getElementById('position-info').textContent = 'Posição: (0, 0)';
            document.getElementById('zoom-info').textContent = 'Zoom: 100%';
        }
    }

    // Redimensionamento da janela
    onWindowResize() {
        const viewport = document.getElementById('preview-viewport');
        if (this.renderer && this.renderer.scale) {
            this.renderer.scale.resize(viewport.clientWidth, viewport.clientHeight);
            
            // Atualizar a câmera isométrica se existir
            if (this.scene && this.scene.cameras && this.scene.cameras.main) {
                this.scene.cameras.main.setSize(viewport.clientWidth, viewport.clientHeight);
            }
            
            // Recriar a grade isométrica com as novas dimensões
            if (this.gridGroup) {
                this.gridGroup.clear(true, true); // Remove todos os elementos da grade
                this.setupIsometricGrid(); // Recria a grade com as novas dimensões
            }
            
            this.logMessage('Viewport redimensionado e grade isométrica atualizada', 'info');
        }
    }

    // Carregar dados da cena do servidor
    async loadSceneData() {
        try {
            const response = await fetch('/api/scene/current');
            if (response.ok) {
                this.sceneData = await response.json();
                this.buildSceneHierarchy();
            } else {
                // Criar cena padrão se não existir
                this.createDefaultScene();
            }
        } catch (error) {
            this.logMessage('Erro ao carregar dados da cena', 'error');
            this.createDefaultScene();
        }
    }

    // Criar cena padrão isométrica
    createDefaultScene() {
        this.sceneData = {
            name: 'Main Scene',
            settings: {
                tileWidth: 64,
                tileHeight: 32,
                gridSize: 20
            },
            objects: [
                { id: 'player', name: 'Player', type: 'sprite', position: [5, 5], texture: 'player' },
                { id: 'npc-1', name: 'NPC 1', type: 'sprite', position: [8, 3], texture: 'npc' },
                { id: 'chest', name: 'Treasure Chest', type: 'sprite', position: [2, 7], texture: 'chest' }
            ],
            tiles: [],
            layers: [
                {
                    name: 'ground',
                    type: 'tilelayer',
                    visible: true
                },
                {
                    name: 'objects',
                    type: 'objectlayer',
                    visible: true
                }
            ]
        };
        this.buildSceneHierarchy();
        this.logMessage('Cena isométrica padrão criada', 'info');
    }

    // Construir hierarquia da cena
    buildSceneHierarchy() {
        const hierarchyTree = document.getElementById('hierarchy-tree');
        hierarchyTree.innerHTML = '';
        
        // Adicionar item raiz da cena
        const sceneItem = this.createHierarchyItem({
            id: 'scene-root',
            name: this.sceneData.name,
            type: 'scene',
            icon: '📁'
        });
        hierarchyTree.appendChild(sceneItem);
        
        // Adicionar objetos da cena
        this.sceneData.objects.forEach(obj => {
            const item = this.createHierarchyItem({
                id: obj.id,
                name: obj.name,
                type: obj.type,
                icon: this.getObjectIcon(obj.type),
                isChild: true
            });
            hierarchyTree.appendChild(item);
        });
    }

    // Criar item da hierarquia
    createHierarchyItem(data) {
        const item = document.createElement('div');
        item.className = `tree-item ${data.isChild ? 'tree-child' : ''}`;
        item.dataset.id = data.id;
        item.dataset.type = data.type;
        
        item.innerHTML = `
            <span class="tree-icon">${data.icon}</span>
            <span class="tree-label">${data.name}</span>
            <span class="tree-delete" title="Remover item">🗑️</span>
        `;
        
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectObject(data.id, item);
        });
        
        // Adicionar evento para o botão de remover
        const deleteBtn = item.querySelector('.tree-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeObject(data.id);
            });
        }
        
        return item;
    }

    // Obter ícone do objeto
    getObjectIcon(type) {
        const icons = {
            'sprite': '🖼️',
            'tile': '🧩',
            'player': '👤',
            'npc': '👥',
            'item': '🎁',
            'trigger': '⚡',
            'audio': '🎵',
            'script': '📜',
            'group': '📁',
            'tilelayer': '🗺️',
            'objectlayer': '🏷️'
        };
        return icons[type] || '🧩';
    }

    // Selecionar objeto
    selectObject(objectId, element) {
        // Remover seleção anterior
        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Selecionar novo objeto
        element.classList.add('selected');
        this.selectedObject = objectId;
        
        // Atualizar inspector
        this.updateInspector(objectId);
        
        this.logMessage(`Objeto selecionado: ${objectId}`, 'info');
    }

    // Atualizar inspector
    updateInspector(objectId) {
        const inspectorContent = document.getElementById('inspector-content');
        
        if (!objectId) {
            inspectorContent.innerHTML = '<div class="no-selection">Selecione um objeto para editar suas propriedades</div>';
            return;
        }
        
        const objectData = this.getObjectData(objectId);
        if (!objectData) return;
        
        inspectorContent.innerHTML = `
            <div class="inspector-section">
                <h4>Transform</h4>
                <div class="property-group">
                    <label>Position</label>
                    <div class="vector-input">
                        <input type="number" value="${objectData.position[0]}" data-property="position.x" data-object="${objectId}">
                        <input type="number" value="${objectData.position[1]}" data-property="position.y" data-object="${objectId}">
                        <input type="number" value="${objectData.position[2]}" data-property="position.z" data-object="${objectId}">
                    </div>
                </div>
                <div class="property-group">
                    <label>Rotation</label>
                    <div class="vector-input">
                        <input type="number" value="${objectData.rotation ? objectData.rotation[0] : 0}" data-property="rotation.x" data-object="${objectId}">
                        <input type="number" value="${objectData.rotation ? objectData.rotation[1] : 0}" data-property="rotation.y" data-object="${objectId}">
                        <input type="number" value="${objectData.rotation ? objectData.rotation[2] : 0}" data-property="rotation.z" data-object="${objectId}">
                    </div>
                </div>
                <div class="property-group">
                    <label>Scale</label>
                    <div class="vector-input">
                        <input type="number" value="${objectData.scale ? objectData.scale[0] : 1}" data-property="scale.x" data-object="${objectId}">
                        <input type="number" value="${objectData.scale ? objectData.scale[1] : 1}" data-property="scale.y" data-object="${objectId}">
                        <input type="number" value="${objectData.scale ? objectData.scale[2] : 1}" data-property="scale.z" data-object="${objectId}">
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar eventos aos inputs
        inspectorContent.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateObjectProperty(e.target.dataset.object, e.target.dataset.property, e.target.value);
            });
        });
    }

    // Obter dados do objeto
    getObjectData(objectId) {
        return this.sceneData.objects.find(obj => obj.id === objectId);
    }

    // Atualizar propriedade do objeto
    updateObjectProperty(objectId, property, value) {
        const objectData = this.getObjectData(objectId);
        if (!objectData) return;
        
        const [prop, axis] = property.split('.');
        const numValue = parseFloat(value);
        
        if (!objectData[prop]) {
            objectData[prop] = [0, 0, 0];
        }
        
        const axisIndex = { x: 0, y: 1, z: 2 }[axis];
        objectData[prop][axisIndex] = numValue;
        
        // Atualizar objeto 3D se existir
        const object3D = this.scene.getObjectByName(objectId);
        if (object3D) {
            if (prop === 'position') {
                object3D.position.fromArray(objectData.position);
            } else if (prop === 'rotation') {
                object3D.rotation.fromArray(objectData.rotation);
            } else if (prop === 'scale') {
                object3D.scale.fromArray(objectData.scale);
            }
        }
        
        // Salvar no servidor
        this.saveSceneToServer();
        
        this.logMessage(`Propriedade ${property} do objeto ${objectId} atualizada para ${value}`, 'info');
    }

    // Carregar assets do servidor
    async loadAssets() {
        try {
            const response = await fetch('/api/assets');
            if (response.ok) {
                const assets = await response.json();
                this.buildAssetsPanel(assets);
            } else {
                this.createDefaultAssets();
            }
        } catch (error) {
            this.logMessage('Erro ao carregar assets', 'error');
            this.createDefaultAssets();
        }
    }

    // Criar assets padrão para biomas e elementos naturais
    createDefaultAssets() {
        // Assets já estão definidos no HTML, apenas configurar eventos
        const assetItems = document.querySelectorAll('.asset-item');
        
        assetItems.forEach(item => {
            item.addEventListener('click', () => {
                this.selectAsset(item.dataset.assetId, item);
            });
            
            item.addEventListener('dragstart', (e) => {
                const assetData = {
                    id: item.dataset.assetId,
                    type: item.dataset.assetType,
                    name: item.querySelector('.asset-name').textContent
                };
                e.dataTransfer.setData('text/plain', JSON.stringify(assetData));
            });
        });
        
        // Configurar upload de SVG
        const uploadBtn = document.getElementById('upload-asset');
        const fileInput = document.getElementById('file-upload');
        
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'image/svg+xml') {
                this.handleSVGUpload(file);
            }
        });
    }

    // Construir painel de assets com categorias
    buildAssetsPanel(assetsData) {
        // Limpar painéis existentes
        const biomeGrid = document.getElementById('biome-assets');
        const natureGrid = document.getElementById('nature-assets');
        const customGrid = document.getElementById('custom-assets');
        
        if (biomeGrid) biomeGrid.innerHTML = '';
        if (natureGrid) natureGrid.innerHTML = '';
        if (customGrid) customGrid.innerHTML = '';
        
        // Adicionar assets de bioma
        if (assetsData.biomes) {
            assetsData.biomes.forEach(asset => {
                this.addAssetToCategory(asset, 'biome-assets');
            });
        }
        
        // Adicionar elementos naturais
        if (assetsData.nature) {
            assetsData.nature.forEach(asset => {
                this.addAssetToCategory(asset, 'nature-assets');
            });
        }
        
        // Configurar upload de arquivos SVG
        this.setupFileUpload();
    }

    // Adicionar asset ao painel
    addAssetToPanel(asset) {
        const assetsGrid = document.getElementById('assets-grid');
        
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.draggable = true;
        assetItem.dataset.assetId = asset.id;
        assetItem.dataset.assetType = asset.type;
        
        assetItem.innerHTML = `
            <div class="asset-thumbnail">${asset.icon}</div>
            <span class="asset-name">${asset.name}</span>
        `;
        
        // Eventos de drag and drop
        assetItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(asset));
        });
        
        assetItem.addEventListener('click', () => {
            this.selectAsset(asset.id, assetItem);
        });
        
        assetsGrid.appendChild(assetItem);
    }

    // Adicionar asset a uma categoria específica
    addAssetToCategory(asset, categoryId) {
        const categoryGrid = document.getElementById(categoryId);
        if (!categoryGrid) return;
        
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.draggable = true;
        assetItem.dataset.assetId = asset.id;
        assetItem.dataset.assetType = asset.type;
        
        assetItem.innerHTML = `
            <div class="asset-thumbnail">${asset.icon}</div>
            <span class="asset-name">${asset.name}</span>
        `;
        
        // Eventos de drag and drop
        assetItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(asset));
        });
        
        assetItem.addEventListener('click', () => {
            this.selectAsset(asset.id, assetItem);
            if (asset.customizable) {
                this.showColorPicker(asset);
            }
        });
        
        categoryGrid.appendChild(assetItem);
    }

    // Configurar upload de arquivos SVG
    setupFileUpload() {
        const uploadBtn = document.getElementById('upload-asset');
        const fileInput = document.getElementById('file-upload');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type === 'image/svg+xml') {
                    this.handleSVGUpload(file);
                } else {
                    this.logMessage('Apenas arquivos SVG são aceitos', 'warning');
                }
            });
        }
    }

    // Processar upload de arquivo SVG
    handleSVGUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const svgContent = e.target.result;
            const customAsset = {
                id: `custom-${Date.now()}`,
                name: file.name.replace('.svg', ''),
                type: 'custom',
                svgContent: svgContent
            };
            
            this.addCustomAssetToGrid(customAsset);
            this.logMessage(`Asset SVG carregado: ${customAsset.name}`, 'success');
        };
        reader.readAsText(file);
    }
    
    addCustomAssetToGrid(asset) {
        const assetsGrid = document.querySelector('.assets-grid');
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.dataset.assetId = asset.id;
        assetItem.dataset.assetType = asset.type;
        
        assetItem.innerHTML = `
            <div class="asset-thumbnail">📄</div>
            <span class="asset-name">${asset.name}</span>
        `;
        
        assetItem.addEventListener('click', () => {
            this.selectAsset(asset.id, assetItem);
        });
        
        assetItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(asset));
        });
        
        assetsGrid.appendChild(assetItem);
    }

    // Mostrar seletor de cor para texturas personalizáveis
    showColorPicker(asset) {
        if (asset.id === 'custom-color') {
            const color = prompt('Digite a cor em formato hexadecimal (ex: #FF0000):');
            if (color && /^#[0-9A-F]{6}$/i.test(color)) {
                this.createCustomColorTexture(color);
            } else if (color) {
                this.logMessage('Formato de cor inválido. Use formato hexadecimal (#RRGGBB)', 'warning');
            }
        }
    }

    // Criar textura de cor personalizada
    createCustomColorTexture(color) {
        const customAsset = {
            id: `color-${color.substring(1)}`,
            name: `Cor ${color}`,
            type: 'biome',
            icon: '🎨',
            color: color,
            svgContent: this.generateColorSVG(color)
        };
        
        this.addAssetToCategory(customAsset, 'custom-assets');
        this.logMessage(`Textura de cor ${color} criada`, 'info');
    }

    // Gerar SVG para cor sólida
    generateColorSVG(color) {
        return `<svg width="64" height="32" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,0 64,16 32,32 0,16" fill="${color}" stroke="#000" stroke-width="1"/>
        </svg>`;
    }

    // Salvar asset personalizado no servidor
    async saveCustomAsset(asset) {
        try {
            const response = await fetch('/api/assets/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(asset)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar asset personalizado');
            }
        } catch (error) {
            this.logMessage('Erro ao salvar asset no servidor', 'error');
        }
    }

    // Selecionar asset (função original atualizada)
    selectAsset(assetId, element) {
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        element.classList.add('selected');
        
        // Encontrar dados do asset
        const assetData = this.getAssetData(assetId);
        this.selectedAsset = assetData;
        
        this.logMessage(`Asset selecionado: ${assetData ? assetData.name : assetId}`, 'info');
    }

    // Configurar eventos da interface
    initializeInterface() {
        this.setupHeaderControls();
        this.setupToolsEvents();
        this.setupTabsEvents();
        this.setupPanelEvents();
        this.setupViewportEvents();
        this.setupMenuEvents();
        this.setupKeyboardShortcuts();
        this.setupResizers();
    }

    // Configurar controles do cabeçalho
    setupHeaderControls() {
        const playBtn = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');
        const stopBtn = document.getElementById('btn-stop');
        
        playBtn?.addEventListener('click', () => this.playGame());
        pauseBtn?.addEventListener('click', () => this.pauseGame());
        stopBtn?.addEventListener('click', () => this.stopGame());
    }

    // Configurar eventos das ferramentas
    setupToolsEvents() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool, btn);
            });
        });
        
        document.querySelectorAll('.preview-controls .btn-icon').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPreviewTool(btn.id);
            });
        });
        
        // Eventos de camadas
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setCurrentLayer(btn.dataset.layer);
            });
        });
        
        document.querySelectorAll('.layer-visibility').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleLayerVisibility(btn.dataset.layer);
            });
        });
    }

    // Configurar eventos das abas
    setupTabsEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab, tab);
            });
        });
    }

    // Configurar eventos dos painéis
    setupPanelEvents() {
        document.querySelectorAll('.panel-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const panel = e.target.closest('.panel');
                const content = panel.querySelector('.panel-content');
                const isCollapsed = content.style.display === 'none';
                
                content.style.display = isCollapsed ? 'block' : 'none';
                e.target.textContent = isCollapsed ? '−' : '+';
            });
        });
    }

    // Configurar eventos do viewport
    setupViewportEvents() {
        const viewport = document.getElementById('preview-viewport');
        
        // Drop de assets
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
            
            const assetData = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.addAssetToScene(assetData, e.clientX, e.clientY);
        });
        
        // Eventos de desenho
        viewport.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        viewport.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        viewport.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        viewport.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    // Configurar eventos do menu
    setupMenuEvents() {
        // Menu principal
        document.querySelectorAll('.menu-item[data-menu]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleMenuAction(item.dataset.menu);
            });
        });
        
        // Itens do dropdown de arquivo
        document.querySelectorAll('.dropdown-menu .menu-item[data-action]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFileAction(item.dataset.action);
                // Fechar o menu após a ação
                document.getElementById('file-menu').style.display = 'none';
            });
        });
        
        // Fechar menus ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-menu') && !e.target.closest('.menu-item[data-menu]')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    // Configurar atalhos de teclado
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.openProject();
            }
            if (e.key === 'Delete' && this.selectedObject) {
                this.deleteSelectedObject();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.togglePlayPause();
            }
            if (e.key === 'Escape') {
                this.deselectAll();
            }
        });
    }

    // Configurar redimensionadores
    setupResizers() {
        const leftResizer = document.getElementById('resizer-left');
        const rightResizer = document.getElementById('resizer-right');
        const bottomResizer = document.getElementById('resizer-bottom');
        
        this.createResizer(leftResizer, 'left');
        this.createResizer(rightResizer, 'right');
        this.createResizer(bottomResizer, 'bottom');
    }

    // Criar redimensionador
    createResizer(element, direction) {
        let isResizing = false;
        
        element.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            if (direction === 'left') {
                const sidebar = document.getElementById('sidebar-left');
                const newWidth = Math.max(200, Math.min(500, e.clientX));
                sidebar.style.width = newWidth + 'px';
            } else if (direction === 'right') {
                const sidebar = document.getElementById('sidebar-right');
                const newWidth = Math.max(200, Math.min(500, window.innerWidth - e.clientX));
                sidebar.style.width = newWidth + 'px';
            } else if (direction === 'bottom') {
                const panel = document.getElementById('bottom-panel');
                const newHeight = Math.max(100, Math.min(400, window.innerHeight - e.clientY));
                panel.style.height = newHeight + 'px';
            }
        };
        
        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }

    // Métodos de ação
    playGame() {
        this.isRunning = true;
        this.logMessage('Jogo iniciado', 'info');
        document.getElementById('btn-play').classList.add('active');
        document.getElementById('btn-pause').classList.remove('active');
    }

    pauseGame() {
        this.isRunning = false;
        this.logMessage('Jogo pausado', 'warning');
        document.getElementById('btn-play').classList.remove('active');
        document.getElementById('btn-pause').classList.add('active');
    }

    stopGame() {
        this.isRunning = false;
        this.logMessage('Jogo parado', 'error');
        document.getElementById('btn-play').classList.remove('active');
        document.getElementById('btn-pause').classList.remove('active');
    }

    selectTool(toolName, element) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        element.classList.add('active');
        this.currentTool = toolName;
        this.logMessage(`Ferramenta selecionada: ${toolName}`, 'info');
        
        // Mostrar/esconder seletor de cores para ferramentas de pintura
        const colorPickerPanel = document.getElementById('color-picker-panel');
        const paintingTools = ['paint', 'fill', 'line', 'rectangle'];
        
        if (paintingTools.includes(toolName)) {
            colorPickerPanel.style.display = 'block';
            this.setupColorPicker();
        } else {
            colorPickerPanel.style.display = 'none';
        }
        
        // Atualizar cursor baseado na ferramenta
        const viewport = document.getElementById('preview-viewport');
        viewport.style.cursor = this.getToolCursor(toolName);
    }

    selectPreviewTool(toolId) {
        document.querySelectorAll('.preview-controls .btn-icon').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(toolId).classList.add('active');
        this.logMessage(`Ferramenta de preview selecionada: ${toolId}`, 'info');
    }

    switchTab(tabName, element) {
        const tabContainer = element.closest('.panel-tabs') || element.closest('.preview-tabs');
        tabContainer.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        element.classList.add('active');
        
        // Mostrar/ocultar conteúdo baseado na aba
        if (tabName === 'script-editor') {
            document.getElementById('console-output').style.display = 'none';
            document.getElementById('script-editor').style.display = 'block';
        } else if (tabName === 'console') {
            document.getElementById('console-output').style.display = 'block';
            document.getElementById('script-editor').style.display = 'none';
        }
        
        this.logMessage(`Aba alterada para: ${tabName}`, 'info');
    }

    handleMenuAction(action) {
        switch (action) {
            case 'file':
                this.showFileMenu();
                break;
            case 'edit':
                this.logMessage('Menu Edit clicado', 'info');
                break;
            case 'view':
                this.logMessage('Menu View clicado', 'info');
                break;
            case 'build':
                this.buildProject();
                break;
            case 'window':
                this.logMessage('Menu Window clicado', 'info');
                break;
            case 'help':
                this.showHelp();
                break;
        }
    }

    showFileMenu() {
        const fileMenu = document.getElementById('file-menu');
        const isVisible = fileMenu.style.display === 'block';
        
        // Fechar todos os menus primeiro
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
        
        // Mostrar o menu se não estava visível
        if (!isVisible) {
            fileMenu.style.display = 'block';
            // Posicionar o menu abaixo do botão File
            const fileButton = document.querySelector('[data-menu="file"]');
            const rect = fileButton.getBoundingClientRect();
            fileMenu.style.left = rect.left + 'px';
            fileMenu.style.top = (rect.bottom + 2) + 'px';
        }
    }
    
    async handleFileAction(action) {
        try {
            switch (action) {
                case 'new':
                    await this.newProject();
                    break;
                case 'open':
                    await this.openProject();
                    break;
                case 'open-folder':
                    await this.openProjectFolder();
                    break;
                case 'save':
                    await this.saveProject();
                    break;
                case 'save-as':
                    await this.saveProjectAs();
                    break;
                case 'import-assets':
                    await this.importAssets();
                    break;
                case 'export':
                    await this.exportProject();
                    break;
                default:
                    this.logMessage(`Ação não implementada: ${action}`, 'warning');
            }
        } catch (error) {
            this.logMessage(`Erro na ação ${action}: ${error.message}`, 'error');
        }
    }
    
    async newProject() {
        if (this.hasUnsavedChanges()) {
            const save = confirm('Você tem alterações não salvas. Deseja salvar antes de criar um novo projeto?');
            if (save) {
                await this.saveProject();
            }
        }
        
        this.clearProject();
        this.logMessage('Novo projeto criado', 'success');
    }
    
    async openProject() {
        if (!fileSystemAPI.isFileSystemAccessSupported()) {
            // Fallback para navegadores sem suporte
            try {
                const file = await fileSystemAPI.uploadFile({
                    accept: '.json',
                    multiple: false
                });
                
                const projectData = JSON.parse(file.content);
                this.loadProject(projectData);
                this.logMessage(`Projeto ${file.name} carregado`, 'success');
            } catch (error) {
                throw new Error(`Erro ao carregar projeto: ${error.message}`);
            }
            return;
        }
        
        try {
            const file = await fileSystemAPI.openFile({
                accept: {
                    'application/json': ['.json']
                }
            });
            
            const projectData = JSON.parse(file.content);
            this.loadProject(projectData);
            this.currentProjectName = file.name;
            this.logMessage(`Projeto ${file.name} carregado`, 'success');
        } catch (error) {
            if (error.message.includes('cancelada')) {
                this.logMessage('Abertura de projeto cancelada', 'info');
            } else {
                throw error;
            }
        }
    }
    
    async openProjectFolder() {
        if (!fileSystemAPI.isFileSystemAccessSupported()) {
            this.logMessage('Abertura de pasta não suportada neste navegador', 'warning');
            return;
        }
        
        try {
            const directoryHandle = await fileSystemAPI.openDirectory();
            const files = await fileSystemAPI.listDirectoryFiles(directoryHandle);
            
            // Procurar por arquivos de projeto
            const projectFiles = files.filter(file => 
                file.name.endsWith('.json') && 
                (file.name.includes('project') || file.name.includes('scene'))
            );
            
            if (projectFiles.length === 0) {
                this.logMessage('Nenhum arquivo de projeto encontrado na pasta', 'warning');
                return;
            }
            
            // Se houver múltiplos arquivos, mostrar seleção
            if (projectFiles.length > 1) {
                // Implementar seleção de arquivo (por enquanto, pegar o primeiro)
                this.logMessage(`${projectFiles.length} arquivos de projeto encontrados. Carregando o primeiro.`, 'info');
            }
            
            const projectFile = await projectFiles[0].handle.getFile();
            const content = await projectFile.text();
            const projectData = JSON.parse(content);
            
            this.loadProject(projectData);
            this.currentProjectName = projectFile.name;
            this.currentProjectFolder = directoryHandle;
            this.logMessage(`Projeto ${projectFile.name} carregado da pasta`, 'success');
        } catch (error) {
            if (error.message.includes('cancelada')) {
                this.logMessage('Abertura de pasta cancelada', 'info');
            } else {
                throw error;
            }
        }
    }
    
    async saveProject() {
        const projectData = this.getProjectData();
        const content = JSON.stringify(projectData, null, 2);
        
        if (!fileSystemAPI.isFileSystemAccessSupported()) {
            // Fallback para download
            const filename = this.currentProjectName || 'projeto.json';
            fileSystemAPI.downloadFile(content, filename, 'application/json');
            this.logMessage(`Projeto baixado como ${filename}`, 'success');
            return;
        }
        
        try {
            if (fileSystemAPI.currentFileHandle) {
                await fileSystemAPI.saveCurrentFile(content);
                this.logMessage('Projeto salvo', 'success');
            } else {
                await this.saveProjectAs();
            }
            this.markAsSaved();
        } catch (error) {
            throw error;
        }
    }
    
    async saveProjectAs() {
        const projectData = this.getProjectData();
        const content = JSON.stringify(projectData, null, 2);
        
        if (!fileSystemAPI.isFileSystemAccessSupported()) {
            const filename = prompt('Nome do arquivo:', this.currentProjectName || 'projeto.json');
            if (filename) {
                fileSystemAPI.downloadFile(content, filename, 'application/json');
                this.logMessage(`Projeto baixado como ${filename}`, 'success');
            }
            return;
        }
        
        try {
            const fileHandle = await fileSystemAPI.saveAsFile(content, {
                suggestedName: this.currentProjectName || 'projeto.json',
                accept: {
                    'application/json': ['.json']
                }
            });
            
            this.currentProjectName = fileHandle.name;
            this.markAsSaved();
            this.logMessage(`Projeto salvo como ${fileHandle.name}`, 'success');
        } catch (error) {
            if (error.message.includes('cancelada')) {
                this.logMessage('Salvamento cancelado', 'info');
            } else {
                throw error;
            }
        }
    }
    
    async importAssets() {
        if (!fileSystemAPI.isFileSystemAccessSupported()) {
            try {
                const files = await fileSystemAPI.uploadFile({
                    accept: '.svg,.png,.jpg,.jpeg,.json',
                    multiple: true
                });
                
                for (const file of files) {
                    this.addImportedAsset(file);
                }
                
                this.logMessage(`${files.length} asset(s) importado(s)`, 'success');
            } catch (error) {
                throw new Error(`Erro ao importar assets: ${error.message}`);
            }
            return;
        }
        
        try {
            const files = await fileSystemAPI.openMultipleFiles({
                accept: {
                    'image/svg+xml': ['.svg'],
                    'image/png': ['.png'],
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'application/json': ['.json']
                }
            });
            
            for (const file of files) {
                this.addImportedAsset(file);
            }
            
            this.logMessage(`${files.length} asset(s) importado(s)`, 'success');
        } catch (error) {
            if (error.message.includes('cancelada')) {
                this.logMessage('Importação cancelada', 'info');
            } else {
                throw error;
            }
        }
    }
    
    async exportProject() {
        const projectData = this.getProjectData();
        const content = JSON.stringify(projectData, null, 2);
        
        if (!fileSystemAPI.isFileSystemAccessSupported()) {
            fileSystemAPI.downloadFile(content, 'projeto-exportado.json', 'application/json');
            this.logMessage('Projeto exportado', 'success');
            return;
        }
        
        try {
            await fileSystemAPI.saveAsFile(content, {
                suggestedName: 'projeto-exportado.json',
                accept: {
                    'application/json': ['.json']
                }
            });
            
            this.logMessage('Projeto exportado', 'success');
        } catch (error) {
            if (error.message.includes('cancelada')) {
                this.logMessage('Exportação cancelada', 'info');
            } else {
                throw error;
            }
        }
    }
    
    clearProject() {
        // Limpar dados do projeto
        this.gameObjects = [];
        this.selectedObject = null;
        this.currentProjectName = null;
        this.currentProjectFolder = null;
        fileSystemAPI.clearCurrentFile();
        
        // Limpar interface
        this.updateHierarchy();
        this.updateInspector();
        this.markAsSaved();
    }
    
    loadProject(projectData) {
        this.clearProject();
        
        // Carregar dados do projeto
        if (projectData.gameObjects) {
            this.gameObjects = projectData.gameObjects;
        }
        
        if (projectData.settings) {
            // Aplicar configurações do projeto
        }
        
        // Atualizar interface
        this.updateHierarchy();
        this.updateInspector();
        this.markAsSaved();
    }
    
    getProjectData() {
        return {
            version: '1.0.0',
            name: this.currentProjectName || 'Projeto Sem Nome',
            created: new Date().toISOString(),
            gameObjects: this.gameObjects,
            settings: {
                gridSize: { width: 80, height: 40 },
                viewportSize: { width: 1024, height: 768 }
            }
        };
    }
    
    addImportedAsset(file) {
        // Adicionar asset importado à lista de assets
        const assetContainer = document.querySelector('.assets-grid');
        if (!assetContainer) return;
        
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.draggable = true;
        
        if (file.name.endsWith('.svg')) {
            assetItem.innerHTML = `
                <div class="asset-icon">
                    <div class="svg-preview">${file.content}</div>
                </div>
                <span class="asset-name">${file.name}</span>
            `;
        } else {
            assetItem.innerHTML = `
                <div class="asset-icon">📄</div>
                <span class="asset-name">${file.name}</span>
            `;
        }
        
        // Configurar drag and drop
        assetItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: 'custom-asset',
                name: file.name,
                content: file.content,
                type: file.type || 'unknown'
            }));
        });
        
        assetContainer.appendChild(assetItem);
    }
    
    hasUnsavedChanges() {
        // Implementar lógica para detectar mudanças não salvas
        return false; // Por enquanto, sempre false
    }
    
    markAsSaved() {
        // Marcar projeto como salvo
        document.title = `Isoria Engine - ${this.currentProjectName || 'Projeto Sem Nome'}`;
    }

    addAssetToScene(assetData, x, y) {
        let objectType, objectKey, objectName;
        
        switch (assetData.id) {
            case 'tile':
                objectType = 'tile';
                objectKey = 'grass';
                break;
            case 'player':
                objectType = 'sprite';
                objectKey = 'player';
                break;
            case 'npc':
                objectType = 'sprite';
                objectKey = 'npc';
                break;
            case 'chest':
                objectType = 'sprite';
                objectKey = 'chest';
                break;
            case 'tree':
                objectType = 'sprite';
                objectKey = 'tree';
                break;
            default:
                objectType = 'sprite';
                objectKey = 'default';
        }
        
        objectName = `${assetData.name}_${Date.now()}`;
        
        // Calcular posição isométrica baseada no clique
        const rect = document.getElementById('preview-viewport').getBoundingClientRect();
        const viewportX = x - rect.left;
        const viewportY = y - rect.top;
        
        // Converter coordenadas de tela para coordenadas de mundo isométrico
        // Ajustar com base no scroll e zoom da câmera
        const worldX = (viewportX / this.phaserGame.scale.zoom) + this.phaserGame.cameras.main.scrollX;
        const worldY = (viewportY / this.phaserGame.scale.zoom) + this.phaserGame.cameras.main.scrollY;
        
        // Converter para coordenadas de tile isométrico (se necessário)
        const tileX = Math.floor(worldX / this.sceneData.tileConfig.width);
        const tileY = Math.floor(worldY / this.sceneData.tileConfig.height);
        
        // Criar objeto de dados para o novo elemento
        const objectData = {
            id: objectName,
            name: objectName,
            type: objectType,
            key: objectKey,
            position: [worldX, worldY],
            tilePosition: [tileX, tileY],
            visible: true,
            properties: {}
        };
        
        // Adicionar à cena do Phaser (será feito no próximo render)
        this.sceneData.objects.push(objectData);
        
        // Atualizar a interface
        this.buildSceneHierarchy();
        this.saveSceneToServer();
        
        this.logMessage(`Asset ${assetData.name} adicionado à cena`, 'info');
    }

    deleteSelectedObject() {
        if (!this.selectedObject) return;
        
        // Remover dos dados da cena
        this.sceneData.objects = this.sceneData.objects.filter(obj => obj.id !== this.selectedObject);
        
        // Atualizar interface
        this.buildSceneHierarchy();
        this.updateInspector(null);
        this.selectedObject = null;
        
        this.saveSceneToServer();
        this.logMessage('Objeto deletado', 'warning');
    }

    deselectAll() {
        document.querySelectorAll('.tree-item.selected, .asset-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        this.selectedObject = null;
        this.updateInspector(null);
    }

    togglePlayPause() {
        if (this.isRunning) {
            this.pauseGame();
        } else {
            this.playGame();
        }
    }

    // Métodos de projeto
    async saveProject() {
        try {
            const response = await fetch('/api/project/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.projectData)
            });
            
            if (response.ok) {
                this.logMessage('Projeto salvo com sucesso', 'info');
            } else {
                this.logMessage('Erro ao salvar projeto', 'error');
            }
        } catch (error) {
            this.logMessage('Erro ao salvar projeto', 'error');
        }
    }

    async saveSceneToServer() {
        try {
            const response = await fetch('/api/scene/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.sceneData)
            });
            
            if (!response.ok) {
                this.logMessage('Erro ao salvar cena no servidor', 'warning');
            }
        } catch (error) {
            this.logMessage('Erro ao salvar cena no servidor', 'warning');
        }
    }

    async loadProjectData() {
        try {
            const response = await fetch('/api/project/current');
            if (response.ok) {
                this.projectData = await response.json();
            }
        } catch (error) {
            this.logMessage('Usando dados de projeto padrão', 'info');
        }
    }

    buildProject() {
        this.logMessage('Iniciando build do projeto...', 'info');
        // Implementar lógica de build
        setTimeout(() => {
            this.logMessage('Build concluído com sucesso', 'info');
        }, 2000);
    }

    showHelp() {
        this.logMessage('Abrindo documentação...', 'info');
        // Implementar sistema de ajuda
    }

    updateGameLogic() {
        // Lógica de atualização do jogo quando em execução
        this.scene.children.forEach(child => {
            if (child.userData.script) {
                // Executar scripts dos objetos
            }
        });
    }

    // Sistema de log
    logMessage(message, type = 'info') {
        const console = document.getElementById('console-output');
        const timestamp = new Date().toLocaleTimeString();
        
        const logLine = document.createElement('div');
        logLine.className = `console-line ${type}`;
        logLine.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message">${message}</span>
        `;
        
        console.appendChild(logLine);
        console.scrollTop = console.scrollHeight;
        
        // Limitar número de mensagens
        const lines = console.querySelectorAll('.console-line');
        if (lines.length > 100) {
            lines[0].remove();
        }
    }

    // Remover objeto
    removeObject(objectId) {
        if (!objectId) return;
        
        // Remover dos dados da cena
        this.sceneData.objects = this.sceneData.objects.filter(obj => obj.id !== objectId);
        
        // Atualizar interface
        this.buildSceneHierarchy();
        
        // Se o objeto removido era o selecionado, limpar a seleção
        if (this.selectedObject === objectId) {
            this.selectedObject = null;
            this.updateInspector(null);
        }
        
        this.saveSceneToServer();
        this.logMessage(`Objeto removido: ${objectId}`, 'warning');
    }

    // ===== FERRAMENTAS DE DESENHO =====

    // Obter cursor para cada ferramenta
    getToolCursor(toolName) {
        const cursors = {
            'select': 'default',
            'move': 'move',
            'rotate': 'grab',
            'scale': 'nw-resize',
            'paint': 'crosshair',
            'brush': 'crosshair',
            'fill': 'crosshair',
            'line': 'crosshair',
            'rectangle': 'crosshair',
            'eraser': 'crosshair'
        };
        return cursors[toolName] || 'default';
    }

    setupColorPicker() {
        // Configurar cores pré-definidas
        const presetColors = document.querySelectorAll('.color-swatch');
        presetColors.forEach(colorBtn => {
            colorBtn.addEventListener('click', () => {
                const color = colorBtn.dataset.color;
                this.currentColor = color;
                this.updateColorDisplay();
            });
        });

        // Configurar sliders RGBA
        const rSlider = document.getElementById('red-input');
        const gSlider = document.getElementById('green-input');
        const bSlider = document.getElementById('blue-input');
        const aSlider = document.getElementById('alpha-input');

        const updateColorFromSliders = () => {
            const r = rSlider.value;
            const g = gSlider.value;
            const b = bSlider.value;
            const a = aSlider.value;
            this.currentColor = `rgba(${r}, ${g}, ${b}, ${a})`;
            this.updateColorDisplay();
        };

        rSlider.addEventListener('input', updateColorFromSliders);
        gSlider.addEventListener('input', updateColorFromSliders);
        bSlider.addEventListener('input', updateColorFromSliders);
        aSlider.addEventListener('input', updateColorFromSliders);

        // Inicializar display da cor
        this.updateColorDisplay();
    }

    updateColorDisplay() {
        const colorDisplay = document.getElementById('current-color');
        if (colorDisplay) {
            colorDisplay.style.backgroundColor = this.currentColor;
        }

        // Atualizar valores dos sliders baseado na cor atual
        const rgba = this.parseRGBA(this.currentColor);
        if (rgba) {
            // Atualizar sliders
            document.getElementById('red-input').value = rgba.r;
            document.getElementById('green-input').value = rgba.g;
            document.getElementById('blue-input').value = rgba.b;
            document.getElementById('alpha-input').value = rgba.a;
            
            // Atualizar valores numéricos exibidos
            document.getElementById('red-value').textContent = rgba.r;
            document.getElementById('green-value').textContent = rgba.g;
            document.getElementById('blue-value').textContent = rgba.b;
            document.getElementById('alpha-value').textContent = rgba.a.toFixed(1);
        }
    }

    parseRGBA(rgbaString) {
        const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }
        return null;
    }

    fillCanvas() {
        // Calcular os limites da grade visível
        const viewport = document.getElementById('preview-viewport');
        const viewportWidth = viewport.clientWidth;
        const viewportHeight = viewport.clientHeight;
        
        const tileWidth = 64;
        const tileHeight = 32;
        
        const tilesX = Math.ceil(viewportWidth / (tileWidth / 2)) + 4;
        const tilesY = Math.ceil(viewportHeight / (tileHeight / 2)) + 4;
        
        const startX = -Math.floor(tilesX / 2);
        const endX = Math.floor(tilesX / 2);
        const startY = -Math.floor(tilesY / 2);
        const endY = Math.floor(tilesY / 2);
        
        // Remover todos os tiles da camada atual
        this.sceneData.objects = this.sceneData.objects.filter(obj => 
            !(obj.layer === this.currentLayer && obj.type === 'tile')
        );
        
        // Preencher toda a área visível com a cor atual
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const tileId = `fill_${x}_${y}_${this.currentLayer}`;
                const worldCoords = this.tileToWorldCoords(x, y);
                
                const tileData = {
                    id: tileId,
                    name: `fill_${x}_${y}`,
                    type: 'tile',
                    color: this.currentColor,
                    position: [worldCoords.worldX, worldCoords.worldY],
                    tilePosition: [x, y],
                    layer: this.currentLayer,
                    visible: true,
                    properties: {}
                };
                
                this.sceneData.objects.push(tileData);
            }
        }
        
        this.updateSceneRender();
        this.logMessage('Canvas preenchido com cor selecionada', 'info');
    }

    // Converter coordenadas de tela para coordenadas de tile isométrico
    screenToTileCoords(screenX, screenY) {
        const rect = document.getElementById('preview-viewport').getBoundingClientRect();
        const viewportX = screenX - rect.left;
        const viewportY = screenY - rect.top;
        
        // Converter para coordenadas de mundo considerando zoom e scroll da câmera
        const worldX = (viewportX / this.phaserGame.scale.zoom) + this.phaserGame.cameras.main.scrollX;
        const worldY = (viewportY / this.phaserGame.scale.zoom) + this.phaserGame.cameras.main.scrollY;
        
        // Converter para coordenadas de tile isométrico
        const tileWidth = this.sceneData.tileConfig.width;
        const tileHeight = this.sceneData.tileConfig.height;
        
        // Fórmula de conversão isométrica
        const tileX = Math.floor((worldX / tileWidth + worldY / tileHeight) / 2);
        const tileY = Math.floor((worldY / tileHeight - worldX / tileWidth) / 2);
        
        return { tileX, tileY, worldX, worldY };
    }

    // Converter coordenadas de tile para coordenadas de mundo
    tileToWorldCoords(tileX, tileY) {
        const tileWidth = this.sceneData.tileConfig.width;
        const tileHeight = this.sceneData.tileConfig.height;
        
        const worldX = (tileX - tileY) * tileWidth / 2;
        const worldY = (tileX + tileY) * tileHeight / 2;
        
        return { worldX, worldY };
    }

    // Manipuladores de eventos do canvas
    handleCanvasMouseDown(e) {
        if (e.button !== 0) return; // Apenas botão esquerdo
        
        const coords = this.screenToTileCoords(e.clientX, e.clientY);
        this.isDrawing = true;
        this.drawStartPos = coords;
        
        switch (this.currentTool) {
            case 'brush':
            case 'paint':
                this.paintTile(coords.tileX, coords.tileY);
                break;
            case 'eraser':
                this.eraseTile(coords.tileX, coords.tileY);
                break;
            case 'fill':
                this.floodFill(coords.tileX, coords.tileY);
                break;
        }
    }

    handleCanvasMouseMove(e) {
        if (!this.isDrawing) return;
        
        const coords = this.screenToTileCoords(e.clientX, e.clientY);
        
        switch (this.currentTool) {
            case 'brush':
            case 'paint':
                this.paintTile(coords.tileX, coords.tileY);
                break;
            case 'eraser':
                this.eraseTile(coords.tileX, coords.tileY);
                break;
        }
    }

    handleCanvasMouseUp(e) {
        if (!this.isDrawing) return;
        
        const coords = this.screenToTileCoords(e.clientX, e.clientY);
        
        switch (this.currentTool) {
            case 'line':
                this.drawLine(this.drawStartPos.tileX, this.drawStartPos.tileY, coords.tileX, coords.tileY);
                break;
            case 'rectangle':
                this.drawRectangle(this.drawStartPos.tileX, this.drawStartPos.tileY, coords.tileX, coords.tileY);
                break;
        }
        
        this.isDrawing = false;
        this.drawStartPos = null;
        this.saveSceneToServer();
    }

    handleCanvasClick(e) {
        if (this.currentTool === 'select') {
            // Lógica de seleção de objetos
            this.selectObjectAtPosition(e.clientX, e.clientY);
        }
    }

    // Ferramentas de desenho específicas
    paintTile(tileX, tileY) {
        const tileId = `tile_${tileX}_${tileY}_${this.currentLayer}`;
        const worldCoords = this.tileToWorldCoords(tileX, tileY);
        
        // Remover tile existente na mesma posição e camada
        this.sceneData.objects = this.sceneData.objects.filter(obj => 
            !(obj.tilePosition && obj.tilePosition[0] === tileX && obj.tilePosition[1] === tileY && obj.layer === this.currentLayer)
        );
        
        let tileData;
        
        if (this.currentTool === 'paint') {
            // Para ferramenta paint, usar cor personalizada
            tileData = {
                id: tileId,
                name: `paint_${tileX}_${tileY}`,
                type: 'tile',
                color: this.currentColor,
                position: [worldCoords.worldX, worldCoords.worldY],
                tilePosition: [tileX, tileY],
                layer: this.currentLayer,
                visible: true,
                properties: {}
            };
        } else {
            // Para outras ferramentas, usar asset selecionado
            if (!this.selectedAsset) {
                this.logMessage('Selecione um asset primeiro', 'warning');
                return;
            }
            
            tileData = {
                id: tileId,
                name: `${this.selectedAsset.name}_${tileX}_${tileY}`,
                type: 'sprite',
                key: this.selectedAsset.id,
                position: [worldCoords.worldX, worldCoords.worldY],
                tilePosition: [tileX, tileY],
                layer: this.currentLayer,
                visible: true,
                properties: {}
            };
        }
        
        this.sceneData.objects.push(tileData);
        this.updateSceneRender();
    }

    eraseTile(tileX, tileY) {
        const tileId = `tile_${tileX}_${tileY}_${this.currentLayer}`;
        const worldCoords = this.tileToWorldCoords(tileX, tileY);
        
        // Remover tile existente na posição e camada atual
        this.sceneData.objects = this.sceneData.objects.filter(obj => 
            !(obj.tilePosition && obj.tilePosition[0] === tileX && obj.tilePosition[1] === tileY && obj.layer === this.currentLayer)
        );
        
        // Adicionar tile com cor de fundo (borracha)
        const tileData = {
            id: tileId,
            name: `erase_${tileX}_${tileY}`,
            type: 'tile',
            color: this.backgroundColor,
            position: [worldCoords.worldX, worldCoords.worldY],
            tilePosition: [tileX, tileY],
            layer: this.currentLayer,
            visible: true,
            properties: {}
        };
        
        this.sceneData.objects.push(tileData);
        this.updateSceneRender();
    }

    floodFill(startX, startY) {
        if (this.currentTool === 'fill') {
            // Para ferramenta fill, preencher todo o canvas como background
            this.fillCanvas();
            return;
        }
        
        if (!this.selectedAsset) {
            this.logMessage('Selecione um asset primeiro', 'warning');
            return;
        }
        
        // Obter o tipo de tile na posição inicial
        const startTile = this.sceneData.objects.find(obj => 
            obj.tilePosition && obj.tilePosition[0] === startX && obj.tilePosition[1] === startY && obj.layer === this.currentLayer
        );
        
        const targetKey = startTile ? startTile.key : null;
        const replacementKey = this.selectedAsset.id;
        
        if (targetKey === replacementKey) {
            return; // Não há necessidade de preencher
        }
        
        const visited = new Set();
        const stack = [[startX, startY]];
        const maxIterations = 1000; // Limite de segurança
        let iterations = 0;
        
        while (stack.length > 0 && iterations < maxIterations) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const currentTile = this.sceneData.objects.find(obj => 
                obj.tilePosition && obj.tilePosition[0] === x && obj.tilePosition[1] === y && obj.layer === this.currentLayer
            );
            
            const currentKey = currentTile ? currentTile.key : null;
            
            if (currentKey === targetKey) {
                this.paintTile(x, y);
                
                // Adicionar tiles adjacentes à pilha
                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
            
            iterations++;
        }
        
        this.saveSceneToServer();
        this.logMessage(`Flood fill concluído (${iterations} tiles processados)`, 'info');
    }

    drawLine(x1, y1, x2, y2) {
        if (this.currentTool !== 'line' && !this.selectedAsset) {
            this.logMessage('Selecione um asset primeiro', 'warning');
            return;
        }
        
        // Algoritmo de Bresenham para linha
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            if (this.currentTool === 'line') {
                // Para ferramenta line, desenhar tile com cor
                const tileId = `line_${x}_${y}_${this.currentLayer}`;
                const worldCoords = this.tileToWorldCoords(x, y);
                
                // Remover tile existente na posição
                this.sceneData.objects = this.sceneData.objects.filter(obj => 
                    !(obj.tilePosition && obj.tilePosition[0] === x && obj.tilePosition[1] === y && obj.layer === this.currentLayer)
                );
                
                const tileData = {
                    id: tileId,
                    name: `line_${x}_${y}`,
                    type: 'tile',
                    color: this.currentColor,
                    position: [worldCoords.worldX, worldCoords.worldY],
                    tilePosition: [x, y],
                    layer: this.currentLayer,
                    visible: true,
                    properties: {}
                };
                
                this.sceneData.objects.push(tileData);
            } else {
                this.paintTile(x, y);
            }
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        this.updateSceneRender();
        this.saveSceneToServer();
    }

    drawRectangle(x1, y1, x2, y2) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        if (this.currentTool === 'rectangle') {
            // Para ferramenta rectangle, desenhar com cor personalizada
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const tileId = `rect_${x}_${y}_${this.currentLayer}`;
                    const worldCoords = this.tileToWorldCoords(x, y);
                    
                    // Remover tile existente na posição
                    this.sceneData.objects = this.sceneData.objects.filter(obj => 
                        !(obj.tilePosition && obj.tilePosition[0] === x && obj.tilePosition[1] === y && obj.layer === this.currentLayer)
                    );
                    
                    const tileData = {
                        id: tileId,
                        name: `rect_${x}_${y}`,
                        type: 'tile',
                        color: this.currentColor,
                        position: [worldCoords.worldX, worldCoords.worldY],
                        tilePosition: [x, y],
                        layer: this.currentLayer,
                        visible: true,
                        properties: {}
                    };
                    
                    this.sceneData.objects.push(tileData);
                }
            }
            this.updateSceneRender();
        } else {
            // Para outras ferramentas, usar asset selecionado
            if (!this.selectedAsset) {
                this.logMessage('Selecione um asset primeiro', 'warning');
                return;
            }
            
            // Desenhar retângulo preenchido com asset
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    this.paintTile(x, y);
                }
            }
        }
        
        this.saveSceneToServer();
    }

    // Seleção de objetos
    selectObjectAtPosition(screenX, screenY) {
        const coords = this.screenToTileCoords(screenX, screenY);
        
        // Encontrar objeto na posição clicada
        const objectAtPosition = this.sceneData.objects.find(obj => 
            obj.tilePosition && obj.tilePosition[0] === coords.tileX && obj.tilePosition[1] === coords.tileY
        );
        
        if (objectAtPosition) {
            this.selectedObject = objectAtPosition.id;
            this.updateInspector(objectAtPosition);
            this.buildSceneHierarchy();
            this.logMessage(`Objeto selecionado: ${objectAtPosition.name}`, 'info');
        } else {
            this.deselectAll();
        }
    }

    // Atualizar renderização da cena
    updateSceneRender() {
        if (this.phaserGame && this.phaserGame.scene.scenes[0]) {
            const scene = this.phaserGame.scene.scenes[0];
            // Recriar objetos da cena
            scene.children.removeAll();
            this.createSceneObjects(scene);
        }
    }

    createSceneObjects(scene) {
        // Recriar grade isométrica
        this.setupIsometricGrid();
        
        // Criar objetos baseados nos dados da cena
        this.sceneData.objects.forEach(obj => {
            if (!this.layerVisibility[obj.layer]) return; // Pular se camada estiver oculta
            
            if (obj.type === 'tile' && obj.color) {
                // Criar tile colorido
                const graphics = scene.add.graphics();
                const tileWidth = 64;
                const tileHeight = 32;
                
                // Converter cor RGBA para formato Phaser
                const rgba = this.parseRGBA(obj.color);
                if (rgba) {
                    const color = Phaser.Display.Color.GetColor(rgba.r, rgba.g, rgba.b);
                    
                    graphics.fillStyle(color, rgba.a);
                    graphics.lineStyle(1, 0x666666, 0.5);
                    
                    // Desenhar losango
                    graphics.beginPath();
                    graphics.moveTo(obj.position[0], obj.position[1] - tileHeight / 2); // Top
                    graphics.lineTo(obj.position[0] + tileWidth / 2, obj.position[1]); // Right
                    graphics.lineTo(obj.position[0], obj.position[1] + tileHeight / 2); // Bottom
                    graphics.lineTo(obj.position[0] - tileWidth / 2, obj.position[1]); // Left
                    graphics.closePath();
                    graphics.fillPath();
                    graphics.strokePath();
                }
            } else if (obj.type === 'sprite' && obj.key) {
                // Criar sprite baseado em asset
                // Por enquanto, criar um retângulo colorido como placeholder
                const rect = scene.add.rectangle(
                    obj.position[0], 
                    obj.position[1], 
                    32, 32, 
                    0x00ff00
                );
                rect.setStrokeStyle(2, 0x000000);
            }
        });
    }

    // ===== SISTEMA DE CAMADAS =====

    // Alternar camada atual
    setCurrentLayer(layerName) {
        this.currentLayer = layerName;
        this.logMessage(`Camada atual: ${layerName}`, 'info');
        this.updateLayerInterface();
    }

    // Alternar visibilidade da camada
    toggleLayerVisibility(layerName) {
        this.layerVisibility[layerName] = !this.layerVisibility[layerName];
        this.updateSceneRender();
        this.updateLayerInterface();
        this.logMessage(`Camada ${layerName}: ${this.layerVisibility[layerName] ? 'visível' : 'oculta'}`, 'info');
    }

    // Atualizar interface das camadas
    updateLayerInterface() {
        // Atualizar botões de camada na interface
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.layer === this.currentLayer) {
                btn.classList.add('active');
            }
        });
        
        // Atualizar indicadores de visibilidade
        document.querySelectorAll('.layer-visibility').forEach(btn => {
            const layer = btn.dataset.layer;
            btn.classList.toggle('hidden', !this.layerVisibility[layer]);
        });
    }

    // Selecionar asset
    selectAsset(assetId, element) {
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        element.classList.add('selected');
        
        // Encontrar dados do asset
        const assetData = this.getAssetData(assetId);
        this.selectedAsset = assetData;
        
        this.logMessage(`Asset selecionado: ${assetData ? assetData.name : assetId}`, 'info');
    }

    // Obter dados do asset
    getAssetData(assetId) {
        // Procurar nos assets padrão
        const defaultAssets = {
            'grass': { id: 'grass', name: 'Grama', type: 'biome' },
            'rock': { id: 'rock', name: 'Rocha', type: 'biome' },
            'sand': { id: 'sand', name: 'Areia', type: 'biome' },
            'water': { id: 'water', name: 'Água', type: 'biome' },
            'tree': { id: 'tree', name: 'Árvore', type: 'nature' },
            'bush': { id: 'bush', name: 'Arbusto', type: 'nature' },
            'stone': { id: 'stone', name: 'Pedra', type: 'nature' }
        };
        
        return defaultAssets[assetId] || { id: assetId, name: assetId, type: 'custom' };
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.engineTools = new EngineTools();
});