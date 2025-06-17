/**
 * Arquivo principal do cliente
 * Responsável por inicializar o jogo
 */

// Espera o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Configura os eventos da interface
    setupUIEvents();
});

/**
 * Configura os eventos da interface
 */
function setupUIEvents() {
    // Botão de iniciar jogo
    const startButton = document.getElementById('start-btn');
    if (startButton) {
        startButton.addEventListener('click', () => {
            // Obtém os dados do jogador
            const playerName = document.getElementById('player-name').value.trim();
            const characterSelect = document.getElementById('character-select');
            const character = characterSelect ? characterSelect.value : 'warrior';

            // Valida os dados
            if (!playerName) {
                alert('Por favor, digite seu nome.');
                return;
            }

            // Esconde a tela de login
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.style.display = 'none';
            }

            // Inicia o jogo
            startGame(playerName, character);
        });
    }

    // Seleção de personagem
    const characterSelect = document.getElementById('character-select');
    const characterPreview = document.getElementById('character-preview');
    
    if (characterSelect && characterPreview) {
        characterSelect.addEventListener('change', () => {
            // Atualiza a imagem de preview do personagem
            const character = characterSelect.value;
            characterPreview.src = `assets/characters/${character}/${character}_preview.png`;
        });

        // Inicializa a imagem de preview
        characterPreview.src = `assets/characters/${characterSelect.value}/${characterSelect.value}_preview.png`;
    }

    // Botão de enviar mensagem no chat
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    
    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const message = chatInput.value.trim();
            if (message) {
                // Envia a mensagem para o jogo
                if (window.game && window.game.events) {
                    window.game.events.emit('chat_message', message);
                }
                
                // Limpa o input
                chatInput.value = '';
            }
            
            // Remove o foco do input
            chatInput.blur();
        });
    }

    // Botões de ação
    setupActionButtons();
}

/**
 * Configura os botões de ação
 */
function setupActionButtons() {
    // Botão de ataque
    const attackBtn = document.getElementById('attack-btn');
    if (attackBtn) {
        attackBtn.addEventListener('click', () => {
            if (window.game && window.game.events) {
                window.game.events.emit('player_attack');
            }
        });
    }

    // Botão de interação
    const interactBtn = document.getElementById('interact-btn');
    if (interactBtn) {
        interactBtn.addEventListener('click', () => {
            if (window.game && window.game.events) {
                window.game.events.emit('player_interact');
            }
        });
    }

    // Botão de inventário
    const inventoryBtn = document.getElementById('inventory-btn');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', () => {
            if (window.game && window.game.events) {
                window.game.events.emit('toggle_inventory');
            }
        });
    }
}

/**
 * Inicia o jogo
 * @param {string} playerName - Nome do jogador
 * @param {string} character - Tipo de personagem
 */
function startGame(playerName, character) {
    // Armazena os dados do jogador
    window.playerData = {
        name: playerName,
        character: character
    };

    // Configura as cenas do jogo
    const scenes = [
        BootScene,
        PreloadScene,
        MainMenuScene,
        GameScene,
        UIScene
    ];

    // Configura o jogo
    const gameConfig = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: CONFIG.game.width,
        height: CONFIG.game.height,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                debug: CONFIG.debug.showPhysics
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        backgroundColor: CONFIG.game.backgroundColor,
        scene: scenes
    };

    // Cria a instância do jogo
    window.game = new Phaser.Game(gameConfig);

    // Configura eventos globais do jogo
    window.game.events = new Phaser.Events.EventEmitter();

    // Evento de chat
    window.game.events.on('chat_message', (message) => {
        // Obtém a cena do jogo
        const gameScene = window.game.scene.getScene('GameScene');
        if (gameScene && gameScene.socketManager) {
            // Envia a mensagem para o servidor
            gameScene.socketManager.sendChatMessage(message);
        }
    });

    // Evento de ataque
    window.game.events.on('player_attack', () => {
        // Obtém a cena do jogo
        const gameScene = window.game.scene.getScene('GameScene');
        if (gameScene) {
            // Executa o ataque
            gameScene.playerAttack();
        }
    });

    // Evento de interação
    window.game.events.on('player_interact', () => {
        // Obtém a cena do jogo
        const gameScene = window.game.scene.getScene('GameScene');
        if (gameScene) {
            // Executa a interação
            gameScene.playerInteract();
        }
    });

    // Evento de toggle do inventário
    window.game.events.on('toggle_inventory', () => {
        // Obtém a cena do jogo
        const gameScene = window.game.scene.getScene('GameScene');
        if (gameScene) {
            // Alterna o inventário
            gameScene.toggleInventory();
        }
    });
}