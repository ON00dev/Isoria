/**
 * Classe que representa um jogador no jogo
 */
class Player extends Phaser.GameObjects.Container {
    /**
     * Construtor do jogador
     * @param {Object} config - Configuração do jogador
     */
    constructor(config) {
        super(config.scene, config.x, config.y);
        
        // Propriedades do jogador
        this.id = config.id;
        this.name = config.name;
        this.hp = config.hp || CONFIG.game.defaultPlayerHP;
        this.isLocal = config.isLocal || false;
        this.direction = config.frame || 'down';
        this.moving = false;
        this.attacking = false;
        this.dead = false;
        
        // Cria o sprite do jogador
        this.sprite = config.scene.add.sprite(0, 0, config.texture, `${config.frame}_idle_1`);
        
        // Cria o texto com o nome do jogador
        this.nameText = config.scene.add.text(0, -40, this.name, {
            font: '14px Arial',
            fill: this.isLocal ? '#26752d' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        this.nameText.setOrigin(0.5);
        
        // Cria a barra de vida
        this.hpBar = config.scene.add.graphics();
        this.updateHPBar();
        
        // Adiciona os componentes ao container
        this.add([this.hpBar, this.sprite, this.nameText]);
        
        // Adiciona o container à cena
        config.scene.add.existing(this);
        
        // Configura a física do jogador se for o jogador local
        if (this.isLocal) {
            config.scene.physics.world.enable(this);
            this.body.setSize(32, 32);
            this.body.setOffset(-16, -16);
        }
        
        // Configura a profundidade do jogador com base na posição Y
        this.setDepth(this.y);
        
        // Cria as animações do jogador
        this.createAnimations(config.scene, config.texture);
    }
    
    /**
     * Cria as animações do jogador
     * @param {Phaser.Scene} scene - A cena do jogo
     * @param {string} texture - A textura do jogador
     */
    createAnimations(scene, texture) {
        // Direções possíveis
        const directions = ['down', 'up', 'left', 'right'];
        
        // Cria animações para cada direção
        directions.forEach(direction => {
            // Animação de movimento
            scene.anims.create({
                key: `${texture}_${direction}_walk`,
                frames: scene.anims.generateFrameNames(texture, {
                    prefix: `${direction}_walk_`,
                    start: 1,
                    end: 4
                }),
                frameRate: 8,
                repeat: -1
            });
            
            // Animação de idle
            scene.anims.create({
                key: `${texture}_${direction}_idle`,
                frames: scene.anims.generateFrameNames(texture, {
                    prefix: `${direction}_idle_`,
                    start: 1,
                    end: 2
                }),
                frameRate: 2,
                repeat: -1
            });
            
            // Animação de ataque
            scene.anims.create({
                key: `${texture}_${direction}_attack`,
                frames: scene.anims.generateFrameNames(texture, {
                    prefix: `${direction}_attack_`,
                    start: 1,
                    end: 3
                }),
                frameRate: 12,
                repeat: 0
            });
        });
        
        // Animação de morte
        scene.anims.create({
            key: `${texture}_death`,
            frames: scene.anims.generateFrameNames(texture, {
                prefix: 'death_',
                start: 1,
                end: 3
            }),
            frameRate: 6,
            repeat: 0
        });
        
        // Inicia a animação idle
        this.playAnimation('idle');
    }
    
    /**
     * Atualiza o jogador
     */
    update() {
        // Atualiza a profundidade com base na posição Y
        this.setDepth(this.y);
    }
    
    /**
     * Reproduz uma animação
     * @param {string} anim - Nome da animação (walk, idle, attack)
     */
    playAnimation(anim) {
        if (this.dead) return;
        
        const texture = this.sprite.texture.key;
        this.sprite.play(`${texture}_${this.direction}_${anim}`, true);
    }
    
    /**
     * Move o jogador para cima
     */
    moveUp() {
        if (this.dead || this.attacking) return;
        
        this.direction = 'up';
        this.moving = true;
        
        if (this.isLocal) {
            this.body.setVelocityY(-CONFIG.game.playerSpeed);
            this.body.setVelocityX(0);
        }
        
        this.playAnimation('walk');
    }
    
    /**
     * Move o jogador para baixo
     */
    moveDown() {
        if (this.dead || this.attacking) return;
        
        this.direction = 'down';
        this.moving = true;
        
        if (this.isLocal) {
            this.body.setVelocityY(CONFIG.game.playerSpeed);
            this.body.setVelocityX(0);
        }
        
        this.playAnimation('walk');
    }
    
    /**
     * Move o jogador para a esquerda
     */
    moveLeft() {
        if (this.dead || this.attacking) return;
        
        this.direction = 'left';
        this.moving = true;
        
        if (this.isLocal) {
            this.body.setVelocityX(-CONFIG.game.playerSpeed);
            this.body.setVelocityY(0);
        }
        
        this.playAnimation('walk');
    }
    
    /**
     * Move o jogador para a direita
     */
    moveRight() {
        if (this.dead || this.attacking) return;
        
        this.direction = 'right';
        this.moving = true;
        
        if (this.isLocal) {
            this.body.setVelocityX(CONFIG.game.playerSpeed);
            this.body.setVelocityY(0);
        }
        
        this.playAnimation('walk');
    }
    
    /**
     * Para o movimento do jogador
     */
    stopMovement() {
        if (this.dead) return;
        
        this.moving = false;
        
        if (this.isLocal) {
            this.body.setVelocity(0);
        }
        
        if (!this.attacking) {
            this.playAnimation('idle');
        }
    }
    
    /**
     * Move o jogador para uma posição específica
     * @param {number} x - Posição X de destino
     * @param {number} y - Posição Y de destino
     * @param {string} direction - Direção do movimento
     * @param {Function} onComplete - Callback quando o movimento for concluído
     */
    moveTo(x, y, direction, onComplete) {
        if (this.dead) return;
        
        // Atualiza a direção
        if (direction) {
            this.direction = direction;
        }
        
        // Inicia a animação de movimento
        this.moving = true;
        this.playAnimation('walk');
        
        // Se for o jogador local, usa a física para mover
        if (this.isLocal) {
            // Calcula a velocidade com base na direção
            const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
            const velocityX = Math.cos(angle) * CONFIG.game.playerSpeed;
            const velocityY = Math.sin(angle) * CONFIG.game.playerSpeed;
            
            // Define a velocidade
            this.body.setVelocity(velocityX, velocityY);
            
            // Verifica quando o jogador chega próximo ao destino
            const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
            if (distance < 5) {
                this.x = x;
                this.y = y;
                this.stopMovement();
                if (onComplete) onComplete();
            }
        }
        // Se for outro jogador, usa tween para mover
        else {
            this.scene.tweens.add({
                targets: this,
                x: x,
                y: y,
                duration: 500,
                ease: 'Linear',
                onComplete: () => {
                    this.stopMovement();
                    if (onComplete) onComplete();
                }
            });
        }
    }
    
    /**
     * Executa um ataque
     */
    attack() {
        if (this.dead || this.attacking) return;
        
        this.attacking = true;
        this.playAnimation('attack');
        
        // Cria um efeito de ataque
        this.createAttackEffect();
        
        // Reseta o estado de ataque após a animação
        this.sprite.once('animationcomplete', () => {
            this.attacking = false;
            if (this.moving) {
                this.playAnimation('walk');
            } else {
                this.playAnimation('idle');
            }
        });
    }
    
    /**
     * Cria um efeito visual de ataque
     */
    createAttackEffect() {
        // Calcula a posição do efeito com base na direção
        let offsetX = 0;
        let offsetY = 0;
        
        switch (this.direction) {
            case 'up':
                offsetY = -40;
                break;
            case 'down':
                offsetY = 40;
                break;
            case 'left':
                offsetX = -40;
                break;
            case 'right':
                offsetX = 40;
                break;
        }
        
        // Cria o efeito de ataque
        const effect = this.scene.add.sprite(this.x + offsetX, this.y + offsetY, 'attack_effect');
        effect.setDepth(this.depth + 1);
        effect.play('attack_animation');
        
        // Remove o efeito após a animação
        effect.once('animationcomplete', () => {
            effect.destroy();
        });
    }
    
    /**
     * Define o HP do jogador
     * @param {number} hp - Novo valor de HP
     */
    setHP(hp) {
        this.hp = Math.max(0, Math.min(hp, CONFIG.game.defaultPlayerHP));
        this.updateHPBar();
    }
    
    /**
     * Atualiza a barra de vida do jogador
     */
    updateHPBar() {
        // Limpa a barra de vida
        this.hpBar.clear();
        
        // Calcula a largura da barra de vida
        const width = 40;
        const height = 6;
        const x = -width / 2;
        const y = -30;
        
        // Desenha o fundo da barra de vida
        this.hpBar.fillStyle(0x000000, 0.8);
        this.hpBar.fillRect(x, y, width, height);
        
        // Calcula a porcentagem de HP
        const hpPercentage = this.hp / CONFIG.game.defaultPlayerHP;
        
        // Escolhe a cor com base na porcentagem de HP
        let color;
        if (hpPercentage > 0.6) {
            color = 0x26752d; // Azul
        } else if (hpPercentage > 0.3) {
            color = 0xf77f00; // Laranja
        } else {
            color = 0xe63946; // Vermelho
        }
        
        // Desenha a barra de vida
        this.hpBar.fillStyle(color, 1);
        this.hpBar.fillRect(x, y, width * hpPercentage, height);
    }
    
    /**
     * Mata o jogador
     */
    die() {
        if (this.dead) return;
        
        this.dead = true;
        this.hp = 0;
        this.updateHPBar();
        
        // Para o movimento
        if (this.isLocal) {
            this.body.setVelocity(0);
        }
        
        // Reproduz a animação de morte
        const texture = this.sprite.texture.key;
        this.sprite.play(`${texture}_death`);
        
        // Reduz a opacidade do jogador
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 500
        });
    }
    
    /**
     * Respawna o jogador
     * @param {number} x - Posição X de respawn
     * @param {number} y - Posição Y de respawn
     */
    respawn(x, y) {
        this.dead = false;
        this.hp = CONFIG.game.defaultPlayerHP;
        this.updateHPBar();
        
        // Define a posição de respawn
        this.x = x;
        this.y = y;
        
        // Restaura a opacidade do jogador
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 500
        });
        
        // Reproduz a animação idle
        this.playAnimation('idle');
    }
}