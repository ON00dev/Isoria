/**
 * Cena do menu principal
 * Exibida antes do jogo começar
 */
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        // Configura o fundo
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Adiciona o logo
        const logo = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'logo'
        );
        logo.setScale(0.7);

        // Adiciona o texto de título
        const titleText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 20,
            'Engine para Jogos Isométricos Multiplayer',
            {
                font: '24px Arial',
                fill: '#ffffff',
                align: 'center'
            }
        );
        titleText.setOrigin(0.5);

        // Adiciona o botão de iniciar
        const startButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 50,
            'Iniciar Jogo',
            {
                font: '20px Arial',
                fill: '#4cc9f0',
                align: 'center'
            }
        );
        startButton.setOrigin(0.5);
        startButton.setPadding(15);
        startButton.setInteractive({ useHandCursor: true });

        // Efeito de hover no botão
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#3db8df' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#4cc9f0' });
        });

        // Inicia o jogo ao clicar no botão
        startButton.on('pointerdown', () => {
            // Inicia a cena do jogo
            this.startGame();
        });

        // Adiciona o texto de versão
        const versionText = this.add.text(
            this.cameras.main.width - 10,
            this.cameras.main.height - 10,
            'v1.0.0',
            {
                font: '12px Arial',
                fill: '#888888',
                align: 'right'
            }
        );
        versionText.setOrigin(1);

        // Inicia a música de fundo
        if (this.sound.get('background_music')) {
            const music = this.sound.get('background_music');
            if (!music.isPlaying) {
                music.play({
                    loop: true,
                    volume: 0.5
                });
            }
        }
    }

    /**
     * Inicia o jogo
     */
    startGame() {
        // Esconde o menu principal
        document.getElementById('login-screen').style.display = 'flex';

        // Inicia a cena do jogo em segundo plano
        this.scene.start('GameScene');
        this.scene.start('UIScene');
    }
}