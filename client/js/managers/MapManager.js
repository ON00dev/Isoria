/**
 * Gerenciador de mapa isométrico
 * Responsável por carregar, renderizar e gerenciar o mapa do jogo
 */
class MapManager {
    /**
     * Cria um novo gerenciador de mapa
     * @param {Phaser.Scene} scene - Cena do Phaser
     * @param {IsometricHelper} isoHelper - Helper para cálculos isométricos
     */
    constructor(scene, isoHelper) {
        this.scene = scene;
        this.isoHelper = isoHelper;
        this.map = null;
        this.tileset = null;
        this.layers = {};
        this.collisionLayer = null;
        this.decorationLayer = null;
        this.groundLayer = null;
        this.collisionTiles = [];
        this.pathfinder = null;
        this.grid = null;
    }

    /**
     * Carrega o mapa
     * @param {string} mapKey - Chave do mapa no cache do Phaser
     * @param {string} tilesetKey - Chave do tileset no cache do Phaser
     */
    loadMap(mapKey = 'map', tilesetKey = 'tiles') {
        // Carrega o mapa
        this.map = this.scene.make.tilemap({ key: mapKey });
        
        // Adiciona o tileset
        this.tileset = this.map.addTilesetImage(this.map.tilesets[0].name, tilesetKey);
        
        // Cria as camadas
        this.createLayers();
        
        // Configura as colisões
        this.setupCollisions();
        
        // Inicializa o pathfinder
        this.initPathfinder();
    }

    /**
     * Cria as camadas do mapa
     */
    createLayers() {
        // Camada do chão
        this.groundLayer = this.map.createLayer('Ground', this.tileset, 0, 0);
        this.layers.ground = this.groundLayer;
        
        // Camada de obstáculos
        this.collisionLayer = this.map.createLayer('Obstacles', this.tileset, 0, 0);
        this.layers.obstacles = this.collisionLayer;
        
        // Camada de decoração
        this.decorationLayer = this.map.createLayer('Decoration', this.tileset, 0, 0);
        this.layers.decoration = this.decorationLayer;
        
        // Configura a profundidade das camadas
        this.groundLayer.setDepth(0);
        this.collisionLayer.setDepth(1);
        this.decorationLayer.setDepth(2);
    }

    /**
     * Configura as colisões do mapa
     */
    setupCollisions() {
        // Configura as colisões baseadas nas propriedades dos tiles
        this.collisionTiles = [];
        
        // Percorre todos os tiles do tileset
        for (let i = 0; i < this.map.tilesets[0].total; i++) {
            const tileData = this.map.tilesets[0].getTileData(i);
            
            // Verifica se o tile tem a propriedade 'collides'
            if (tileData && tileData.properties && tileData.properties.collides) {
                this.collisionTiles.push(i + 1); // +1 porque os índices começam em 1 no Tiled
            }
        }
        
        // Configura as colisões na camada de obstáculos
        this.collisionLayer.setCollision(this.collisionTiles);
    }

    /**
     * Inicializa o pathfinder
     */
    initPathfinder() {
        // Cria o grid para o pathfinder
        this.createGrid();
        
        // Inicializa o pathfinder com o grid
        this.pathfinder = new AStarPathfinder(this.grid);
    }

    /**
     * Cria o grid para o pathfinder
     */
    createGrid() {
        const width = this.map.width;
        const height = this.map.height;
        
        // Calcular o raio do losango
        let radius;
        if (this.scene.engineTools && this.scene.engineTools.sceneData && this.scene.engineTools.sceneData.settings) {
            if (this.scene.engineTools.sceneData.settings.mapRadius) {
                // Usar raio explícito do mapa se disponível
                radius = this.scene.engineTools.sceneData.settings.mapRadius;
            } else if (this.scene.engineTools.sceneData.settings.mapWidth && this.scene.engineTools.sceneData.settings.mapHeight) {
                // Calcular o raio com base nas dimensões do mapa
                const halfWidth = Math.floor(this.scene.engineTools.sceneData.settings.mapWidth / 2);
                const halfHeight = Math.floor(this.scene.engineTools.sceneData.settings.mapHeight / 2);
                radius = Math.min(halfWidth, halfHeight);
            } else {
                // Fallback para o gridSize
                const gridSize = this.scene.engineTools.sceneData.settings.gridSize || 20;
                radius = Math.floor(gridSize / 2);
            }
        } else {
            // Se não tiver acesso ao engineTools, usar as dimensões do mapa
            radius = Math.min(Math.floor(width / 2), Math.floor(height / 2));
        }
        
        // Função para verificar se um tile está dentro do losango
        const isValidTile = (x, y) => {
            // Converter para coordenadas relativas ao centro
            const centerX = Math.floor(width / 2);
            const centerY = Math.floor(height / 2);
            const relX = x - centerX;
            const relY = y - centerY;
            
            // Verificar se está dentro do losango
            return Math.abs(relX) + Math.abs(relY) <= radius;
        };
        
        // Cria o grid vazio
        this.grid = new Array(height);
        for (let y = 0; y < height; y++) {
            this.grid[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                // 0 = caminho livre, 1 = obstáculo
                // Marcar como obstáculo se estiver fora do losango
                this.grid[y][x] = isValidTile(x, y) ? 0 : 1;
            }
        }
        
        // Preenche o grid com os obstáculos do mapa
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Só verificar tiles dentro do losango
                if (isValidTile(x, y)) {
                    const tile = this.collisionLayer.getTileAt(x, y);
                    if (tile && this.collisionTiles.includes(tile.index)) {
                        this.grid[y][x] = 1;
                    }
                }
            }
        }
    }

    /**
     * Encontra um caminho entre dois pontos no mapa
     * @param {number} startX - Coordenada X inicial (em tiles)
     * @param {number} startY - Coordenada Y inicial (em tiles)
     * @param {number} endX - Coordenada X final (em tiles)
     * @param {number} endY - Coordenada Y final (em tiles)
     * @returns {Array|null} - Array de pontos do caminho ou null se não houver caminho
     */
    findPath(startX, startY, endX, endY) {
        // Verifica se as coordenadas estão dentro do mapa
        if (
            startX < 0 || startX >= this.map.width ||
            startY < 0 || startY >= this.map.height ||
            endX < 0 || endX >= this.map.width ||
            endY < 0 || endY >= this.map.height
        ) {
            return null;
        }
        
        // Calcular o raio do losango
        let radius;
        if (this.scene.engineTools && this.scene.engineTools.sceneData && this.scene.engineTools.sceneData.settings) {
            if (this.scene.engineTools.sceneData.settings.mapRadius) {
                // Usar raio explícito do mapa se disponível
                radius = this.scene.engineTools.sceneData.settings.mapRadius;
            } else if (this.scene.engineTools.sceneData.settings.mapWidth && this.scene.engineTools.sceneData.settings.mapHeight) {
                // Calcular o raio com base nas dimensões do mapa
                const halfWidth = Math.floor(this.scene.engineTools.sceneData.settings.mapWidth / 2);
                const halfHeight = Math.floor(this.scene.engineTools.sceneData.settings.mapHeight / 2);
                radius = Math.min(halfWidth, halfHeight);
            } else {
                // Fallback para o gridSize
                const gridSize = this.scene.engineTools.sceneData.settings.gridSize || 20;
                radius = Math.floor(gridSize / 2);
            }
        } else {
            // Se não tiver acesso ao engineTools, usar as dimensões do mapa
            radius = Math.min(Math.floor(this.map.width / 2), Math.floor(this.map.height / 2));
        }
        
        // Função para verificar se um tile está dentro do losango
        const isValidTile = (x, y) => {
            // Converter para coordenadas relativas ao centro
            const centerX = Math.floor(this.map.width / 2);
            const centerY = Math.floor(this.map.height / 2);
            const relX = x - centerX;
            const relY = y - centerY;
            
            // Verificar se está dentro do losango
            return Math.abs(relX) + Math.abs(relY) <= radius;
        };
        
        // Verifica se as coordenadas estão dentro do losango
        if (!isValidTile(startX, startY) || !isValidTile(endX, endY)) {
            return null;
        }
        
        // Verifica se o destino é um obstáculo
        if (this.grid[endY][endX] === 1) {
            return null;
        }
        
        // Encontra o caminho
        return this.pathfinder.findPath({ x: startX, y: startY }, { x: endX, y: endY });
    }

    /**
     * Converte coordenadas do mundo para coordenadas de tile
     * @param {number} worldX - Coordenada X do mundo
     * @param {number} worldY - Coordenada Y do mundo
     * @returns {Object} - Coordenadas do tile {x, y}
     */
    worldToTileCoordinates(worldX, worldY) {
        return this.isoHelper.worldToTileCoordinates(worldX, worldY);
    }

    /**
     * Converte coordenadas de tile para coordenadas do mundo
     * @param {number} tileX - Coordenada X do tile
     * @param {number} tileY - Coordenada Y do tile
     * @returns {Object} - Coordenadas do mundo {x, y}
     */
    tileToWorldCoordinates(tileX, tileY) {
        return this.isoHelper.tileToWorldCoordinates(tileX, tileY);
    }

    /**
     * Verifica se um ponto está dentro de um tile
     * @param {number} worldX - Coordenada X do mundo
     * @param {number} worldY - Coordenada Y do mundo
     * @param {number} tileX - Coordenada X do tile
     * @param {number} tileY - Coordenada Y do tile
     * @returns {boolean} - true se o ponto está dentro do tile, false caso contrário
     */
    isPointInTile(worldX, worldY, tileX, tileY) {
        return this.isoHelper.isPointInTile(worldX, worldY, tileX, tileY);
    }

    /**
     * Verifica se um tile é um obstáculo
     * @param {number} tileX - Coordenada X do tile
     * @param {number} tileY - Coordenada Y do tile
     * @returns {boolean} - true se o tile é um obstáculo, false caso contrário
     */
    isTileBlocked(tileX, tileY) {
        // Verifica se as coordenadas estão dentro do mapa
        if (
            tileX < 0 || tileX >= this.map.width ||
            tileY < 0 || tileY >= this.map.height
        ) {
            return true;
        }
        
        return this.grid[tileY][tileX] === 1;
    }

    /**
     * Obtém o ponto de spawn do jogador
     * @returns {Object} - Coordenadas do ponto de spawn {x, y}
     */
    getPlayerSpawnPoint() {
        // Procura por um objeto com o nome 'spawn_point' e tipo 'player'
        const spawnPoint = this.map.findObject('Objects', obj => {
            return obj.name === 'spawn_point' && obj.type === 'player';
        });
        
        // Retorna as coordenadas do ponto de spawn ou um ponto padrão
        if (spawnPoint) {
            return { x: spawnPoint.x, y: spawnPoint.y };
        } else {
            // Ponto de spawn padrão no centro do mapa
            const centerX = this.map.widthInPixels / 2;
            const centerY = this.map.heightInPixels / 2;
            return { x: centerX, y: centerY };
        }
    }

    /**
     * Desenha o grid de debug
     * @param {boolean} showGrid - true para mostrar o grid, false para esconder
     */
    drawDebugGrid(showGrid) {
        // Remove o grid anterior, se existir
        if (this.debugGraphics) {
            this.debugGraphics.clear();
            if (!showGrid) {
                return;
            }
        } else if (showGrid) {
            // Cria o objeto de gráficos para o debug
            this.debugGraphics = this.scene.add.graphics();
        } else {
            return;
        }
        
        // Desenha o grid
        this.debugGraphics.lineStyle(1, 0x00ff00, 0.5);
        
        // Calcular o raio do losango
        let radius;
        if (this.scene.engineTools && this.scene.engineTools.sceneData && this.scene.engineTools.sceneData.settings) {
            if (this.scene.engineTools.sceneData.settings.mapRadius) {
                // Usar raio explícito do mapa se disponível
                radius = this.scene.engineTools.sceneData.settings.mapRadius;
            } else if (this.scene.engineTools.sceneData.settings.mapWidth && this.scene.engineTools.sceneData.settings.mapHeight) {
                // Calcular o raio com base nas dimensões do mapa
                const halfWidth = Math.floor(this.scene.engineTools.sceneData.settings.mapWidth / 2);
                const halfHeight = Math.floor(this.scene.engineTools.sceneData.settings.mapHeight / 2);
                radius = Math.min(halfWidth, halfHeight);
            } else {
                // Fallback para o gridSize
                const gridSize = this.scene.engineTools.sceneData.settings.gridSize || 20;
                radius = Math.floor(gridSize / 2);
            }
        } else {
            // Se não tiver acesso ao engineTools, usar as dimensões do mapa
            radius = Math.min(Math.floor(this.map.width / 2), Math.floor(this.map.height / 2));
        }
        
        // Função para verificar se um tile está dentro do losango
        const isValidTile = (x, y) => {
            // Converter para coordenadas relativas ao centro
            const centerX = Math.floor(this.map.width / 2);
            const centerY = Math.floor(this.map.height / 2);
            const relX = x - centerX;
            const relY = y - centerY;
            
            // Verificar se está dentro do losango
            return Math.abs(relX) + Math.abs(relY) <= radius;
        };
        
        // Desenhar apenas os tiles dentro do losango
        // Primeiro, determinar os limites do grid
        const minX = 0;
        const maxX = this.map.width;
        const minY = 0;
        const maxY = this.map.height;
        
        // Desenhar linhas horizontais apenas para tiles válidos
        for (let y = minY; y <= maxY; y++) {
            let lineStarted = false;
            let lastX = null;
            
            for (let x = minX; x <= maxX; x++) {
                if (isValidTile(x, y)) {
                    const worldCoords = this.tileToWorldCoordinates(x, y);
                    
                    if (!lineStarted) {
                        this.debugGraphics.moveTo(worldCoords.x, worldCoords.y);
                        lineStarted = true;
                    } else {
                        this.debugGraphics.lineTo(worldCoords.x, worldCoords.y);
                    }
                    
                    lastX = x;
                } else if (lineStarted) {
                    // Terminar a linha se sair do losango
                    lineStarted = false;
                }
            }
        }
        
        // Desenhar linhas verticais apenas para tiles válidos
        for (let x = minX; x <= maxX; x++) {
            let lineStarted = false;
            let lastY = null;
            
            for (let y = minY; y <= maxY; y++) {
                if (isValidTile(x, y)) {
                    const worldCoords = this.tileToWorldCoordinates(x, y);
                    
                    if (!lineStarted) {
                        this.debugGraphics.moveTo(worldCoords.x, worldCoords.y);
                        lineStarted = true;
                    } else {
                        this.debugGraphics.lineTo(worldCoords.x, worldCoords.y);
                    }
                    
                    lastY = y;
                } else if (lineStarted) {
                    // Terminar a linha se sair do losango
                    lineStarted = false;
                }
            }
        }
        
        // Desenha os obstáculos apenas dentro do losango
        this.debugGraphics.fillStyle(0xff0000, 0.3);
        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                if (isValidTile(x, y) && this.grid[y][x] === 1) {
                    // Desenha um retângulo para cada obstáculo
                    const worldCoords = this.tileToWorldCoordinates(x, y);
                    const tileWidth = this.map.tileWidth;
                    const tileHeight = this.map.tileHeight;
                    
                    // Cria um polígono para o tile isométrico
                    const points = [
                        { x: worldCoords.x, y: worldCoords.y - tileHeight / 2 },
                        { x: worldCoords.x + tileWidth / 2, y: worldCoords.y },
                        { x: worldCoords.x, y: worldCoords.y + tileHeight / 2 },
                        { x: worldCoords.x - tileWidth / 2, y: worldCoords.y }
                    ];
                    
                    this.debugGraphics.beginPath();
                    this.debugGraphics.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        this.debugGraphics.lineTo(points[i].x, points[i].y);
                    }
                    this.debugGraphics.closePath();
                    this.debugGraphics.fillPath();
                }
            }
        }
        
        // Configura a profundidade do grid de debug
        this.debugGraphics.setDepth(100);
    }
}