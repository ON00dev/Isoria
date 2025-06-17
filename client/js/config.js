/**
 * Configurações do jogo
 */
const CONFIG = {
    // Configurações do Phaser
    phaser: {
        type: Phaser.AUTO,
        parent: 'game',
        width: window.innerWidth,
        height: window.innerHeight,
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        backgroundColor: '#1a1a2e'
    },
    
    // Configurações do jogo
    game: {
        tileWidth: 64,  // Largura do tile em pixels
        tileHeight: 32,  // Altura do tile em pixels
        tileWidthHalf: 32,  // Metade da largura do tile
        tileHeightHalf: 16,  // Metade da altura do tile
        playerSpeed: 200,  // Velocidade de movimento do jogador
        debugMode: false,  // Modo de depuração
        defaultMap: 'world',  // Mapa padrão
        defaultPlayerSkin: 'warrior',  // Skin padrão do jogador
        defaultPlayerName: 'Jogador',  // Nome padrão do jogador
        defaultPlayerHP: 100,  // HP padrão do jogador
        attackCooldown: 500,  // Tempo de recarga do ataque em ms
        attackRange: 100,  // Alcance do ataque
        attackDamage: 10,  // Dano do ataque
        respawnTime: 5000  // Tempo de respawn em ms
    },
    
    // Configurações do servidor
    server: {
        url: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? `http://${window.location.hostname}:3000` 
            : window.location.origin,
        reconnectDelay: 1000,  // Tempo de espera para reconexão em ms
        maxReconnectAttempts: 5  // Número máximo de tentativas de reconexão
    },
    
    // Configurações de depuração
    debug: {
        showFPS: false,  // Mostrar FPS
        showPlayerPosition: false,  // Mostrar posição do jogador
        showColliders: false,  // Mostrar colisores
        logNetworkEvents: false  // Registrar eventos de rede no console
    }
};