/**
 * Isoria Engine - Framework de Desenvolvimento de Jogos Isométricos
 * Sistema baseado em scripts com interface visual
 */

class IsoriaEngine {
    constructor() {
        this.game = null;
        this.currentScene = null;
        this.gameObjects = new Map();
        this.scripts = [];
        this.isRunning = false;
        this.config = {
            width: 800,
            height: 600,
            type: Phaser.AUTO,
            backgroundColor: '#2c3e50',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            }
        };
        
        this.initializeAPI();
    }

    initializeAPI() {
        // API Global da Isoria Engine
        window.Isoria = {
            // Scene Management
            scene: {
                create: (name, config = {}) => this.createScene(name, config),
                switch: (name) => this.switchScene(name),
                current: () => this.currentScene,
                addTilemap: (key, width, height) => this.addTilemap(key, width, height),
                setBackground: (color) => this.setBackground(color)
            },

            // GameObject Management
            gameObject: {
                create: (type, x, y, config = {}) => this.createGameObject(type, x, y, config),
                find: (id) => this.gameObjects.get(id),
                destroy: (id) => this.destroyGameObject(id),
                move: (id, x, y) => this.moveGameObject(id, x, y),
                animate: (id, animation) => this.animateGameObject(id, animation)
            },

            // Player Management
            player: {
                create: (x, y, config = {}) => this.createPlayer(x, y, config),
                setControls: (controls) => this.setPlayerControls(controls),
                getPosition: () => this.getPlayerPosition(),
                move: (x, y) => this.movePlayer(x, y)
            },

            // Physics
            physics: {
                addCollider: (obj1, obj2, callback) => this.addCollider(obj1, obj2, callback),
                addTrigger: (obj1, obj2, callback) => this.addTrigger(obj1, obj2, callback),
                setGravity: (x, y) => this.setGravity(x, y)
            },

            // Audio
            audio: {
                playMusic: (key, loop = true) => this.playMusic(key, loop),
                playSound: (key) => this.playSound(key),
                stopMusic: () => this.stopMusic(),
                setVolume: (volume) => this.setVolume(volume)
            },

            // UI
            ui: {
                addText: (x, y, text, style = {}) => this.addText(x, y, text, style),
                addButton: (x, y, text, callback, style = {}) => this.addButton(x, y, text, callback, style),
                addPanel: (x, y, width, height, style = {}) => this.addPanel(x, y, width, height, style),
                showDialog: (text, options = {}) => this.showDialog(text, options)
            },

            // Camera
            camera: {
                follow: (target) => this.cameraFollow(target),
                setZoom: (zoom) => this.setCameraZoom(zoom),
                setBounds: (x, y, width, height) => this.setCameraBounds(x, y, width, height)
            },

            // Utilities
            utils: {
                random: (min, max) => Math.random() * (max - min) + min,
                distance: (obj1, obj2) => this.calculateDistance(obj1, obj2),
                angle: (obj1, obj2) => this.calculateAngle(obj1, obj2),
                log: (message) => this.log(message)
            }
        };
    }

    // Scene Management
    createScene(name, config = {}) {
        const sceneConfig = {
            key: name,
            preload: function() {
                // Preload assets
            },
            create: function() {
                this.cameras.main.setBackgroundColor(config.backgroundColor || '#2c3e50');
                if (config.physics) {
                    this.physics.world.setBounds(0, 0, config.width || 800, config.height || 600);
                }
            },
            update: function() {
                // Update logic
            }
        };

        if (!this.game) {
            this.config.scene = sceneConfig;
            this.game = new Phaser.Game(this.config);
        } else {
            this.game.scene.add(name, sceneConfig);
        }

        this.currentScene = name;
        this.log(`Cena '${name}' criada com sucesso`);
        return name;
    }

    switchScene(name) {
        if (this.game && this.game.scene.getScene(name)) {
            this.game.scene.start(name);
            this.currentScene = name;
            this.log(`Mudou para a cena '${name}'`);
        } else {
            this.log(`Erro: Cena '${name}' não encontrada`, 'error');
        }
    }

    addTilemap(key, width, height) {
        if (!this.game || !this.currentScene) {
            this.log('Erro: Nenhuma cena ativa', 'error');
            return;
        }

        const scene = this.game.scene.getScene(this.currentScene);
        // Implementar lógica do tilemap
        this.log(`Tilemap '${key}' adicionado (${width}x${height})`);
    }

    // GameObject Management
    createGameObject(type, x, y, config = {}) {
        if (!this.game || !this.currentScene) {
            this.log('Erro: Nenhuma cena ativa', 'error');
            return null;
        }

        const scene = this.game.scene.getScene(this.currentScene);
        const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let gameObject;
        
        switch (type) {
            case 'sprite':
                gameObject = scene.add.rectangle(x, y, config.width || 32, config.height || 32, config.color || 0x00ff00);
                break;
            case 'npc':
                gameObject = scene.add.rectangle(x, y, 32, 32, 0xff0000);
                break;
            case 'item':
                gameObject = scene.add.rectangle(x, y, 16, 16, 0xffff00);
                break;
            default:
                gameObject = scene.add.rectangle(x, y, 32, 32, 0x0000ff);
        }

        gameObject.setInteractive();
        gameObject.engineId = id;
        gameObject.engineType = type;
        
        this.gameObjects.set(id, gameObject);
        this.log(`${type} criado com ID: ${id}`);
        
        return id;
    }

    createPlayer(x, y, config = {}) {
        const playerId = this.createGameObject('player', x, y, { ...config, color: 0x00ff00 });
        const player = this.gameObjects.get(playerId);
        
        if (player && this.game) {
            const scene = this.game.scene.getScene(this.currentScene);
            scene.physics.add.existing(player);
            player.body.setCollideWorldBounds(true);
            
            // Configurar controles padrão
            this.setPlayerControls({
                up: 'W',
                down: 'S',
                left: 'A',
                right: 'D'
            });
        }
        
        this.log(`Jogador criado na posição (${x}, ${y})`);
        return playerId;
    }

    // Physics
    addCollider(obj1Id, obj2Id, callback) {
        const obj1 = this.gameObjects.get(obj1Id);
        const obj2 = this.gameObjects.get(obj2Id);
        
        if (obj1 && obj2 && this.game) {
            const scene = this.game.scene.getScene(this.currentScene);
            scene.physics.add.collider(obj1, obj2, callback);
            this.log(`Colisor adicionado entre ${obj1Id} e ${obj2Id}`);
        }
    }

    // Audio
    playMusic(key, loop = true) {
        if (this.game) {
            const scene = this.game.scene.getScene(this.currentScene);
            if (scene.sound.get(key)) {
                scene.sound.play(key, { loop });
                this.log(`Música '${key}' iniciada`);
            }
        }
    }

    // UI
    addText(x, y, text, style = {}) {
        if (!this.game || !this.currentScene) return null;
        
        const scene = this.game.scene.getScene(this.currentScene);
        const defaultStyle = {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        };
        
        const textObject = scene.add.text(x, y, text, { ...defaultStyle, ...style });
        const id = `text_${Date.now()}`;
        textObject.engineId = id;
        
        this.gameObjects.set(id, textObject);
        this.log(`Texto adicionado: "${text}"`);
        
        return id;
    }

    addButton(x, y, text, callback, style = {}) {
        if (!this.game || !this.currentScene) return null;
        
        const scene = this.game.scene.getScene(this.currentScene);
        const button = scene.add.rectangle(x, y, style.width || 120, style.height || 40, style.backgroundColor || 0x4CAF50);
        const buttonText = scene.add.text(x, y, text, {
            fontSize: style.fontSize || '14px',
            fill: style.color || '#ffffff'
        }).setOrigin(0.5);
        
        button.setInteractive();
        button.on('pointerdown', callback);
        
        const id = `button_${Date.now()}`;
        button.engineId = id;
        
        this.gameObjects.set(id, { button, text: buttonText });
        this.log(`Botão '${text}' adicionado`);
        
        return id;
    }

    // Utilities
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        
        // Usar o console original para evitar recursão infinita
        if (this._originalConsoleLog) {
            this._originalConsoleLog(logMessage);
        } else {
            console.log(logMessage);
        }
        
        // Criar elemento de log
        const createLogElement = () => {
            const logLine = document.createElement('div');
            logLine.className = `console-line ${type}`;
            logLine.innerHTML = `
                <span class="timestamp">[${timestamp}]</span>
                <span class="message">${message}</span>
            `;
            return logLine;
        };
        
        // Enviar para o console principal da interface
        const consoleElement = document.getElementById('console-output');
        if (consoleElement) {
            const logLine = createLogElement();
            consoleElement.appendChild(logLine);
            consoleElement.scrollTop = consoleElement.scrollHeight;
            
            // Garantir que o painel do console esteja visível
            const bottomPanel = document.getElementById('bottom-panel');
            if (bottomPanel && bottomPanel.style.display === 'none') {
                bottomPanel.style.display = 'flex';
            }
        }
    }

    // Script Execution
    executeScript(scriptCode) {
        try {
            this.log('Executando script...');
            
            // Limpar objetos anteriores se necessário
            if (this.isRunning) {
                this.stop();
            }
            
            // Salvar as funções originais do console
            this._originalConsoleLog = console.log;
            this._originalConsoleWarn = console.warn;
            this._originalConsoleError = console.error;
            
            // Função auxiliar para formatar argumentos
            const formatArgs = (args) => {
                return args.map(arg => {
                    if (arg === null) return 'null';
                    if (arg === undefined) return 'undefined';
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');
            };
            
            // Interceptar console.log
            console.log = (...args) => {
                // Chamar o console.log original
                this._originalConsoleLog.apply(console, args);
                
                // Redirecionar para o console da interface
                const message = formatArgs(args);
                this.log(message, 'log');
            };
            
            // Interceptar console.warn
            console.warn = (...args) => {
                // Chamar o console.warn original
                this._originalConsoleWarn.apply(console, args);
                
                // Redirecionar para o console da interface
                const message = formatArgs(args);
                this.log(message, 'warning');
            };
            
            // Interceptar console.error
            console.error = (...args) => {
                // Chamar o console.error original
                this._originalConsoleError.apply(console, args);
                
                // Redirecionar para o console da interface
                const message = formatArgs(args);
                this.log(message, 'error');
            };
            
            // Executar o código do script
            const scriptFunction = new Function(scriptCode);
            scriptFunction();
            
            this.isRunning = true;
            this.log('Script executado com sucesso', 'success');
            
        } catch (error) {
            this.log(`Erro na execução do script: ${error.message}`, 'error');
        } finally {
            // Restaurar as funções originais do console
            if (this._originalConsoleLog) {
                console.log = this._originalConsoleLog;
                this._originalConsoleLog = null;
            }
            if (this._originalConsoleWarn) {
                console.warn = this._originalConsoleWarn;
                this._originalConsoleWarn = null;
            }
            if (this._originalConsoleError) {
                console.error = this._originalConsoleError;
                this._originalConsoleError = null;
            }
        }
    }

    stop() {
        if (this.game) {
            this.gameObjects.clear();
            this.isRunning = false;
            this.log('Engine parada');
        }
    }

    reset() {
        this.stop();
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
        this.currentScene = null;
        this.log('Engine resetada');
    }

    // Visual Tool Integration
    generateScriptFromVisualTools(tools) {
        let script = '// Script gerado automaticamente pelas ferramentas visuais\n\n';
        
        tools.forEach(tool => {
            switch (tool.type) {
                case 'create-scene':
                    script += `Isoria.scene.create('${tool.name}', ${JSON.stringify(tool.config)});\n`;
                    break;
                case 'add-player':
                    script += `Isoria.player.create(${tool.x}, ${tool.y}, ${JSON.stringify(tool.config)});\n`;
                    break;
                case 'add-sprite':
                    script += `Isoria.gameObject.create('sprite', ${tool.x}, ${tool.y}, ${JSON.stringify(tool.config)});\n`;
                    break;
                // Adicionar mais casos conforme necessário
            }
        });
        
        return script;
    }
}

// Instância global da engine
window.IsoriaEngineInstance = new IsoriaEngine();