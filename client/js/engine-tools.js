// Isoria Engine Tools - Interface Visual para Framework de Scripts
// Sistema integrado de desenvolvimento visual e por código

class EngineTools {
    constructor() {
        this.currentMode = 'visual'; // 'visual' ou 'script'
        this.visualTools = [];
        this.selectedObject = null;
        this.isRunning = false;
        this.engine = window.IsoriaEngineInstance;
        
        this.initializeInterface();
        this.initializeEventListeners();
        this.loadDocumentation();
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