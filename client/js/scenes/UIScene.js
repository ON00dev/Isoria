/**
 * Cena de interface do usuário
 * Sobreposta à cena principal do jogo
 */
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Obtém referência à cena do jogo
        this.gameScene = this.scene.get('GameScene');

        // Configura a cena para ser sobreposta à cena do jogo
        this.scene.moveAbove('GameScene');

        // Adiciona elementos de UI que serão renderizados pelo Phaser
        this.createDebugInfo();

        // Configura eventos de UI
        this.setupUIEvents();
    }

    update() {
        // Atualiza as informações de depuração se estiverem ativas
        this.updateDebugInfo();
    }

    /**
     * Cria informações de depuração
     */
    createDebugInfo() {
        // Só cria se o modo de depuração estiver ativo
        if (!CONFIG.debug.showFPS && !CONFIG.debug.showPlayerPosition) {
            return;
        }

        // Texto de FPS
        if (CONFIG.debug.showFPS) {
            this.fpsText = this.add.text(10, 10, 'FPS: 0', {
                font: '14px Arial',
                fill: '#00ff00'
            });
            this.fpsText.setScrollFactor(0);
            this.fpsText.setDepth(1000);
        }

        // Texto de posição do jogador
        if (CONFIG.debug.showPlayerPosition) {
            this.positionText = this.add.text(10, 30, 'Posição: 0, 0', {
                font: '14px Arial',
                fill: '#00ff00'
            });
            this.positionText.setScrollFactor(0);
            this.positionText.setDepth(1000);
        }
    }

    /**
     * Atualiza as informações de depuração
     */
    updateDebugInfo() {
        // Atualiza o FPS
        if (CONFIG.debug.showFPS && this.fpsText) {
            this.fpsText.setText(`FPS: ${Math.floor(this.game.loop.actualFps)}`);
        }

        // Atualiza a posição do jogador
        if (CONFIG.debug.showPlayerPosition && this.positionText && this.gameScene.player) {
            const x = Math.floor(this.gameScene.player.x);
            const y = Math.floor(this.gameScene.player.y);
            this.positionText.setText(`Posição: ${x}, ${y}`);
        }
    }

    /**
     * Configura eventos de UI
     */
    setupUIEvents() {
        // Configura o redimensionamento da janela
        this.scale.on('resize', this.resize, this);

        // Configura eventos de teclado para chat
        this.input.keyboard.on('keydown-ENTER', () => {
            // Foca no input de chat
            document.getElementById('chat-input').focus();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            // Remove o foco do input de chat
            document.getElementById('chat-input').blur();
        });

        // Configura eventos para os botões de ação
        this.setupActionButtons();
    }

    /**
     * Configura os botões de ação
     */
    setupActionButtons() {
        // Botão de ataque
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                if (this.gameScene) {
                    this.gameScene.playerAttack();
                }
            });
        }

        // Botão de interação
        const interactBtn = document.getElementById('interact-btn');
        if (interactBtn) {
            interactBtn.addEventListener('click', () => {
                if (this.gameScene) {
                    this.gameScene.playerInteract();
                }
            });
        }

        // Botão de inventário
        const inventoryBtn = document.getElementById('inventory-btn');
        if (inventoryBtn) {
            inventoryBtn.addEventListener('click', () => {
                if (this.gameScene) {
                    this.gameScene.toggleInventory();
                }
            });
        }
    }

    /**
     * Redimensiona a UI quando a janela é redimensionada
     */
    resize() {
        // Atualiza a posição dos elementos de UI
        if (this.fpsText) {
            this.fpsText.setPosition(10, 10);
        }

        if (this.positionText) {
            this.positionText.setPosition(10, 30);
        }
    }

    /**
     * Exibe uma mensagem na tela
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

    /**
     * Atualiza a barra de vida do jogador
     * @param {number} percentage - Porcentagem de vida (0-100)
     */
    updateHealthBar(percentage) {
        const healthBarFill = document.getElementById('health-bar-fill');
        if (healthBarFill) {
            healthBarFill.style.width = `${percentage}%`;

            // Muda a cor da barra de vida com base na porcentagem
            if (percentage > 60) {
                healthBarFill.style.backgroundColor = '#4cc9f0'; // Azul
            } else if (percentage > 30) {
                healthBarFill.style.backgroundColor = '#f77f00'; // Laranja
            } else {
                healthBarFill.style.backgroundColor = '#e63946'; // Vermelho
            }
        }
    }

    /**
     * Adiciona uma mensagem ao chat
     * @param {string} playerName - Nome do jogador
     * @param {string} message - Mensagem
     */
    addChatMessage(playerName, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `<strong>${playerName}:</strong> ${message}`;
            chatMessages.appendChild(messageElement);

            // Rola para a última mensagem
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Reproduz o som de chat
            if (this.sound.get('chat_sound')) {
                this.sound.play('chat_sound', { volume: 0.5 });
            }
        }
    }
}