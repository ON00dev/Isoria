/**
 * Gerenciador de conexão Socket.io
 * Responsável por lidar com a comunicação em tempo real entre cliente e servidor
 */
class SocketManager {
    /**
     * Construtor do gerenciador de Socket
     * @param {GameScene} scene - A cena do jogo que utilizará o socket
     */
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        
        this.init();
    }
    
    /**
     * Inicializa a conexão com o servidor
     */
    init() {
        // Conecta ao servidor Socket.io
        this.socket = io(CONFIG.server.url, {
            reconnection: true,
            reconnectionDelay: CONFIG.server.reconnectDelay,
            reconnectionAttempts: CONFIG.server.maxReconnectAttempts
        });
        
        // Configura os eventos do socket
        this.setupSocketEvents();
    }
    
    /**
     * Configura os eventos do socket
     */
    setupSocketEvents() {
        // Evento de conexão estabelecida
        this.socket.on('connect', () => {
            console.log('Conectado ao servidor');
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Envia os dados do jogador para o servidor
            this.joinGame();
        });
        
        // Evento de desconexão
        this.socket.on('disconnect', () => {
            console.log('Desconectado do servidor');
            this.connected = false;
            
            // Exibe mensagem de desconexão
            this.scene.showMessage('Conexão perdida. Tentando reconectar...');
        });
        
        // Evento de erro de conexão
        this.socket.on('connect_error', (error) => {
            console.error('Erro de conexão:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= CONFIG.server.maxReconnectAttempts) {
                this.scene.showMessage('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
            }
        });
        
        // Evento que recebe os jogadores atuais
        this.socket.on('currentPlayers', (players) => {
            // Adiciona todos os jogadores existentes
            Object.keys(players).forEach((id) => {
                const playerInfo = players[id];
                
                // Se for o jogador local
                if (id === this.socket.id) {
                    this.scene.addPlayer(playerInfo);
                } else {
                    this.scene.addOtherPlayer(playerInfo);
                }
            });
        });
        
        // Evento que recebe um novo jogador
        this.socket.on('newPlayer', (playerInfo) => {
            this.scene.addOtherPlayer(playerInfo);
            addChatMessage('Sistema', `${playerInfo.name} entrou no jogo`);
        });
        
        // Evento que recebe a movimentação de outro jogador
        this.socket.on('playerMoved', (playerInfo) => {
            this.scene.updateOtherPlayerPosition(playerInfo);
        });
        
        // Evento que recebe a desconexão de um jogador
        this.socket.on('playerDisconnected', (playerId) => {
            this.scene.removePlayer(playerId);
        });
        
        // Evento que recebe um ataque de jogador
        this.socket.on('playerAttacked', (attackInfo) => {
            this.scene.handlePlayerAttack(attackInfo);
        });
        
        // Evento que recebe a mudança de HP de um jogador
        this.socket.on('playerHpChanged', (hpInfo) => {
            this.scene.updatePlayerHP(hpInfo.id, hpInfo.hp);
        });
        
        // Evento que recebe a morte de um jogador
        this.socket.on('playerDied', (deathInfo) => {
            this.scene.handlePlayerDeath(deathInfo.id, deathInfo.killerId);
        });
        
        // Evento que recebe o respawn de um jogador
        this.socket.on('playerRespawned', (playerInfo) => {
            this.scene.handlePlayerRespawn(playerInfo);
        });
        
        // Evento que recebe uma nova mensagem de chat
        this.socket.on('newChatMessage', (messageInfo) => {
            addChatMessage(messageInfo.playerName, messageInfo.message);
        });
    }
    
    /**
     * Envia os dados do jogador para o servidor
     */
    joinGame() {
        if (!this.connected) return;
        
        // Envia os dados do jogador para o servidor
        this.socket.emit('playerJoin', {
            name: window.playerData.name,
            skin: window.playerData.skin,
            x: 400, // Posição inicial X
            y: 300  // Posição inicial Y
        });
    }
    
    /**
     * Envia a posição do jogador para o servidor
     * @param {number} x - Posição X do jogador
     * @param {number} y - Posição Y do jogador
     * @param {string} direction - Direção do jogador (up, down, left, right)
     */
    sendPlayerMovement(x, y, direction) {
        if (!this.connected) return;
        
        this.socket.emit('playerMovement', {
            x: x,
            y: y,
            direction: direction
        });
    }
    
    /**
     * Envia um ataque do jogador para o servidor
     * @param {number} x - Posição X do ataque
     * @param {number} y - Posição Y do ataque
     * @param {string} direction - Direção do ataque
     * @param {string} type - Tipo do ataque (melee, range)
     * @param {string} targetId - ID do jogador alvo (se houver)
     */
    sendPlayerAttack(x, y, direction, type = 'melee', targetId = null) {
        if (!this.connected) return;
        
        this.socket.emit('playerAttack', {
            x: x,
            y: y,
            direction: direction,
            type: type,
            targetId: targetId,
            damage: CONFIG.game.attackDamage
        });
    }
    
    /**
     * Envia uma mensagem de chat para o servidor
     * @param {string} message - Mensagem a ser enviada
     */
    sendChatMessage(message) {
        if (!this.connected) return;
        
        this.socket.emit('chatMessage', message);
    }
    
    /**
     * Desconecta do servidor
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}