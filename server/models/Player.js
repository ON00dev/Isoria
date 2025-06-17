/**
 * Modelo de jogador para o servidor
 */

// Importa as constantes e utilitários
const CONSTANTS = require('../../shared/constants');
const Utils = require('../../shared/utils');

/**
 * Classe que representa um jogador no servidor
 */
class Player {
    /**
     * Cria um novo jogador
     * @param {string} id - ID do jogador (socket.id)
     * @param {string} name - Nome do jogador
     * @param {string} character - Tipo de personagem (warrior, mage, archer)
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     */
    constructor(id, name, character, x, y) {
        this.id = id;
        this.name = name;
        this.character = character;
        this.x = x;
        this.y = y;
        this.direction = CONSTANTS.DIRECTION.DOWN;
        this.state = CONSTANTS.PLAYER_STATE.IDLE;
        this.hp = CONSTANTS.GAME.PLAYER_DEFAULT_HP;
        this.maxHp = CONSTANTS.GAME.PLAYER_DEFAULT_HP;
        this.isDead = false;
        this.lastAttackTime = 0;
        this.respawnTimer = null;
        this.room = null; // Sala atual do jogador
    }

    /**
     * Atualiza a posição do jogador
     * @param {number} x - Nova posição X
     * @param {number} y - Nova posição Y
     * @param {string} direction - Nova direção
     * @param {string} state - Novo estado
     */
    updatePosition(x, y, direction, state) {
        this.x = x;
        this.y = y;
        
        if (direction) {
            this.direction = direction;
        }
        
        if (state) {
            this.state = state;
        }
    }

    /**
     * Verifica se o jogador pode atacar (cooldown)
     * @returns {boolean} - true se pode atacar, false caso contrário
     */
    canAttack() {
        const now = Date.now();
        return !this.isDead && (now - this.lastAttackTime) >= CONSTANTS.GAME.ATTACK_COOLDOWN;
    }

    /**
     * Realiza um ataque
     * @returns {boolean} - true se o ataque foi realizado, false caso contrário
     */
    attack() {
        if (this.canAttack()) {
            this.lastAttackTime = Date.now();
            this.state = CONSTANTS.PLAYER_STATE.ATTACKING;
            return true;
        }
        return false;
    }

    /**
     * Recebe dano
     * @param {number} damage - Quantidade de dano
     * @param {string} attackerId - ID do jogador que causou o dano
     * @returns {Object} - Informações sobre o dano {damage, newHp, isDead}
     */
    takeDamage(damage, attackerId) {
        if (this.isDead) return null;

        // Aplica o dano
        this.hp -= damage;
        
        // Verifica se o jogador morreu
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.state = CONSTANTS.PLAYER_STATE.DEAD;
        }

        return {
            damage,
            newHp: this.hp,
            isDead: this.isDead,
            attackerId
        };
    }

    /**
     * Inicia o processo de respawn
     * @param {Function} callback - Função a ser chamada quando o respawn for concluído
     */
    startRespawn(callback) {
        if (!this.isDead) return;

        // Inicia o timer de respawn
        this.respawnTimer = setTimeout(() => {
            this.respawn();
            if (callback) callback(this);
        }, CONSTANTS.GAME.RESPAWN_TIME);
    }

    /**
     * Realiza o respawn do jogador
     */
    respawn() {
        this.hp = this.maxHp;
        this.isDead = false;
        this.state = CONSTANTS.PLAYER_STATE.IDLE;
        this.respawnTimer = null;
    }

    /**
     * Cancela o timer de respawn
     */
    cancelRespawn() {
        if (this.respawnTimer) {
            clearTimeout(this.respawnTimer);
            this.respawnTimer = null;
        }
    }

    /**
     * Verifica se o jogador está dentro do alcance de ataque de outro jogador
     * @param {Player} player - Jogador atacante
     * @returns {boolean} - true se está dentro do alcance, false caso contrário
     */
    isInAttackRange(player) {
        return Utils.distance(this.x, this.y, player.x, player.y) <= CONSTANTS.GAME.ATTACK_RANGE;
    }

    /**
     * Converte o jogador para um objeto simples para envio via Socket.io
     * @returns {Object} - Objeto com os dados do jogador
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            character: this.character,
            x: this.x,
            y: this.y,
            direction: this.direction,
            state: this.state,
            hp: this.hp,
            maxHp: this.maxHp,
            isDead: this.isDead
        };
    }
}

module.exports = Player;