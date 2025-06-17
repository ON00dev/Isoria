/**
 * Cena principal do jogo
 * Responsável pela lógica do jogo, renderização do mapa isométrico e gerenciamento dos jogadores
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Inicializa as variáveis da cena
        this.player = null;
        this.otherPlayers = {};
        this.cursors = null;
        this.socketManager = null;
        this.map = null;
        this.mapLayers = {};
        this.pathfinder = null;
        this.targetPosition = null;
        this.lastAttackTime = 0;
        this.playerMoving = false;
        this.currentPath = [];
    }

    create() {
        // Cria o gerenciador de socket
        this.socketManager = new SocketManager(this);

        // Cria os controles do teclado
        this.cursors = this.input.keyboard.createCursorKeys();

        // Carrega o mapa isométrico
        this.createMap();

        // Configura a câmera
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Adiciona eventos de input
        this.input.on('pointerdown', this.handlePointerDown, this);

        // Adiciona eventos de teclado para ataques
        this.input.keyboard.on('keydown-SPACE', this.playerAttack, this);

        // Inicializa o pathfinder
        this.initPathfinder();

        // Exibe mensagem de boas-vindas
        this.showMessage('Bem-vindo ao jogo!');
    }

    update(time, delta) {
        // Atualiza o jogador local se existir
        if (this.player) {
            this.updatePlayerMovement(delta);
        }

        // Atualiza os outros jogadores
        Object.values(this.otherPlayers).forEach(otherPlayer => {
            otherPlayer.update();
        });
    }

    /**
     * Cria o mapa isométrico
     */
    createMap() {
        // Cria um mapa isométrico
        this.map = this.make.tilemap({ key: 'map' });

        // Adiciona o tileset ao mapa
        const tileset = this.map.addTilesetImage('isometric-tileset', 'tiles');

        // Cria as camadas do mapa
        this.mapLayers.ground = this.map.createLayer('Ground', tileset);
        this.mapLayers.obstacles = this.map.createLayer('Obstacles', tileset);
        this.mapLayers.decoration = this.map.createLayer('Decoration', tileset);

        // Configura as colisões
        this.mapLayers.obstacles.setCollisionByProperty({ collides: true });

        // Configura a profundidade das camadas
        this.mapLayers.ground.setDepth(0);
        this.mapLayers.obstacles.setDepth(10);
        this.mapLayers.decoration.setDepth(20);

        // Configura a ordenação de profundidade para objetos do jogo
        this.children.depthSort = true;
    }

    /**
     * Inicializa o pathfinder para movimentação no mapa isométrico
     */
    initPathfinder() {
        // Cria uma matriz de grid para o pathfinder
        const gridWidth = this.map.width;
        const gridHeight = this.map.height;
        const grid = [];

        // Inicializa o grid com base nas colisões do mapa
        for (let y = 0; y < gridHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                // Verifica se o tile é um obstáculo
                const tile = this.mapLayers.obstacles.getTileAt(x, y);
                grid[y][x] = tile && tile.properties.collides ? 1 : 0;
            }
        }

        // Cria o pathfinder
        this.pathfinder = new AStarPathfinder(grid);
    }

    /**
     * Adiciona o jogador local ao jogo
     * @param {Object} playerInfo - Informações do jogador
     */
    addPlayer(playerInfo) {
        // Cria o jogador local
        this.player = new Player({
            scene: this,
            x: playerInfo.x,
            y: playerInfo.y,
            texture: playerInfo.skin,
            frame: 'down',
            id: playerInfo.id,
            name: playerInfo.name,
            hp: playerInfo.hp,
            isLocal: true
        });

        // Configura a câmera para seguir o jogador
        this.cameras.main.startFollow(this.player, true);
        this.cameras.main.setZoom(1);

        // Atualiza a interface com os dados do jogador
        updatePlayerName(playerInfo.name);
        updateHealthBar(playerInfo.hp);
    }

    /**
     * Adiciona outro jogador ao jogo
     * @param {Object} playerInfo - Informações do jogador
     */
    addOtherPlayer(playerInfo) {
        // Cria o jogador remoto
        const otherPlayer = new Player({
            scene: this,
            x: playerInfo.x,
            y: playerInfo.y,
            texture: playerInfo.skin,
            frame: playerInfo.direction || 'down',
            id: playerInfo.id,
            name: playerInfo.name,
            hp: playerInfo.hp,
            isLocal: false
        });

        // Adiciona o jogador à lista de outros jogadores
        this.otherPlayers[playerInfo.id] = otherPlayer;
    }

    /**
     * Atualiza a posição de outro jogador
     * @param {Object} playerInfo - Informações do jogador
     */
    updateOtherPlayerPosition(playerInfo) {
        const otherPlayer = this.otherPlayers[playerInfo.id];
        if (otherPlayer) {
            otherPlayer.moveTo(playerInfo.x, playerInfo.y, playerInfo.direction);
        }
    }

    /**
     * Remove um jogador do jogo
     * @param {string} playerId - ID do jogador a ser removido
     */
    removePlayer(playerId) {
        if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].destroy();
            delete this.otherPlayers[playerId];
            addChatMessage('Sistema', 'Um jogador saiu do jogo');
        }
    }

    /**
     * Atualiza o movimento do jogador local
     * @param {number} delta - Tempo desde o último frame em ms
     */
    updatePlayerMovement(delta) {
        // Se o jogador estiver seguindo um caminho
        if (this.currentPath.length > 0 && !this.playerMoving) {
            this.movePlayerAlongPath();
        }

        // Movimento por teclado
        if (this.cursors && !this.playerMoving) {
            let direction = null;
            let moving = false;

            // Movimento para cima
            if (this.cursors.up.isDown) {
                this.player.moveUp();
                direction = 'up';
                moving = true;
            }
            // Movimento para baixo
            else if (this.cursors.down.isDown) {
                this.player.moveDown();
                direction = 'down';
                moving = true;
            }
            // Movimento para a esquerda
            else if (this.cursors.left.isDown) {
                this.player.moveLeft();
                direction = 'left';
                moving = true;
            }
            // Movimento para a direita
            else if (this.cursors.right.isDown) {
                this.player.moveRight();
                direction = 'right';
                moving = true;
            }
            // Jogador parado
            else {
                this.player.stopMovement();
            }

            // Se o jogador estiver se movendo, envia a posição para o servidor
            if (moving) {
                this.socketManager.sendPlayerMovement(
                    this.player.x,
                    this.player.y,
                    direction
                );
            }
        }
    }

    /**
     * Manipula o clique do mouse/toque na tela
     * @param {Phaser.Input.Pointer} pointer - O ponteiro que acionou o evento
     */
    handlePointerDown(pointer) {
        // Converte a posição do clique para coordenadas do mundo
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // Converte as coordenadas do mundo para coordenadas do tile isométrico
        const tileX = Math.floor(worldPoint.x / CONFIG.game.tileWidth);
        const tileY = Math.floor(worldPoint.y / CONFIG.game.tileHeight);

        // Verifica se o tile é válido e não é um obstáculo
        if (tileX >= 0 && tileX < this.map.width && tileY >= 0 && tileY < this.map.height) {
            const tile = this.mapLayers.obstacles.getTileAt(tileX, tileY);
            if (!tile || !tile.properties.collides) {
                // Define o destino do jogador
                this.setPlayerDestination(tileX, tileY);
            }
        }
    }

    /**
     * Define o destino do jogador e calcula o caminho
     * @param {number} tileX - Coordenada X do tile de destino
     * @param {number} tileY - Coordenada Y do tile de destino
     */
    setPlayerDestination(tileX, tileY) {
        if (!this.player) return;

        // Converte a posição do jogador para coordenadas de tile
        const playerTileX = Math.floor(this.player.x / CONFIG.game.tileWidth);
        const playerTileY = Math.floor(this.player.y / CONFIG.game.tileHeight);

        // Calcula o caminho usando o pathfinder
        const path = this.pathfinder.findPath(
            playerTileX, playerTileY,
            tileX, tileY
        );

        // Se encontrou um caminho válido
        if (path && path.length > 0) {
            // Remove o primeiro ponto (posição atual do jogador)
            path.shift();

            // Converte o caminho para coordenadas do mundo
            this.currentPath = path.map(point => ({
                x: point.x * CONFIG.game.tileWidth + CONFIG.game.tileWidthHalf,
                y: point.y * CONFIG.game.tileHeight + CONFIG.game.tileHeightHalf
            }));

            // Inicia o movimento do jogador
            if (this.currentPath.length > 0) {
                this.movePlayerAlongPath();
            }
        }
    }

    /**
     * Move o jogador ao longo do caminho calculado
     */
    movePlayerAlongPath() {
        if (this.currentPath.length === 0 || !this.player) return;

        // Obtém o próximo ponto do caminho
        const nextPoint = this.currentPath[0];

        // Calcula a direção para o próximo ponto
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            nextPoint.x, nextPoint.y
        );

        // Determina a direção com base no ângulo
        let direction;
        if (angle >= -Math.PI * 0.25 && angle < Math.PI * 0.25) {
            direction = 'right';
            this.player.moveRight();
        } else if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) {
            direction = 'down';
            this.player.moveDown();
        } else if (angle >= -Math.PI * 0.75 && angle < -Math.PI * 0.25) {
            direction = 'up';
            this.player.moveUp();
        } else {
            direction = 'left';
            this.player.moveLeft();
        }

        // Move o jogador para o próximo ponto
        this.playerMoving = true;
        this.player.moveTo(nextPoint.x, nextPoint.y, direction, () => {
            // Remove o ponto atual do caminho
            this.currentPath.shift();
            this.playerMoving = false;

            // Envia a posição atualizada para o servidor
            this.socketManager.sendPlayerMovement(
                this.player.x,
                this.player.y,
                direction
            );

            // Continua o movimento se ainda houver pontos no caminho
            if (this.currentPath.length > 0) {
                this.movePlayerAlongPath();
            }
        });
    }

    /**
     * Executa um ataque do jogador
     */
    playerAttack() {
        if (!this.player) return;

        // Verifica o cooldown do ataque
        const currentTime = this.time.now;
        if (currentTime - this.lastAttackTime < CONFIG.game.attackCooldown) {
            return;
        }

        // Atualiza o tempo do último ataque
        this.lastAttackTime = currentTime;

        // Executa a animação de ataque
        this.player.attack();

        // Verifica colisão com outros jogadores
        let targetId = null;
        const attackRange = CONFIG.game.attackRange;

        // Verifica todos os outros jogadores
        Object.values(this.otherPlayers).forEach(otherPlayer => {
            // Calcula a distância entre o jogador e o alvo
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                otherPlayer.x, otherPlayer.y
            );

            // Se o alvo estiver dentro do alcance do ataque
            if (distance <= attackRange) {
                targetId = otherPlayer.id;
            }
        });

        // Envia o ataque para o servidor
        this.socketManager.sendPlayerAttack(
            this.player.x,
            this.player.y,
            this.player.direction,
            'melee',
            targetId
        );
    }

    /**
     * Manipula um ataque de jogador
     * @param {Object} attackInfo - Informações do ataque
     */
    handlePlayerAttack(attackInfo) {
        // Se for o atacante, ignora (já foi tratado localmente)
        if (attackInfo.attackerId === this.player.id) return;

        // Encontra o jogador atacante
        const attacker = this.otherPlayers[attackInfo.attackerId];
        if (attacker) {
            // Executa a animação de ataque
            attacker.attack();

            // Cria um efeito visual de ataque
            this.createAttackEffect(attackInfo.position.x, attackInfo.position.y, attackInfo.type);
        }
    }

    /**
     * Cria um efeito visual de ataque
     * @param {number} x - Posição X do ataque
     * @param {number} y - Posição Y do ataque
     * @param {string} type - Tipo do ataque (melee, range)
     */
    createAttackEffect(x, y, type) {
        // Cria um efeito visual de ataque
        const effect = this.add.sprite(x, y, 'attack_effect');
        effect.setDepth(100);
        effect.play('attack_animation');

        // Remove o efeito após a animação
        effect.once('animationcomplete', () => {
            effect.destroy();
        });
    }

    /**
     * Atualiza o HP de um jogador
     * @param {string} playerId - ID do jogador
     * @param {number} hp - Novo valor de HP
     */
    updatePlayerHP(playerId, hp) {
        // Se for o jogador local
        if (this.player && playerId === this.player.id) {
            this.player.setHP(hp);
            updateHealthBar(hp);

            // Efeito visual de dano
            this.cameras.main.shake(100, 0.01);
        }
        // Se for outro jogador
        else if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].setHP(hp);
        }
    }

    /**
     * Manipula a morte de um jogador
     * @param {string} playerId - ID do jogador que morreu
     * @param {string} killerId - ID do jogador que matou
     */
    handlePlayerDeath(playerId, killerId) {
        // Se for o jogador local
        if (this.player && playerId === this.player.id) {
            this.player.die();
            this.showMessage('Você morreu! Respawnando em 5 segundos...');
        }
        // Se for outro jogador
        else if (this.otherPlayers[playerId]) {
            this.otherPlayers[playerId].die();

            // Mensagem de morte
            const killerName = killerId === this.player.id ? 'Você' : 
                (this.otherPlayers[killerId] ? this.otherPlayers[killerId].name : 'Outro jogador');
            const victimName = this.otherPlayers[playerId].name;
            addChatMessage('Sistema', `${killerName} derrotou ${victimName}`);
        }
    }

    /**
     * Manipula o respawn de um jogador
     * @param {Object} playerInfo - Informações do jogador
     */
    handlePlayerRespawn(playerInfo) {
        // Se for o jogador local
        if (this.player && playerInfo.id === this.player.id) {
            this.player.respawn(playerInfo.x, playerInfo.y);
            this.player.setHP(playerInfo.hp);
            updateHealthBar(playerInfo.hp);
            this.showMessage('Você respawnou!');
        }
        // Se for outro jogador
        else if (this.otherPlayers[playerInfo.id]) {
            this.otherPlayers[playerInfo.id].respawn(playerInfo.x, playerInfo.y);
            this.otherPlayers[playerInfo.id].setHP(playerInfo.hp);
            addChatMessage('Sistema', `${this.otherPlayers[playerInfo.id].name} respawnou`);
        }
    }

    /**
     * Envia uma mensagem de chat
     * @param {string} message - Mensagem a ser enviada
     */
    sendChatMessage(message) {
        this.socketManager.sendChatMessage(message);
    }

    /**
     * Executa uma interação do jogador com o ambiente
     */
    playerInteract() {
        // Implementação futura para interação com objetos do mapa
        this.showMessage('Nenhuma interação disponível no momento.');
    }

    /**
     * Alterna a visibilidade do inventário
     */
    toggleInventory() {
        // Implementação futura para sistema de inventário
        this.showMessage('Sistema de inventário em desenvolvimento.');
    }

    /**
     * Exibe uma mensagem temporária na tela
     * @param {string} text - Texto da mensagem
     * @param {number} duration - Duração da mensagem em ms
     */
    showMessage(text, duration = 3000) {
        // Cria um elemento de texto para a mensagem
        const message = this.add.text(
            this.cameras.main.centerX,
            100,
            text,
            {
                font: '18px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        );
        message.setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(1000);

        // Remove a mensagem após a duração especificada
        this.time.delayedCall(duration, () => {
            message.destroy();
        });
    }
}