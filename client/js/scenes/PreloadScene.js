/**
 * Cena de pré-carregamento do jogo
 * Responsável por carregar todos os assets do jogo
 */
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Cria a barra de carregamento
        this.createLoadingBar();

        // Carrega os tilesets
        this.load.image('tiles', 'assets/tilesets/isometric-tileset.png');

        // Carrega os mapas
        this.load.tilemapTiledJSON('map', 'maps/world.json');

        // Carrega os sprites dos personagens
        this.loadCharacterAssets('warrior');
        this.loadCharacterAssets('mage');
        this.loadCharacterAssets('archer');

        // Carrega os efeitos
        this.load.spritesheet('attack_effect', 'assets/effects/attack_effect.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Carrega os sons
        this.load.audio('background_music', 'assets/sounds/background_music.mp3');
        this.load.audio('attack_sound', 'assets/sounds/attack.mp3');
        this.load.audio('hit_sound', 'assets/sounds/hit.mp3');
        this.load.audio('death_sound', 'assets/sounds/death.mp3');
        this.load.audio('walk_sound', 'assets/sounds/walk.mp3');
        this.load.audio('chat_sound', 'assets/sounds/chat.mp3');
    }

    /**
     * Cria a barra de carregamento
     */
    createLoadingBar() {
        // Posição da barra de carregamento
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const x = width / 2;
        const y = height / 2;

        // Adiciona o logo
        const logo = this.add.image(x, y - 100, 'logo');
        logo.setScale(0.5);

        // Adiciona o fundo da barra de carregamento
        const loadingBarBg = this.add.image(x, y + 50, 'loading-bar-bg');

        // Adiciona a barra de carregamento
        const loadingBar = this.add.image(x - loadingBarBg.width / 2, y + 50, 'loading-bar');
        loadingBar.setOrigin(0, 0.5);

        // Texto de carregamento
        const loadingText = this.add.text(x, y + 100, 'Carregando...', {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        });
        loadingText.setOrigin(0.5);

        // Atualiza a barra de carregamento conforme o progresso
        this.load.on('progress', (value) => {
            loadingBar.setScale(value, 1);
            loadingBar.setX(x - loadingBarBg.width / 2 + (loadingBarBg.width - loadingBar.width) / 2 * value);
            loadingText.setText(`Carregando... ${Math.floor(value * 100)}%`);
        });
    }

    /**
     * Carrega os assets de um personagem
     * @param {string} character - Nome do personagem
     */
    loadCharacterAssets(character) {
        // Carrega o atlas do personagem
        this.load.atlas(
            character,
            `assets/characters/${character}/${character}.png`,
            `assets/characters/${character}/${character}.json`
        );
    }

    create() {
        // Cria as animações dos efeitos
        this.createEffectAnimations();

        // Passa para a próxima cena
        this.scene.start('MainMenuScene');
    }

    /**
     * Cria as animações dos efeitos
     */
    createEffectAnimations() {
        // Animação do efeito de ataque
        this.anims.create({
            key: 'attack_animation',
            frames: this.anims.generateFrameNumbers('attack_effect', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });
    }
}