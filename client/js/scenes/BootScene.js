/**
 * Cena de inicialização do jogo
 * Responsável por configurações iniciais e carregamento de assets essenciais
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Carrega assets essenciais para a tela de carregamento
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('loading-bar', 'assets/images/loading-bar.png');
        this.load.image('loading-bar-bg', 'assets/images/loading-bar-bg.png');
    }

    create() {
        // Configura opções do jogo
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        
        // Configura a física do jogo
        this.physics.world.setBounds(0, 0, 2000, 2000);
        
        // Passa para a próxima cena
        this.scene.start('PreloadScene');
    }
}