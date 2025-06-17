/**
 * Constantes compartilhadas entre cliente e servidor
 */

// Verifica se estamos no ambiente Node.js ou no navegador
const isNode = typeof module !== 'undefined' && module.exports;

// Define as constantes
const CONSTANTS = {
    // Configurações do jogo
    GAME: {
        TILE_WIDTH: 64,
        TILE_HEIGHT: 32,
        PLAYER_SPEED: 200,
        PLAYER_DEFAULT_HP: 100,
        ATTACK_COOLDOWN: 1000, // ms
        ATTACK_DAMAGE: 10,
        ATTACK_RANGE: 100,
        RESPAWN_TIME: 5000, // ms
    },

    // Direções
    DIRECTION: {
        DOWN: 'down',
        DOWN_LEFT: 'down-left',
        LEFT: 'left',
        UP_LEFT: 'up-left',
        UP: 'up',
        UP_RIGHT: 'up-right',
        RIGHT: 'right',
        DOWN_RIGHT: 'down-right'
    },

    // Estados do jogador
    PLAYER_STATE: {
        IDLE: 'idle',
        WALKING: 'walking',
        ATTACKING: 'attacking',
        DEAD: 'dead'
    },

    // Tipos de mensagens do Socket.io
    SOCKET_EVENTS: {
        // Eventos do cliente para o servidor
        JOIN_GAME: 'join_game',
        PLAYER_MOVEMENT: 'player_movement',
        PLAYER_ATTACK: 'player_attack',
        CHAT_MESSAGE: 'chat_message',
        DISCONNECT: 'disconnect',

        // Eventos do servidor para o cliente
        GAME_STATE: 'game_state',
        PLAYER_JOINED: 'player_joined',
        PLAYER_LEFT: 'player_left',
        PLAYER_MOVED: 'player_moved',
        PLAYER_ATTACKED: 'player_attacked',
        PLAYER_HIT: 'player_hit',
        PLAYER_DIED: 'player_died',
        PLAYER_RESPAWNED: 'player_respawned',
        CHAT_MESSAGE_RECEIVED: 'chat_message_received',
        ERROR: 'error'
    },

    // Configurações do servidor
    SERVER: {
        MAX_PLAYERS_PER_ROOM: 10,
        TICK_RATE: 30, // Atualizações por segundo
        RECONNECT_TIMEOUT: 10000 // ms
    }
};

// Exporta as constantes para Node.js ou define como global para o navegador
if (isNode) {
    module.exports = CONSTANTS;
} else {
    window.CONSTANTS = CONSTANTS;
}