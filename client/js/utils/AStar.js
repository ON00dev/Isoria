/**
 * Implementação do algoritmo A* para pathfinding
 * Usado para calcular caminhos no mapa isométrico
 */
class AStarPathfinder {
    /**
     * Construtor do pathfinder
     * @param {Array} grid - Matriz que representa o mapa (0 = caminho livre, 1 = obstáculo)
     */
    constructor(grid) {
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
    }

    /**
     * Encontra um caminho entre dois pontos no mapa
     * @param {number} startX - Coordenada X inicial
     * @param {number} startY - Coordenada Y inicial
     * @param {number} endX - Coordenada X final
     * @param {number} endY - Coordenada Y final
     * @returns {Array} - Array de pontos que formam o caminho
     */
    findPath(startX, startY, endX, endY) {
        // Verifica se as coordenadas são válidas
        if (!this.isValidCoordinate(startX, startY) || !this.isValidCoordinate(endX, endY)) {
            return null;
        }

        // Verifica se o destino é um obstáculo
        if (this.grid[endY][endX] === 1) {
            return null;
        }

        // Lista de nós abertos (a serem avaliados)
        const openList = [];
        
        // Lista de nós fechados (já avaliados)
        const closedList = {};
        
        // Adiciona o nó inicial à lista aberta
        openList.push({
            x: startX,
            y: startY,
            g: 0, // Custo do caminho do início até este nó
            h: this.heuristic(startX, startY, endX, endY), // Estimativa do custo deste nó até o destino
            f: this.heuristic(startX, startY, endX, endY), // f = g + h
            parent: null // Nó pai (para reconstruir o caminho)
        });

        // Enquanto houver nós na lista aberta
        while (openList.length > 0) {
            // Ordena a lista aberta pelo valor de f (g + h)
            openList.sort((a, b) => a.f - b.f);
            
            // Obtém o nó com menor valor de f
            const currentNode = openList.shift();
            const key = `${currentNode.x},${currentNode.y}`;
            
            // Adiciona o nó atual à lista fechada
            closedList[key] = currentNode;
            
            // Se chegamos ao destino, reconstrói o caminho
            if (currentNode.x === endX && currentNode.y === endY) {
                return this.reconstructPath(currentNode);
            }
            
            // Obtém os vizinhos do nó atual
            const neighbors = this.getNeighbors(currentNode.x, currentNode.y);
            
            // Para cada vizinho
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Se o vizinho já está na lista fechada, pula
                if (closedList[neighborKey]) {
                    continue;
                }
                
                // Calcula o custo g do vizinho (custo do nó atual + 1)
                const gScore = currentNode.g + 1;
                
                // Verifica se o vizinho já está na lista aberta
                const existingNeighbor = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
                
                // Se o vizinho não está na lista aberta ou tem um custo g menor
                if (!existingNeighbor || gScore < existingNeighbor.g) {
                    // Calcula os valores de g, h e f
                    neighbor.g = gScore;
                    neighbor.h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;
                    
                    // Se o vizinho não está na lista aberta, adiciona
                    if (!existingNeighbor) {
                        openList.push(neighbor);
                    }
                }
            }
        }
        
        // Se não encontrou um caminho, retorna null
        return null;
    }

    /**
     * Verifica se uma coordenada é válida
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {boolean} - Verdadeiro se a coordenada for válida
     */
    isValidCoordinate(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    /**
     * Obtém os vizinhos de um nó
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {Array} - Array de nós vizinhos
     */
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Norte
            { x: 1, y: 0 },  // Leste
            { x: 0, y: 1 },  // Sul
            { x: -1, y: 0 }, // Oeste
            // Diagonais (opcional)
            { x: 1, y: -1 }, // Nordeste
            { x: 1, y: 1 },  // Sudeste
            { x: -1, y: 1 }, // Sudoeste
            { x: -1, y: -1 } // Noroeste
        ];

        // Para cada direção
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;

            // Verifica se a coordenada é válida e não é um obstáculo
            if (this.isValidCoordinate(newX, newY) && this.grid[newY][newX] === 0) {
                neighbors.push({
                    x: newX,
                    y: newY,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null
                });
            }
        }

        return neighbors;
    }

    /**
     * Calcula a heurística (distância de Manhattan)
     * @param {number} x1 - Coordenada X inicial
     * @param {number} y1 - Coordenada Y inicial
     * @param {number} x2 - Coordenada X final
     * @param {number} y2 - Coordenada Y final
     * @returns {number} - Valor da heurística
     */
    heuristic(x1, y1, x2, y2) {
        // Distância de Manhattan
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    /**
     * Reconstrói o caminho a partir do nó final
     * @param {Object} endNode - Nó final
     * @returns {Array} - Array de pontos que formam o caminho
     */
    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;

        // Percorre os nós pais até chegar ao início
        while (currentNode) {
            path.unshift({
                x: currentNode.x,
                y: currentNode.y
            });
            currentNode = currentNode.parent;
        }

        return path;
    }
}