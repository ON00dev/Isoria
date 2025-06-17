/**
 * Gerenciador de assets do jogo
 * Responsável por definir quais assets precisam ser carregados
 */
class AssetManager {
    /**
     * Cria um novo gerenciador de assets
     * @param {Phaser.Scene} scene - Cena do Phaser
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Carrega os assets do jogo
     */
    loadAssets() {
        // Carrega os tilesets
        this.loadTilesets();

        // Carrega os mapas
        this.loadMaps();

        // Carrega os sprites dos personagens
        this.loadCharacters();

        // Carrega os efeitos
        this.loadEffects();

        // Carrega os sons
        this.loadSounds();

        // Carrega as interfaces
        this.loadUI();
    }

    /**
     * Carrega os tilesets
     */
    loadTilesets() {
        this.scene.load.image('tiles', 'assets/tilesets/isometric-tileset.png');
    }

    /**
     * Carrega os mapas
     */
    loadMaps() {
        this.scene.load.tilemapTiledJSON('map', 'maps/world.json');
    }

    /**
     * Carrega os sprites dos personagens
     */
    loadCharacters() {
        // Lista de personagens disponíveis
        const characters = ['warrior', 'mage', 'archer'];

        // Carrega cada personagem
        characters.forEach(character => {
            this.loadCharacterAssets(character);
        });
    }

    /**
     * Carrega os assets de um personagem
     * @param {string} character - Nome do personagem
     */
    loadCharacterAssets(character) {
        // Carrega o atlas do personagem
        this.scene.load.atlas(
            character,
            `assets/characters/${character}/${character}.png`,
            `assets/characters/${character}/${character}.json`
        );
    }

    /**
     * Carrega os efeitos
     */
    loadEffects() {
        // Efeito de ataque
        this.scene.load.spritesheet('attack_effect', 'assets/effects/attack_effect.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    /**
     * Carrega os sons
     */
    loadSounds() {
        // Música de fundo
        this.scene.load.audio('background_music', 'assets/sounds/background_music.mp3');

        // Sons de ações
        this.scene.load.audio('attack_sound', 'assets/sounds/attack.mp3');
        this.scene.load.audio('hit_sound', 'assets/sounds/hit.mp3');
        this.scene.load.audio('death_sound', 'assets/sounds/death.mp3');
        this.scene.load.audio('walk_sound', 'assets/sounds/walk.mp3');
        this.scene.load.audio('chat_sound', 'assets/sounds/chat.mp3');
    }

    /**
     * Carrega as interfaces
     */
    loadUI() {
        // Elementos de UI
        this.scene.load.image('button', 'assets/ui/button.png');
        this.scene.load.image('button_hover', 'assets/ui/button_hover.png');
        this.scene.load.image('panel', 'assets/ui/panel.png');
        this.scene.load.image('health_bar', 'assets/ui/health_bar.png');
        this.scene.load.image('health_bar_fill', 'assets/ui/health_bar_fill.png');
    }

    /**
     * Cria as animações dos personagens
     */
    createCharacterAnimations() {
        // Lista de personagens disponíveis
        const characters = ['warrior', 'mage', 'archer'];

        // Cria animações para cada personagem
        characters.forEach(character => {
            this.createCharacterAnimation(character);
        });
    }

    /**
     * Cria as animações de um personagem
     * @param {string} character - Nome do personagem
     */
    createCharacterAnimation(character) {
        // Lista de direções
        const directions = [
            CONSTANTS.DIRECTION.DOWN,
            CONSTANTS.DIRECTION.DOWN_LEFT,
            CONSTANTS.DIRECTION.LEFT,
            CONSTANTS.DIRECTION.UP_LEFT,
            CONSTANTS.DIRECTION.UP,
            CONSTANTS.DIRECTION.UP_RIGHT,
            CONSTANTS.DIRECTION.RIGHT,
            CONSTANTS.DIRECTION.DOWN_RIGHT
        ];

        // Lista de estados
        const states = [
            { name: CONSTANTS.PLAYER_STATE.IDLE, frameRate: 5, repeat: -1 },
            { name: CONSTANTS.PLAYER_STATE.WALKING, frameRate: 10, repeat: -1 },
            { name: CONSTANTS.PLAYER_STATE.ATTACKING, frameRate: 15, repeat: 0 },
            { name: CONSTANTS.PLAYER_STATE.DEAD, frameRate: 10, repeat: 0 }
        ];

        // Cria animações para cada combinação de estado e direção
        directions.forEach(direction => {
            states.forEach(state => {
                const animKey = `${character}_${state.name}_${direction}`;
                
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNames(character, {
                        prefix: `${state.name}_${direction}_`,
                        start: 0,
                        end: state.name === CONSTANTS.PLAYER_STATE.IDLE ? 3 : 
                             state.name === CONSTANTS.PLAYER_STATE.WALKING ? 7 :
                             state.name === CONSTANTS.PLAYER_STATE.ATTACKING ? 5 :
                             state.name === CONSTANTS.PLAYER_STATE.DEAD ? 5 : 0,
                        zeroPad: 2
                    }),
                    frameRate: state.frameRate,
                    repeat: state.repeat
                });
            });
        });
    }

    /**
     * Cria as animações dos efeitos
     */
    createEffectAnimations() {
        // Animação do efeito de ataque
        this.scene.anims.create({
            key: 'attack_animation',
            frames: this.scene.anims.generateFrameNumbers('attack_effect', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: 0
        });
    }
}