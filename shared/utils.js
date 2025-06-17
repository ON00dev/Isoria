/**
 * Utilitários compartilhados entre cliente e servidor
 */

// Verifica se estamos no ambiente Node.js ou no navegador
const isNode = typeof module !== 'undefined' && module.exports;

// Importa as constantes
const CONSTANTS = isNode ? require('./constants') : window.CONSTANTS;

// Define os utilitários
const Utils = {
    /**
     * Calcula a distância entre dois pontos
     * @param {number} x1 - Coordenada X do primeiro ponto
     * @param {number} y1 - Coordenada Y do primeiro ponto
     * @param {number} x2 - Coordenada X do segundo ponto
     * @param {number} y2 - Coordenada Y do segundo ponto
     * @returns {number} - Distância entre os pontos
     */
    distance: (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    /**
     * Verifica se dois retângulos estão colidindo
     * @param {Object} rect1 - Primeiro retângulo {x, y, width, height}
     * @param {Object} rect2 - Segundo retângulo {x, y, width, height}
     * @returns {boolean} - true se estão colidindo, false caso contrário
     */
    rectIntersect: (rect1, rect2) => {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    },

    /**
     * Verifica se um ponto está dentro de um retângulo
     * @param {number} x - Coordenada X do ponto
     * @param {number} y - Coordenada Y do ponto
     * @param {Object} rect - Retângulo {x, y, width, height}
     * @returns {boolean} - true se o ponto está dentro do retângulo, false caso contrário
     */
    pointInRect: (x, y, rect) => {
        return (
            x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height
        );
    },

    /**
     * Verifica se um ponto está dentro de um círculo
     * @param {number} x - Coordenada X do ponto
     * @param {number} y - Coordenada Y do ponto
     * @param {number} circleX - Coordenada X do centro do círculo
     * @param {number} circleY - Coordenada Y do centro do círculo
     * @param {number} radius - Raio do círculo
     * @returns {boolean} - true se o ponto está dentro do círculo, false caso contrário
     */
    pointInCircle: (x, y, circleX, circleY, radius) => {
        return Utils.distance(x, y, circleX, circleY) <= radius;
    },

    /**
     * Calcula a direção entre dois pontos
     * @param {number} x1 - Coordenada X do primeiro ponto
     * @param {number} y1 - Coordenada Y do primeiro ponto
     * @param {number} x2 - Coordenada X do segundo ponto
     * @param {number} y2 - Coordenada Y do segundo ponto
     * @returns {string} - Direção (uma das constantes DIRECTION)
     */
    getDirection: (x1, y1, x2, y2) => {
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        // Converte o ângulo para uma das 8 direções
        if (angle >= -22.5 && angle < 22.5) {
            return CONSTANTS.DIRECTION.RIGHT;
        } else if (angle >= 22.5 && angle < 67.5) {
            return CONSTANTS.DIRECTION.DOWN_RIGHT;
        } else if (angle >= 67.5 && angle < 112.5) {
            return CONSTANTS.DIRECTION.DOWN;
        } else if (angle >= 112.5 && angle < 157.5) {
            return CONSTANTS.DIRECTION.DOWN_LEFT;
        } else if (angle >= 157.5 || angle < -157.5) {
            return CONSTANTS.DIRECTION.LEFT;
        } else if (angle >= -157.5 && angle < -112.5) {
            return CONSTANTS.DIRECTION.UP_LEFT;
        } else if (angle >= -112.5 && angle < -67.5) {
            return CONSTANTS.DIRECTION.UP;
        } else {
            return CONSTANTS.DIRECTION.UP_RIGHT;
        }
    },

    /**
     * Gera um ID único
     * @returns {string} - ID único
     */
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    },

    /**
     * Converte coordenadas cartesianas para coordenadas isométricas
     * @param {number} x - Coordenada X cartesiana
     * @param {number} y - Coordenada Y cartesiana
     * @returns {Object} - Coordenadas isométricas {x, y}
     */
    cartesianToIsometric: (x, y) => {
        return {
            x: (x - y),
            y: (x + y) / 2
        };
    },

    /**
     * Converte coordenadas isométricas para coordenadas cartesianas
     * @param {number} x - Coordenada X isométrica
     * @param {number} y - Coordenada Y isométrica
     * @returns {Object} - Coordenadas cartesianas {x, y}
     */
    isometricToCartesian: (x, y) => {
        return {
            x: (x + y * 2) / 2,
            y: (y * 2 - x) / 2
        };
    },

    /**
     * Converte coordenadas de tile para coordenadas do mundo
     * @param {number} tileX - Coordenada X do tile
     * @param {number} tileY - Coordenada Y do tile
     * @returns {Object} - Coordenadas do mundo {x, y}
     */
    tileToWorldCoordinates: (tileX, tileY) => {
        return {
            x: (tileX - tileY) * (CONSTANTS.GAME.TILE_WIDTH / 2),
            y: (tileX + tileY) * (CONSTANTS.GAME.TILE_HEIGHT / 2)
        };
    },

    /**
     * Converte coordenadas do mundo para coordenadas de tile
     * @param {number} worldX - Coordenada X do mundo
     * @param {number} worldY - Coordenada Y do mundo
     * @returns {Object} - Coordenadas do tile {x, y}
     */
    worldToTileCoordinates: (worldX, worldY) => {
        // Ajusta as coordenadas para o centro do tile
        const x = worldX / (CONSTANTS.GAME.TILE_WIDTH / 2);
        const y = worldY / (CONSTANTS.GAME.TILE_HEIGHT / 2);
        
        return {
            x: Math.floor((x + y) / 2),
            y: Math.floor((y - x) / 2)
        };
    }
};

// Exporta os utilitários para Node.js ou define como global para o navegador
if (isNode) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}