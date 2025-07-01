/**
 * Script Editor - Implementação da funcionalidade do editor de scripts
 * para a engine Isoria
 */

class ScriptEditor {
    constructor() {
        this.currentScript = null;
        this.scripts = {
            'scene_script.js': '// Script para configuração da cena\nIsoria.scene.create(\'MainScene\', { backgroundColor: \'#2c3e50\' });\nIsoria.scene.setBackground(\'#2c3e50\');\n\n// Adicionar elementos à cena\nconst tilemap = Isoria.scene.addTilemap(\'main\', 10, 10);',
            'player_script.js': '// Script para configuração do jogador\nconst player = Isoria.player.create(200, 200, {\n    speed: 5,\n    texture: \'player\'\n});\n\n// Configurar controles do jogador\nIsoria.player.setControls({\n    up: \'W\',\n    down: \'S\',\n    left: \'A\',\n    right: \'D\'\n});\n\n// Configurar câmera para seguir o jogador\nIsoria.camera.follow(player);',
            'game_script.js': '// Script principal do jogo\n\n// Criar cena principal\nIsoria.scene.create(\'MainScene\', { backgroundColor: \'#2c3e50\' });\n\n// Adicionar jogador\nconst player = Isoria.player.create(200, 200, {\n    speed: 5,\n    texture: \'player\'\n});\n\n// Adicionar NPCs\nconst npc1 = Isoria.gameObject.create(\'npc\', 300, 150);\nconst npc2 = Isoria.gameObject.create(\'npc\', 150, 300);\n\n// Adicionar colisões\nIsoria.physics.addCollider(player, npc1);\nIsoria.physics.addCollider(player, npc2);\n\n// Adicionar texto de UI\nIsoria.ui.addText(400, 50, \'Isoria Game\', {\n    fontSize: \'24px\',\n    color: \'#ffffff\'\n});'
        };
        
        // Inicializar a interface do editor
        this.initializeInterface();
        
        // Carregar o primeiro script por padrão
        this.loadScript(Object.keys(this.scripts)[0]);
        
        // Instância do CodeMirror
        this.codeMirror = null;
    }
    
    initializeInterface() {
        // Elementos do DOM
        this.scriptContent = document.getElementById('script-content');
        this.scriptSelector = document.getElementById('script-selector');
        this.runScriptBtn = document.getElementById('run-script-btn');
        this.saveScriptBtn = document.getElementById('save-script-btn');
        this.formatScriptBtn = document.getElementById('format-script-btn');
        this.newScriptBtn = document.getElementById('new-script-btn');
        this.consoleOutput = document.getElementById('console-output');
        this.apiExamples = document.querySelectorAll('.api-example');
        
        // Inicializar o CodeMirror
        this.initializeCodeMirror();
        
        // Preencher o seletor de scripts
        this.updateScriptSelector();
        
        // Event listeners
        this.runScriptBtn.addEventListener('click', () => this.runCurrentScript());
        this.saveScriptBtn.addEventListener('click', () => this.saveCurrentScript());
        this.formatScriptBtn.addEventListener('click', () => this.formatCurrentScript());
        this.newScriptBtn.addEventListener('click', () => this.createNewScript());
        
        // Mudar script quando o seletor mudar
        this.scriptSelector.addEventListener('change', (e) => {
            this.loadScript(e.target.value);
        });
        
        // Adicionar exemplos de API ao clicar neles
        this.apiExamples.forEach(example => {
            example.addEventListener('click', () => {
                this.insertCodeAtCursor(example.textContent);
            });
        });
        
        // Botões de controle do jogo
        const playBtn = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');
        const stopBtn = document.getElementById('btn-stop');
        
        if (playBtn) playBtn.addEventListener('click', () => this.runCurrentScript());
        if (stopBtn) stopBtn.addEventListener('click', () => {
            if (window.IsoriaEngineInstance) {
                window.IsoriaEngineInstance.reset();
                this.logMessage('Engine parada', 'info');
            }
        });
    }
    
    updateScriptSelector() {
        // Limpar seletor
        this.scriptSelector.innerHTML = '';
        
        // Adicionar cada script ao seletor
        Object.keys(this.scripts).forEach(scriptName => {
            const option = document.createElement('option');
            option.value = scriptName;
            option.textContent = scriptName;
            this.scriptSelector.appendChild(option);
        });
        
        // Selecionar o script atual
        if (this.currentScript) {
            this.scriptSelector.value = this.currentScript;
        }
    }
    
    loadScript(scriptName) {
        if (this.scripts[scriptName]) {
            this.currentScript = scriptName;
            
            // Atualizar o conteúdo no CodeMirror
            if (this.codeMirror) {
                this.codeMirror.setValue(this.scripts[scriptName]);
            }
            
            this.logMessage(`Script carregado: ${scriptName}`, 'info');
        }
    }
    
    runCurrentScript() {
        if (!this.currentScript) return;
        
        // Salvar o script atual antes de executar
        this.saveCurrentScript();
        
        // Limpar o console
        this.clearConsole();
        
        // Garantir que o console no sidebar-right esteja visível
        const sidebarConsole = document.getElementById('sidebar-console');
        if (sidebarConsole) {
            sidebarConsole.style.display = 'block';
            
            // Garantir que o painel do console esteja visível
            const panel = document.getElementById('sidebar-console-panel');
            if (panel) {
                const content = panel.querySelector('.panel-content');
                if (content) {
                    content.style.display = 'block';
                }
            }
        }
        
        // Executar o script usando a API da engine
        try {
            // Obter o código do CodeMirror
            const scriptCode = this.codeMirror ? this.codeMirror.getValue() : '';
            
            // Verificar se a instância da engine existe
            if (window.IsoriaEngineInstance) {
                // Resetar a engine antes de executar um novo script
                window.IsoriaEngineInstance.reset();
                
                // Executar o script
                window.IsoriaEngineInstance.executeScript(scriptCode);
                
                this.logMessage('Script executado com sucesso', 'success');
            } else {
                this.logMessage('Erro: Engine não inicializada', 'error');
            }
        } catch (error) {
            this.logMessage(`Erro ao executar script: ${error.message}`, 'error');
        }
    }
    
    saveCurrentScript() {
        if (!this.currentScript) return;
        
        // Obter o conteúdo do CodeMirror
        const content = this.codeMirror ? this.codeMirror.getValue() : '';
        
        // Salvar o conteúdo atual no objeto scripts
        this.scripts[this.currentScript] = content;
        
        // Atualizar o projeto (em uma implementação real, isso salvaria no servidor)
        if (window.engineTools && window.engineTools.projectData) {
            // Encontrar o script no projectData ou adicionar se não existir
            const scriptIndex = window.engineTools.projectData.scripts.findIndex(
                s => s.name === this.currentScript
            );
            
            if (scriptIndex >= 0) {
                window.engineTools.projectData.scripts[scriptIndex].content = content;
            } else {
                window.engineTools.projectData.scripts.push({
                    name: this.currentScript,
                    content: content
                });
            }
            
            // Salvar no servidor (se implementado)
            if (window.engineTools.saveProjectData) {
                window.engineTools.saveProjectData();
            }
        }
        
        this.logMessage(`Script salvo: ${this.currentScript}`, 'success');
    }
    
    formatCurrentScript() {
        if (!this.codeMirror) return;
        
        try {
            // Obter o código atual
            const code = this.codeMirror.getValue();
            
            // Formatar o código JavaScript
            const formattedCode = this.formatJavaScript(code);
            
            // Atualizar o código no editor
            this.codeMirror.setValue(formattedCode);
            
            this.logMessage('Código formatado com sucesso', 'success');
        } catch (error) {
            this.logMessage(`Erro ao formatar código: ${error.message}`, 'error');
        }
    }
    
    formatJavaScript(code) {
        // Implementação simples de formatação
        // Em uma implementação real, você usaria uma biblioteca como prettier ou js-beautify
        
        // Remover espaços em branco extras
        let formatted = code.trim();
        
        // Adicionar quebras de linha após ponto e vírgula e chaves
        formatted = formatted.replace(/;\s*/g, ';\n');
        formatted = formatted.replace(/{\s*/g, '{\n');
        formatted = formatted.replace(/}\s*/g, '}\n');
        
        // Adicionar indentação
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const indentedLines = lines.map(line => {
            // Reduzir indentação para linhas que fecham blocos
            if (line.trim().startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Adicionar indentação
            const indentedLine = '    '.repeat(indentLevel) + line.trim();
            
            // Aumentar indentação para linhas que abrem blocos
            if (line.trim().endsWith('{')) {
                indentLevel++;
            }
            
            return indentedLine;
        });
        
        return indentedLines.join('\n');
    }
    
    createNewScript() {
        // Solicitar nome do novo script
        const scriptName = prompt('Digite o nome do novo script (com extensão .js):', 'new_script.js');
        
        if (!scriptName) return;
        
        // Validar nome do script
        if (!scriptName.endsWith('.js')) {
            this.logMessage('Nome de script inválido. Deve terminar com .js', 'error');
            return;
        }
        
        // Verificar se já existe
        if (this.scripts[scriptName]) {
            this.logMessage(`Script ${scriptName} já existe`, 'warning');
            return;
        }
        
        // Criar novo script com template básico
        this.scripts[scriptName] = `// ${scriptName} - Criado em ${new Date().toLocaleString()}\n\n// Seu código aqui\n`;
        
        // Atualizar seletor e carregar o novo script
        this.updateScriptSelector();
        this.loadScript(scriptName);
        
        this.logMessage(`Novo script criado: ${scriptName}`, 'success');
    }
    
    insertCodeAtCursor(code) {
        // Verificar se o CodeMirror está inicializado
        if (!this.codeMirror) return;
        
        // Inserir código na posição do cursor
        const cursor = this.codeMirror.getCursor();
        this.codeMirror.replaceRange(code, cursor);
        
        // Focar no editor
        this.codeMirror.focus();
    }
    
    logMessage(message, type = 'info') {
        if (!this.consoleOutput) return;
        
        const timestamp = new Date().toLocaleTimeString();
        
        // Função para criar um elemento de log
        const createLogElement = () => {
            const logLine = document.createElement('div');
            logLine.className = `console-line ${type}`;
            logLine.innerHTML = `
                <span class="timestamp">[${timestamp}]</span>
                <span class="message">${message}</span>
            `;
            return logLine;
        };
        
        // Adicionar ao console principal
        const logLine = createLogElement();
        this.consoleOutput.appendChild(logLine);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
        
        // Limitar número de mensagens no console principal
        const lines = this.consoleOutput.querySelectorAll('.console-line');
        
        // Adicionar ao console do sidebar-right
        const sidebarConsole = document.getElementById('sidebar-console');
        if (sidebarConsole) {
            const sidebarLogLine = createLogElement();
            sidebarConsole.appendChild(sidebarLogLine);
            sidebarConsole.scrollTop = sidebarConsole.scrollHeight;
            
            // Garantir que o painel do console esteja visível
            const panel = document.getElementById('sidebar-console-panel');
            if (panel) {
                const content = panel.querySelector('.panel-content');
                if (content) {
                    content.style.display = 'block';
                }
            }
            
            // Limitar número de mensagens no console do sidebar
            const sidebarLines = sidebarConsole.querySelectorAll('.console-line');
            if (sidebarLines.length > 100) {
                sidebarLines[0].remove();
            }
        }
        if (lines.length > 100) {
            lines[0].remove();
        }
    }
    
    clearConsole() {
        if (!this.consoleOutput) return;
        
        // Remover todas as mensagens do console principal
        this.consoleOutput.innerHTML = '';
        
        // Remover todas as mensagens do console do sidebar-right
        const sidebarConsole = document.getElementById('sidebar-console');
        if (sidebarConsole) {
            sidebarConsole.innerHTML = '';
        }
        
        // Adicionar mensagem informando que o console foi limpo
        this.logMessage('Console limpo', 'info');
    }
    
    initializeCodeMirror() {
        // Verificar se o elemento textarea existe
        if (!this.scriptContent) return;
        
        // Inicializar o CodeMirror
        this.codeMirror = CodeMirror.fromTextArea(this.scriptContent, {
            mode: 'javascript',
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: false,
            gutters: ['CodeMirror-linenumbers'],
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Tab': function(cm) {
                    const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
                    cm.replaceSelection(spaces);
                }
            }
        });
        
        // Ajustar altura do editor
        this.codeMirror.setSize('100%', '100%');
        
        // Adicionar evento de mudança para salvar automaticamente
        this.codeMirror.on('change', () => {
            if (this.currentScript) {
                this.scripts[this.currentScript] = this.codeMirror.getValue();
            }
        });
    }
}

// Inicializar o editor quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.scriptEditor = new ScriptEditor();
    
    // Configurar eventos dos painéis para o console no sidebar-right
    document.querySelectorAll('.panel-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const panel = e.target.closest('.panel');
            const content = panel.querySelector('.panel-content');
            const isCollapsed = content.style.display === 'none';
            
            content.style.display = isCollapsed ? 'block' : 'none';
            e.target.textContent = isCollapsed ? '−' : '+';
        });
    });
    
    // Garantir que o console no sidebar-right esteja visível
    const sidebarConsolePanel = document.getElementById('sidebar-console-panel');
    if (sidebarConsolePanel) {
        const content = sidebarConsolePanel.querySelector('.panel-content');
        if (content) {
            content.style.display = 'block';
        }
    }
    
    // Adicionar mensagem inicial ao console do sidebar-right
    const sidebarConsole = document.getElementById('sidebar-console');
    if (sidebarConsole) {
        // Limpar o console do sidebar-right
        sidebarConsole.innerHTML = '';
        
        // Adicionar mensagem de inicialização
        const timestamp = new Date().toLocaleTimeString();
        const logLine = document.createElement('div');
        logLine.className = 'console-line info';
        logLine.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message">Console inicializado no sidebar-right</span>
        `;
        sidebarConsole.appendChild(logLine);
        
        // Adicionar mensagem de instrução
        const logLine2 = document.createElement('div');
        logLine2.className = 'console-line success';
        logLine2.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message">Execute um script para ver as mensagens aqui</span>
        `;
        sidebarConsole.appendChild(logLine2);
        
        // Garantir que o console seja visível
        sidebarConsole.style.display = 'block';
    }
});