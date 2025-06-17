/**
 * Utilitário para ajudar com conversões e cálculos isométricos
 */
class IsometricHelper {
    /**
     * Construtor do helper isométrico
     * @param {Object} config - Configuração do helper
     */
    constructor(config) {
        this.tileWidth = config.tileWidth || CONFIG.game.tileWidth;
        this.tileHeight = config.tileHeight || CONFIG.game.tileHeight;
        this.tileWidthHalf = this.tileWidth / 2;
        this.tileHeightHalf = this.tileHeight / 2;
    }

    /**
     * Converte coordenadas cartesianas para coordenadas isométricas
     * @param {number} cartX - Coordenada X cartesiana
     * @param {number} cartY - Coordenada Y cartesiana
     * @returns {Object} - Coordenadas isométricas {x, y}
     */
    cartesianToIsometric(cartX, cartY) {
        const isoX = (cartX - cartY) * this.tileWidthHalf;
        const isoY = (cartX + cartY) * this.tileHeightHalf;
        return { x: isoX, y: isoY };
    }

    /**
     * Converte coordenadas isométricas para coordenadas cartesianas
     * @param {number} isoX - Coordenada X isométrica
     * @param {number} isoY - Coordenada Y isométrica
     * @returns {Object} - Coordenadas cartesianas {x, y}
     */
    isometricToCartesian(isoX, isoY) {
        const cartX = (isoX / this.tileWidthHalf + isoY / this.tileHeightHalf) / 2;
        const cartY = (isoY / this.tileHeightHalf - isoX / this.tileWidthHalf) / 2;
        return { x: cartX, y: cartY };
    }

    /**
     * Converte coordenadas de tile para coordenadas do mundo
     * @param {number} tileX - Coordenada X do tile
     * @param {number} tileY - Coordenada Y do tile
     * @returns {Object} - Coordenadas do mundo {x, y}
     */
    tileToWorldPosition(tileX, tileY) {
        const iso = this.cartesianToIsometric(tileX, tileY);
        return {
            x: iso.x,
            y: iso.y
        };
    }

    /**
     * Converte coordenadas do mundo para coordenadas de tile
     * @param {number} worldX - Coordenada X do mundo
     * @param {number} worldY - Coordenada Y do mundo
     * @returns {Object} - Coordenadas do tile {x, y}
     */
    worldToTilePosition(worldX, worldY) {
        const cart = this.isometricToCartesian(worldX, worldY);
        return {
            x: Math.floor(cart.x),
            y: Math.floor(cart.y)
        };
    }

    /**
     * Calcula a profundidade de um objeto com base na posição Y
     * @param {number} y - Posição Y do objeto
     * @returns {number} - Valor de profundidade
     */
    calculateDepth(y) {
        return y;
    }

    /**
     * Calcula a distância entre dois pontos em um mapa isométrico
     * @param {number} x1 - Coordenada X do primeiro ponto
     * @param {number} y1 - Coordenada Y do primeiro ponto
     * @param {number} x2 - Coordenada X do segundo ponto
     * @param {number} y2 - Coordenada Y do segundo ponto
     * @returns {number} - Distância entre os pontos
     */
    calculateDistance(x1, y1, x2, y2) {
        // Converte para coordenadas cartesianas para calcular a distância
        const cart1 = this.isometricToCartesian(x1, y1);
        const cart2 = this.isometricToCartesian(x2, y2);
        
        // Calcula a distância euclidiana
        return Math.sqrt(
            Math.pow(cart2.x - cart1.x, 2) + 
            Math.pow(cart2.y - cart1.y, 2)
        );
    }

    /**
     * Verifica se um ponto está dentro de um tile isométrico
     * @param {number} pointX - Coordenada X do ponto
     * @param {number} pointY - Coordenada Y do ponto
     * @param {number} tileX - Coordenada X do centro do tile
     * @param {number} tileY - Coordenada Y do centro do tile
     * @returns {boolean} - Verdadeiro se o ponto estiver dentro do tile
     */
    isPointInTile(pointX, pointY, tileX, tileY) {
        // Calcula os vértices do tile isométrico
        const vertices = [
            { x: tileX, y: tileY - this.tileHeightHalf }, // Topo
            { x: tileX + this.tileWidthHalf, y: tileY }, // Direita
            { x: tileX, y: tileY + this.tileHeightHalf }, // Base
            { x: tileX - this.tileWidthHalf, y: tileY }  // Esquerda
        ];
        
        // Verifica se o ponto está dentro do polígono formado pelos vértices
        return this.isPointInPolygon(pointX, pointY, vertices);
    }

    /**
     * Verifica se um ponto está dentro de um polígono
     * @param {number} pointX - Coordenada X do ponto
     * @param {number} pointY - Coordenada Y do ponto
     * @param {Array} vertices - Array de vértices do polígono
     * @returns {boolean} - Verdadeiro se o ponto estiver dentro do polígono
     */
    isPointInPolygon(pointX, pointY, vertices) {
        let inside = false;
        const numVertices = vertices.length;
        
        for (let i = 0, j = numVertices - 1; i < numVertices; j = i++) {
            const xi = vertices[i].x;
            const yi = vertices[i].y;
            const xj = vertices[j].x;
            const yj = vertices[j].y;
            
            const intersect = ((yi > pointY) !== (yj > pointY)) &&
                (pointX < (xj - xi) * (pointY - yi) / (yj - yi) + xi);
            
            if (intersect) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Calcula a direção entre dois pontos em um mapa isométrico
     * @param {number} x1 - Coordenada X do primeiro ponto
     * @param {number} y1 - Coordenada Y do primeiro ponto
     * @param {number} x2 - Coordenada X do segundo ponto
     * @param {number} y2 - Coordenada Y do segundo ponto
     * @returns {string} - Direção (up, down, left, right)
     */
    calculateDirection(x1, y1, x2, y2) {
        // Converte para coordenadas cartesianas
        const cart1 = this.isometricToCartesian(x1, y1);
        const cart2 = this.isometricToCartesian(x2, y2);
        
        // Calcula a diferença entre os pontos
        const dx = cart2.x - cart1.x;
        const dy = cart2.y - cart1.y;
        
        // Determina a direção com base no ângulo
        const angle = Math.atan2(dy, dx);
        const degrees = angle * (180 / Math.PI);
        
        if (degrees >= -45 && degrees < 45) {
            return 'right';
        } else if (degrees >= 45 && degrees < 135) {
            return 'down';
        } else if (degrees >= -135 && degrees < -45) {
            return 'up';
        } else {
            return 'left';
        }
    }
}