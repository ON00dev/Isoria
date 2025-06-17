/**
 * Modelo de sala para o servidor
 */

// Importa as constantes e utilitários
const CONSTANTS = require('../../shared/constants');
const Utils = require('../../shared/utils');

/**
 * Classe que representa uma sala no servidor
 */
class Room {
    /**
     * Cria uma nova sala
     * @param {string} id - ID da sala
     * @param {string} name - Nome da sala
     * @param {string} mapName - Nome do mapa
     */
    constructor(id, name, mapName = 'world') {
        this.id = id;
        this.name = name;
        this.mapName = mapName;
        this.players = new Map(); // Map de jogadores (id -> Player)
        this.maxPlayers = CONSTANTS.SERVER.MAX_PLAYERS_PER_ROOM;
        this.chatHistory = []; // Histórico de mensagens do chat
        this.chatHistoryMaxLength = 50; // Número máximo de mensagens no histórico
    }

    /**
     * Adiciona um jogador à sala
     * @param {Player} player - Jogador a ser adicionado
     * @returns {boolean} - true se o jogador foi adicionado, false caso contrário
     */
    addPlayer(player) {
        // Verifica se a sala está cheia
        if (this.players.size >= this.maxPlayers) {
            return false;
        }

        // Adiciona o jogador
        this.players.set(player.id, player);
        player.room = this.id;

        return true;
    }

    /**
     * Remove um jogador da sala
     * @param {string} playerId - ID do jogador a ser removido
     * @returns {Player|null} - Jogador removido ou null se não encontrado
     */
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        
        if (player) {
            // Cancela o timer de respawn se estiver ativo
            player.cancelRespawn();
            
            // Remove o jogador
            this.players.delete(playerId);
            player.room = null;
        }
        
        return player;
    }

    /**
     * Obtém um jogador pelo ID
     * @param {string} playerId - ID do jogador
     * @returns {Player|null} - Jogador encontrado ou null se não encontrado
     */
    getPlayer(playerId) {
        return this.players.get(playerId) || null;
    }

    /**
     * Verifica se a sala está cheia
     * @returns {boolean} - true se a sala está cheia, false caso contrário
     */
    isFull() {
        return this.players.size >= this.maxPlayers;
    }

    /**
     * Verifica se a sala está vazia
     * @returns {boolean} - true se a sala está vazia, false caso contrário
     */
    isEmpty() {
        return this.players.size === 0;
    }

    /**
     * Processa um ataque de um jogador
     * @param {string} attackerId - ID do jogador atacante
     * @returns {Array} - Array de jogadores atingidos e informações de dano
     */
    processAttack(attackerId) {
        const attacker = this.getPlayer(attackerId);
        if (!attacker || !attacker.canAttack()) return [];

        // Realiza o ataque
        attacker.attack();

        // Verifica quais jogadores foram atingidos
        const hitPlayers = [];

        this.players.forEach((player) => {
            // Ignora o próprio atacante e jogadores mortos
            if (player.id === attackerId || player.isDead) return;

            // Verifica se o jogador está no alcance do ataque
            if (player.isInAttackRange(attacker)) {
                // Aplica o dano
                const damageInfo = player.takeDamage(CONSTANTS.GAME.ATTACK_DAMAGE, attackerId);
                
                if (damageInfo) {
                    hitPlayers.push({
                        player: player,
                        damageInfo: damageInfo
                    });

                    // Se o jogador morreu, inicia o respawn
                    if (damageInfo.isDead) {
                        player.startRespawn();
                    }
                }
            }
        });

        return hitPlayers;
    }

    /**
     * Adiciona uma mensagem ao chat
     * @param {string} playerId - ID do jogador que enviou a mensagem
     * @param {string} message - Conteúdo da mensagem
     * @returns {Object|null} - Informações da mensagem ou null se o jogador não for encontrado
     */
    addChatMessage(playerId, message) {
        const player = this.getPlayer(playerId);
        if (!player) return null;

        // Cria o objeto da mensagem
        const chatMessage = {
            id: Utils.generateId(),
            playerId: playerId,
            playerName: player.name,
            message: message,
            timestamp: Date.now()
        };

        // Adiciona ao histórico
        this.chatHistory.push(chatMessage);

        // Limita o tamanho do histórico
        if (this.chatHistory.length > this.chatHistoryMaxLength) {
            this.chatHistory.shift();
        }

        return chatMessage;
    }

    /**
     * Obtém o estado atual da sala para envio aos clientes
     * @returns {Object} - Estado da sala
     */
    getState() {
        const playersData = [];
        
        this.players.forEach((player) => {
            playersData.push(player.toJSON());
        });

        return {
            id: this.id,
            name: this.name,
            mapName: this.mapName,
            players: playersData,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers
        };
    }
}

module.exports = Room;