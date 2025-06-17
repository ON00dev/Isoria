/**
 * Gerenciador de input do jogo
 * Responsável por capturar e processar as entradas do teclado e mouse
 */
class InputManager {
    /**
     * Cria um novo gerenciador de input
     * @param {Phaser.Scene} scene - Cena do Phaser
     * @param {IsometricHelper} isoHelper - Helper para cálculos isométricos
     */
    constructor(scene, isoHelper) {
        this.scene = scene;
        this.isoHelper = isoHelper;
        this.keys = null;
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.targetPosition = null;
        this.isMovingToTarget = false;
        this.isAttackKeyPressed = false;
        this.isInteractKeyPressed = false;
        this.isInventoryKeyPressed = false;
        this.isDebugKeyPressed = false;

        // Inicializa os inputs
        this.init();
    }

    /**
     * Inicializa os inputs
     */
    init() {
        // Configura as teclas
        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            inventory: Phaser.Input.Keyboard.KeyCodes.I,
            debug: Phaser.Input.Keyboard.KeyCodes.F3
        });

        // Configura o mouse
        this.scene.input.on('pointerdown', this.onMouseDown, this);
        this.scene.input.on('pointerup', this.onMouseUp, this);
        this.scene.input.on('pointermove', this.onMouseMove, this);
    }

    /**
     * Atualiza o gerenciador de input
     */
    update() {
        // Atualiza o estado das teclas
        this.isAttackKeyPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack);
        this.isInteractKeyPressed = Phaser.Input.Keyboard.JustDown(this.keys.interact);
        this.isInventoryKeyPressed = Phaser.Input.Keyboard.JustDown(this.keys.inventory);
        this.isDebugKeyPressed = Phaser.Input.Keyboard.JustDown(this.keys.debug);
    }

    /**
     * Evento de clique do mouse
     * @param {Phaser.Input.Pointer} pointer - Ponteiro do mouse
     */
    onMouseDown(pointer) {
        this.isMouseDown = true;
        this.mousePosition = { x: pointer.worldX, y: pointer.worldY };

        // Calcula a posição de destino
        this.targetPosition = this.mousePosition;
        this.isMovingToTarget = true;

        // Emite o evento de clique
        this.scene.events.emit('player_click', this.targetPosition);
    }

    /**
     * Evento de soltar o botão do mouse
     * @param {Phaser.Input.Pointer} pointer - Ponteiro do mouse
     */
    onMouseUp(pointer) {
        this.isMouseDown = false;
    }

    /**
     * Evento de movimento do mouse
     * @param {Phaser.Input.Pointer} pointer - Ponteiro do mouse
     */
    onMouseMove(pointer) {
        this.mousePosition = { x: pointer.worldX, y: pointer.worldY };
    }

    /**
     * Obtém a direção do movimento baseada nas teclas pressionadas
     * @returns {Object|null} - Direção do movimento {x, y} ou null se não houver movimento
     */
    getMovementDirection() {
        // Se estiver movendo para um alvo, ignora as teclas
        if (this.isMovingToTarget) {
            return null;
        }

        // Direção baseada nas teclas
        const direction = { x: 0, y: 0 };

        if (this.keys.up.isDown) {
            direction.y = -1;
        } else if (this.keys.down.isDown) {
            direction.y = 1;
        }

        if (this.keys.left.isDown) {
            direction.x = -1;
        } else if (this.keys.right.isDown) {
            direction.x = 1;
        }

        // Normaliza a direção para movimento diagonal
        if (direction.x !== 0 && direction.y !== 0) {
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= length;
            direction.y /= length;
        }

        // Retorna null se não houver movimento
        if (direction.x === 0 && direction.y === 0) {
            return null;
        }

        return direction;
    }

    /**
     * Obtém a direção do jogador baseada no movimento ou no alvo
     * @param {Phaser.GameObjects.Sprite} player - Sprite do jogador
     * @returns {string} - Direção do jogador (uma das constantes DIRECTION)
     */
    getPlayerDirection(player) {
        // Se estiver movendo para um alvo, calcula a direção baseada no alvo
        if (this.isMovingToTarget && this.targetPosition) {
            return Utils.getDirection(player.x, player.y, this.targetPosition.x, this.targetPosition.y);
        }

        // Direção baseada nas teclas
        const direction = this.getMovementDirection();
        if (!direction) return null;

        // Converte a direção cartesiana para isométrica
        const isoDirection = this.isoHelper.cartesianToIsometric(direction.x, direction.y);

        // Calcula o ângulo da direção
        const angle = Math.atan2(isoDirection.y, isoDirection.x) * 180 / Math.PI;

        // Converte o ângulo para uma das 8 direções
        return Utils.getDirection(0, 0, isoDirection.x, isoDirection.y);
    }

    /**
     * Verifica se o jogador chegou ao alvo
     * @param {Phaser.GameObjects.Sprite} player - Sprite do jogador
     * @returns {boolean} - true se chegou ao alvo, false caso contrário
     */
    hasReachedTarget(player) {
        if (!this.isMovingToTarget || !this.targetPosition) return true;

        // Calcula a distância entre o jogador e o alvo
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            this.targetPosition.x, this.targetPosition.y
        );

        // Verifica se chegou ao alvo (com uma margem de erro)
        return distance < 5;
    }

    /**
     * Cancela o movimento para o alvo
     */
    cancelTargetMovement() {
        this.isMovingToTarget = false;
        this.targetPosition = null;
    }

    /**
     * Verifica se a tecla de ataque foi pressionada
     * @returns {boolean} - true se a tecla de ataque foi pressionada, false caso contrário
     */
    isAttackPressed() {
        return this.isAttackKeyPressed;
    }

    /**
     * Verifica se a tecla de interação foi pressionada
     * @returns {boolean} - true se a tecla de interação foi pressionada, false caso contrário
     */
    isInteractPressed() {
        return this.isInteractKeyPressed;
    }

    /**
     * Verifica se a tecla de inventário foi pressionada
     * @returns {boolean} - true se a tecla de inventário foi pressionada, false caso contrário
     */
    isInventoryPressed() {
        return this.isInventoryKeyPressed;
    }

    /**
     * Verifica se a tecla de debug foi pressionada
     * @returns {boolean} - true se a tecla de debug foi pressionada, false caso contrário
     */
    isDebugPressed() {
        return this.isDebugKeyPressed;
    }

    /**
     * Obtém a posição atual do mouse
     * @returns {Object} - Posição do mouse {x, y}
     */
    getMousePosition() {
        return this.mousePosition;
    }

    /**
     * Obtém a posição do alvo
     * @returns {Object|null} - Posição do alvo {x, y} ou null se não houver alvo
     */
    getTargetPosition() {
        return this.targetPosition;
    }
}