/**
 * Script Editor - Implementação da funcionalidade do editor de scripts
 * para a engine Isoria
 */

class ScriptEditor {
    constructor() {
        // Implementar padrão Singleton para evitar múltiplas instâncias
        if (window.scriptEditorInstance) {
            console.log('Uma instância do ScriptEditor já existe, retornando a instância existente');
            return window.scriptEditorInstance;
        }
        
        this.currentScript = null;
        this.scripts = {
            'scene_script.js': '// Script para configuração da cena\nIsoria.scene.create(\'MainScene\', { backgroundColor: \'#2c3e50\' });\nIsoria.scene.setBackground(\'#2c3e50\');\n\n// Adicionar elementos à cena\nconst tilemap = Isoria.scene.addTilemap(\'main\', 10, 10);',
            'player_script.js': '// Script para configuração do jogador\nconst player = Isoria.player.create(200, 200, {\n    speed: 5,\n    texture: \'player\'\n});\n\n// Configurar controles do jogador\nIsoria.player.setControls({\n    up: \'W\',\n    down: \'S\',\n    left: \'A\',\n    right: \'D\'\n});\n\n// Configurar câmera para seguir o jogador\nIsoria.camera.follow(player);',
            'game_script.js': '// Script principal do jogo\n\n// Criar cena principal\nIsoria.scene.create(\'MainScene\', { backgroundColor: \'#2c3e50\' });\n\n// Adicionar jogador\nconst player = Isoria.player.create(200, 200, {\n    speed: 5,\n    texture: \'player\'\n});\n\n// Adicionar NPCs\nconst npc1 = Isoria.gameObject.create(\'npc\', 300, 150);\nconst npc2 = Isoria.gameObject.create(\'npc\', 150, 300);\n\n// Adicionar colisões\nIsoria.physics.addCollider(player, npc1);\nIsoria.physics.addCollider(player, npc2);\n\n// Adicionar texto de UI\nIsoria.ui.addText(400, 50, \'Isoria Game\', {\n    fontSize: \'24px\',\n    color: \'#ffffff\'\n});'
        };
        
        // Tentar recuperar scripts do localStorage (em caso de queda da página)
        this.recoverScriptsFromLocalStorage();
        
        // Instância do CodeMirror
        this.codeMirror = null;
        
        // Inicializar a interface do editor
        this.initializeInterface();
        
        // Carregar o último script usado ou o primeiro por padrão
        const lastScript = localStorage.getItem('isoria_last_script');
        if (lastScript && this.scripts[lastScript]) {
            this.loadScript(lastScript);
            console.log('Recuperado último script usado: ' + lastScript);
        } else {
            this.loadScript(Object.keys(this.scripts)[0]);
        }
        
        // Armazenar a instância para o padrão Singleton
        window.scriptEditorInstance = this;
        
        // Configurar salvamento automático periódico
        this.setupAutoSave();
    }
    
    // Método para recuperar scripts do localStorage
    recoverScriptsFromLocalStorage() {
        try {
            // Verificar se há scripts salvos no localStorage
            const timestamp = localStorage.getItem('isoria_scripts_timestamp');
            if (!timestamp) return;
            
            console.log('Encontrados scripts salvos no localStorage. Timestamp: ' + new Date(parseInt(timestamp)).toLocaleString());
            
            // Verificar se houve um fechamento não planejado da página
            const unplannedExit = localStorage.getItem('isoria_unplanned_exit') === 'true';
            
            // Recuperar todos os scripts salvos
            const scriptKeys = Object.keys(localStorage).filter(key => key.startsWith('isoria_script_'));
            
            if (scriptKeys.length > 0) {
                scriptKeys.forEach(key => {
                    const scriptName = key.replace('isoria_script_', '');
                    const scriptContent = localStorage.getItem(key);
                    
                    if (scriptContent) {
                        this.scripts[scriptName] = scriptContent;
                        console.log('Recuperado script: ' + scriptName);
                    }
                });
                
                // Mostrar mensagem de recuperação apenas se houve um fechamento não planejado
                if (unplannedExit) {
                    alert('Scripts recuperados do armazenamento local após fechamento não planejado da página.');
                    // Limpar o flag de fechamento não planejado
                    localStorage.removeItem('isoria_unplanned_exit');
                }
            }
        } catch (e) {
            console.error('Erro ao recuperar scripts do localStorage:', e);
        }
    }
    
    // Configurar salvamento automático periódico
    setupAutoSave() {
        // Salvar a cada 30 segundos
        setInterval(() => {
            if (this.currentScript && this.codeMirror) {
                const content = this.codeMirror.getValue();
                
                // Salvar no localStorage
                try {
                    localStorage.setItem('isoria_script_' + this.currentScript, content);
                    localStorage.setItem('isoria_last_script', this.currentScript);
                    localStorage.setItem('isoria_scripts_timestamp', Date.now().toString());
                    console.log('Auto-save: Script salvo no localStorage: ' + this.currentScript);
                } catch (e) {
                    console.error('Erro no auto-save:', e);
                }
            }
        }, 30000); // 30 segundos
    }
    
    initializeInterface() {
        // Verificar se a interface já foi inicializada
        if (this._interfaceInitialized) {
            console.log('Interface já inicializada, ignorando chamada duplicada');
            return;
        }
        
        // Elementos do DOM
        this.scriptContent = document.getElementById('script-content');
        this.scriptSelector = document.getElementById('script-selector');
        this.runScriptBtn = document.getElementById('run-script-btn');
        this.saveScriptBtn = document.getElementById('save-script-btn');
        this.formatScriptBtn = document.getElementById('format-script-btn');
        this.newScriptBtn = document.getElementById('new-script-btn');
        this.consoleOutput = document.getElementById('console-output');
        
        // Verificar se os elementos necessários existem
        if (!this.scriptContent || !this.scriptSelector) {
            console.error('Elementos necessários não encontrados no DOM');
            return;
        }
        
        // Remover qualquer instância anterior do CodeMirror no container
        const editorContainer = this.scriptContent.parentNode;
        if (editorContainer) {
            const existingCodeMirrors = editorContainer.querySelectorAll('.CodeMirror');
            existingCodeMirrors.forEach(cm => cm.remove());
        }
        
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
        
        // Botões de controle do jogo
        const playBtn = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');
        const stopBtn = document.getElementById('btn-stop');
        const testRecoveryBtn = document.getElementById('btn-test-recovery');
        
        if (playBtn) playBtn.addEventListener('click', () => this.runCurrentScript());
        if (stopBtn) stopBtn.addEventListener('click', () => {
            if (window.IsoriaEngineInstance) {
                window.IsoriaEngineInstance.reset();
                this.logMessage('Engine parada', 'info');
            }
        });
        if (testRecoveryBtn) testRecoveryBtn.addEventListener('click', () => this.simulateUnplannedExit());
        
        // Adicionar botões de backup e restauração
        this.setupBackupButtons();
        
        // Marcar a interface como inicializada
        this._interfaceInitialized = true;
    }
    
    // Método para adicionar botões de backup e exportação
    setupBackupButtons() {
        // Procurar container para os botões de backup
        let buttonContainer = document.querySelector('.editor-buttons') || document.querySelector('.button-container');
        
        // Se o container não existir, criar um novo
        if (!buttonContainer) {
            console.log('Container de botões não encontrado, criando um novo...');
            
            // Procurar a barra de ferramentas do editor
            const editorToolbar = document.querySelector('.editor-toolbar');
            
            if (editorToolbar) {
                // Criar o container de botões
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'editor-buttons';
                editorToolbar.appendChild(buttonContainer);
                console.log('Container de botões criado com sucesso');
            } else {
                console.error('Barra de ferramentas do editor não encontrada');
                return;
            }
        }
        
        // Botão de exportar scripts
        const exportButton = document.createElement('button');
        exportButton.id = 'export-scripts-button';
        exportButton.className = 'editor-button';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Exportar';
        exportButton.title = 'Exportar todos os scripts como arquivo JSON';
        exportButton.addEventListener('click', () => this.exportScripts());
        buttonContainer.appendChild(exportButton);
        
        // Botão de importar scripts
        const importButton = document.createElement('button');
        importButton.id = 'import-scripts-button';
        importButton.className = 'editor-button';
        importButton.innerHTML = '<i class="fas fa-upload"></i> Importar';
        importButton.title = 'Importar scripts de um arquivo JSON';
        importButton.addEventListener('click', () => this.importScripts());
        buttonContainer.appendChild(importButton);
        
        // Botão para limpar o localStorage
        const clearStorageButton = document.createElement('button');
        clearStorageButton.id = 'clear-storage-button';
        clearStorageButton.className = 'editor-button';
        clearStorageButton.innerHTML = '<i class="fas fa-trash"></i> Limpar Cache';
        clearStorageButton.title = 'Limpar scripts salvos no armazenamento local';
        clearStorageButton.addEventListener('click', () => this.clearLocalStorage());
        buttonContainer.appendChild(clearStorageButton);
    }
    
    // Exportar todos os scripts como arquivo JSON
    exportScripts() {
        try {
            // Coletar todos os scripts
            const scriptsData = {
                timestamp: Date.now(),
                scripts: this.scripts,
                currentScript: this.currentScript
            };
            
            // Converter para JSON
            const jsonData = JSON.stringify(scriptsData, null, 2);
            
            // Criar blob e link para download
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `isoria_scripts_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            this.logMessage('Scripts exportados com sucesso!', 'success');
        } catch (e) {
            console.error('Erro ao exportar scripts:', e);
            this.logMessage('Erro ao exportar scripts: ' + e.message, 'error');
        }
    }
    
    // Importar scripts de um arquivo JSON
    importScripts() {
        try {
            // Criar input de arquivo oculto
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) {
                    document.body.removeChild(fileInput);
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (!data.scripts) {
                            throw new Error('Formato de arquivo inválido');
                        }
                        
                        // Confirmar importação
                        const scriptCount = Object.keys(data.scripts).length;
                        const confirmImport = confirm(`Importar ${scriptCount} scripts? Isso substituirá scripts existentes com o mesmo nome.`);
                        
                        if (confirmImport) {
                            // Importar scripts
                            this.scripts = { ...this.scripts, ...data.scripts };
                            
                            // Salvar no localStorage
                            Object.entries(data.scripts).forEach(([name, content]) => {
                                localStorage.setItem('isoria_script_' + name, content);
                            });
                            
                            localStorage.setItem('isoria_scripts_timestamp', Date.now().toString());
                            
                            // Atualizar seletor
                            this.updateScriptSelector();
                            
                            // Carregar script atual
                            if (data.currentScript && this.scripts[data.currentScript]) {
                                this.loadScript(data.currentScript);
                            }
                            
                            this.logMessage(`${scriptCount} scripts importados com sucesso!`, 'success');
                        }
                    } catch (err) {
                        console.error('Erro ao processar arquivo:', err);
                        this.logMessage('Erro ao importar scripts: ' + err.message, 'error');
                    }
                    
                    document.body.removeChild(fileInput);
                };
                
                reader.readAsText(file);
            });
            
            fileInput.click();
        } catch (e) {
            console.error('Erro ao importar scripts:', e);
            this.logMessage('Erro ao importar scripts: ' + e.message, 'error');
        }
    }
    
    // Limpar o localStorage
    clearLocalStorage() {
        try {
            const confirmClear = confirm('Tem certeza que deseja limpar todos os scripts salvos no armazenamento local? Esta ação não pode ser desfeita.');
            
            if (confirmClear) {
                // Encontrar todas as chaves relacionadas aos scripts
                const scriptKeys = Object.keys(localStorage).filter(key => 
                    key.startsWith('isoria_script_') || 
                    key === 'isoria_last_script' || 
                    key === 'isoria_scripts_timestamp'
                );
                
                // Remover cada chave
                scriptKeys.forEach(key => localStorage.removeItem(key));
                
                this.logMessage('Armazenamento local limpo com sucesso!', 'success');
            }
        } catch (e) {
            console.error('Erro ao limpar localStorage:', e);
            this.logMessage('Erro ao limpar armazenamento local: ' + e.message, 'error');
        }
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
        if (!this.scripts[scriptName]) {
            console.error(`Script ${scriptName} não encontrado.`);
            return;
        }
        
        this.currentScript = scriptName;
        
        // Verificar se existe uma versão mais recente no localStorage
        let scriptContent = this.scripts[scriptName];
        const localStorageVersion = localStorage.getItem('isoria_script_' + scriptName);
        
        if (localStorageVersion) {
            // Usar a versão do localStorage se existir
            scriptContent = localStorageVersion;
            console.log(`Carregada versão do localStorage para ${scriptName}`);
            
            // Atualizar a versão em memória
            this.scripts[scriptName] = scriptContent;
        }
        
        // Atualizar o seletor de scripts
        const scriptSelector = document.getElementById('script-selector');
        if (scriptSelector) {
            scriptSelector.value = scriptName;
        }
        
        // Atualizar o conteúdo do editor
        if (this.codeMirror) {
            this.codeMirror.setValue(scriptContent);
            this.codeMirror.clearHistory(); // Limpar histórico de undo/redo
        }
        
        // Atualizar o último script usado no localStorage
        localStorage.setItem('isoria_last_script', scriptName);
        
        console.log(`Script ${scriptName} carregado com sucesso.`);
    }
    
    runCurrentScript() {
        if (!this.currentScript) return;
        
        // Salvar o script atual antes de executar
        this.saveCurrentScript();
        
        // Limpar o console
        this.clearConsole();
        

        
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
        
        // Salvar no localStorage para persistência em caso de queda da página
        try {
            localStorage.setItem('isoria_script_' + this.currentScript, content);
            localStorage.setItem('isoria_last_script', this.currentScript);
            localStorage.setItem('isoria_scripts_timestamp', Date.now().toString());
            console.log(`Script ${this.currentScript} salvo no localStorage.`);
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
        
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
        const defaultContent = `// ${scriptName} - Criado em ${new Date().toLocaleString()}\n\n// Seu código aqui\n`;
        this.scripts[scriptName] = defaultContent;
        
        // Salvar no localStorage
        try {
            localStorage.setItem('isoria_script_' + scriptName, defaultContent);
            localStorage.setItem('isoria_last_script', scriptName);
            localStorage.setItem('isoria_scripts_timestamp', Date.now().toString());
            console.log(`Novo script ${scriptName} salvo no localStorage.`);
        } catch (e) {
            console.error('Erro ao salvar novo script no localStorage:', e);
        }
        
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
        if (lines.length > 100) {
            lines[0].remove();
        }
    }
    
    clearConsole() {
        if (!this.consoleOutput) return;
        
        // Remover todas as mensagens do console principal
        this.consoleOutput.innerHTML = '';
        
        // Adicionar mensagem informando que o console foi limpo
        this.logMessage('Console limpo', 'info');
    }
    
    // Método para simular um fechamento não planejado (para testes)
    simulateUnplannedExit() {
        if (confirm('Isso irá simular um fechamento não planejado da página para testar o sistema de recuperação. A página será recarregada. Continuar?')) {
            // Salvar o estado atual
            const currentScript = this.currentScript;
            const content = this.codeMirror.getValue();
            
            if (currentScript && content) {
                localStorage.setItem('isoria_script_' + currentScript, content);
                localStorage.setItem('isoria_last_script', currentScript);
                localStorage.setItem('isoria_scripts_timestamp', Date.now().toString());
                localStorage.setItem('isoria_unplanned_exit', 'true');
                console.log('Estado salvo para simulação de fechamento não planejado');
                
                // Recarregar a página para simular o fechamento
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                alert('Não foi possível simular o fechamento não planejado. Verifique se há um script aberto e com conteúdo.');
            }
        }
    }
    
    // Método para limpar instâncias do CodeMirror
    cleanupCodeMirrorInstances() {
        // Remover todas as instâncias do CodeMirror na página
        document.querySelectorAll('.CodeMirror').forEach(cm => {
            console.log('Removendo instância do CodeMirror durante limpeza');
            cm.remove();
        });
        
        // Restaurar todos os textareas que podem ter sido escondidos pelo CodeMirror
        document.querySelectorAll('.script-textarea').forEach(textarea => {
            textarea.style.display = '';
        });
    }
    
    initializeCodeMirror() {
        console.log('Inicializando CodeMirror...');
        
        // Verificar se o textarea existe
        const textarea = document.getElementById('script-content');
        if (!textarea) {
            console.error('Textarea não encontrado! ID: script-content');
            return false;
        }
        
        // Garantir que o textarea ocupe todo o espaço disponível
        textarea.style.height = 'calc(100% - 40px)';
        textarea.style.minHeight = 'calc(100vh - 250px)';
        textarea.style.display = 'block';
        textarea.style.width = '100%';
        textarea.style.flex = '1';
        
        // Verificar se o CodeMirror está disponível globalmente
        if (typeof CodeMirror === 'undefined') {
            console.error('CodeMirror não está disponível! Tentando carregar via CDN...');
            
            // Tentar carregar o CodeMirror via CDN
            this.loadCodeMirrorFromCDN();
            return false;
        }
        
        
        
        // Limpar instâncias anteriores
        this.cleanupCodeMirrorInstances();
        
        // Configurar o textarea com o conteúdo do script atual
        textarea.value = this.currentScript ? this.scripts[this.currentScript] : '';
        
        try {
            // Inicializar o CodeMirror com configuração simplificada
            console.log('Criando instância do CodeMirror...');
            // Remover qualquer instância anterior do CodeMirror
            if (this.codeMirror) {
                this.codeMirror.toTextArea();
                this.codeMirror = null;
            }
            
            // Garantir que o textarea esteja visível e editável
            textarea.style.display = 'block';
            textarea.readOnly = false;
            // Removido contenteditable para evitar conflitos com inputStyle
            
            // Remover qualquer instância anterior do CodeMirror no DOM
            document.querySelectorAll('.CodeMirror').forEach(cm => cm.remove());
            
            // Criar nova instância do CodeMirror com configuração explícita para edição
            this.codeMirror = CodeMirror.fromTextArea(textarea, {
                mode: 'javascript',
                theme: 'dracula',
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                indentWithTabs: false,
                autoCloseBrackets: true,
                matchBrackets: true,
                styleActiveLine: true,
                readOnly: false, // Garantir que o editor não esteja em modo somente leitura
                inputStyle: 'textarea', // Usar textarea para evitar problemas de cursorcompatibilidade
                dragDrop: true, // Permitir arrastar e soltar
                selectionPointer: true, // Mostrar ponteiro de seleção
                spellcheck: false, // Desativar verificação ortográfica que pode interferir
                configureMouse: function() { return { addNew: false }; }, // Configuração do mouse para melhor interação
                cursorBlinkRate: 530, // Taxa de piscagem do cursor
                cursorScrollMargin: 5, // Margem de rolagem do cursor
                viewportMargin: Infinity, // Renderizar todo o conteúdo, não apenas o visível
                lineWrapping: true, // Quebrar linhas longas
                direction: 'ltr', // Forçar direção da esquerda para direita
                extraKeys: {
                    "Ctrl-Space": "autocomplete",
                    "Tab": function(cm) {
                        if (cm.somethingSelected()) {
                            cm.indentSelection("add");
                        } else {
                            cm.replaceSelection("    ", "end");
                        }
                    }
                }
            });
            
            // Garantir que o wrapper do CodeMirror tenha a classe cm-s-dracula
            const wrapper = this.codeMirror.getWrapperElement();
            if (wrapper && !wrapper.classList.contains('cm-s-dracula')) {
                wrapper.classList.add('cm-s-dracula');
            }
            
            // Forçar direção LTR no CodeMirror - Configuração robusta
            if (wrapper) {
                wrapper.style.direction = 'ltr';
                wrapper.style.textAlign = 'left';
                wrapper.style.unicodeBidi = 'normal';
                wrapper.style.writingMode = 'horizontal-tb';
                wrapper.setAttribute('dir', 'ltr');
                
                // Remover qualquer classe RTL
                wrapper.classList.remove('CodeMirror-rtl');
                
                // Aplicar direção LTR a TODOS os elementos internos
                const allElements = wrapper.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.direction = 'ltr';
                    element.style.textAlign = 'left';
                    element.style.unicodeBidi = 'normal';
                    element.style.writingMode = 'horizontal-tb';
                    element.setAttribute('dir', 'ltr');
                    element.classList.remove('CodeMirror-rtl');
                });
                
                // Configurar o documento do CodeMirror
                if (this.codeMirror.getDoc && this.codeMirror.getDoc()) {
                    const doc = this.codeMirror.getDoc();
                    if (doc.cm) {
                        doc.cm.setOption('direction', 'ltr');
                    }
                }
            }
            
            // Posicionar o CodeMirror corretamente sobre o textarea
            if (wrapper) {
                wrapper.style.position = 'absolute';
                wrapper.style.top = '0';
                wrapper.style.left = '0';
                wrapper.style.right = '0';
                wrapper.style.bottom = '0';
                wrapper.style.zIndex = '10';
                wrapper.style.backgroundColor = '#282a36';
            }
            
            // Garantir que o textarea esteja posicionado corretamente
            textarea.style.position = 'relative';
            textarea.style.zIndex = '5';
            
            // Verificar explicitamente se o editor está em modo somente leitura
            if (this.codeMirror.getOption('readOnly')) {
                console.log('Editor está em modo somente leitura, corrigindo...');
                this.codeMirror.setOption('readOnly', false);
            }
            
            // Forçar aplicação do tema
            this.codeMirror.setOption("theme", "dracula");
            
            // Ajustar o tamanho do editor
            this.codeMirror.setSize('100%', '100%');
            
            // Adicionar evento de mudança para salvamento automático
            this.codeMirror.on('change', () => {
                if (this.currentScript) {
                    // Salvar o conteúdo atual no objeto scripts
                    this.scripts[this.currentScript] = this.codeMirror.getValue();
                    
                    // Salvar no localStorage para recuperação em caso de queda da página
                    try {
                        localStorage.setItem('isoria_script_' + this.currentScript, this.codeMirror.getValue());
                        localStorage.setItem('isoria_last_script', this.currentScript);
                        localStorage.setItem('isoria_scripts_timestamp', Date.now().toString());
                        console.log('Script salvo no localStorage: ' + this.currentScript);
                    } catch (e) {
                        console.error('Erro ao salvar no localStorage:', e);
                    }
                }
                
                // Verificar novamente se o editor está em modo somente leitura após cada alteração
                if (this.codeMirror.getOption('readOnly')) {
                    console.log('Editor voltou ao modo somente leitura, corrigindo...');
                    this.codeMirror.setOption('readOnly', false);
                }
            });
            
            // Adicionar evento para garantir que o editor seja editável ao clicar nele
            this.codeMirror.getWrapperElement().addEventListener('click', () => {
                if (this.codeMirror.getOption('readOnly')) {
                    this.codeMirror.setOption('readOnly', false);
                }
                this.codeMirror.focus();
            }, true);
            
            // Função para verificar se o CodeMirror está visível e, se não estiver, recriar
            const checkVisibility = () => {
                console.log('Verificando visibilidade do CodeMirror...');
                
                if (this.codeMirror) {
                    const wrapper = this.codeMirror.getWrapperElement();
                    
                    // Verificar se o wrapper está visível
                    if (wrapper) {
                        const style = window.getComputedStyle(wrapper);
                        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                        
                        if (!isVisible) {
                            console.log('CodeMirror não está visível, recriando...');
                            
                            // Salvar o conteúdo atual
                            const content = this.codeMirror.getValue();
                            
                            // Destruir a instância atual
                            this.codeMirror.toTextArea();
                            
                            // Limpar todas as instâncias do CodeMirror
                            document.querySelectorAll('.CodeMirror').forEach(cm => cm.remove());
                            
                            // Obter o textarea
                            const textarea = document.getElementById('script-content');
                            if (textarea) {
                                // Restaurar o conteúdo
                                textarea.value = content;
                                
                                // Garantir que o textarea esteja visível
                                textarea.style.display = 'block';
                                textarea.style.visibility = 'visible';
                                textarea.style.opacity = '1';
                                textarea.style.position = 'relative';
                                textarea.style.zIndex = '5';
                                
                                // Recriar o CodeMirror
                                this.codeMirror = CodeMirror.fromTextArea(textarea, {
                                    mode: 'javascript',
                                    theme: 'dracula',
                                    lineNumbers: true,
                                    indentUnit: 4,
                                    tabSize: 4,
                                    indentWithTabs: false,
                                    autoCloseBrackets: true,
                                    matchBrackets: true,
                                    styleActiveLine: true,
                                    readOnly: false,
                                    inputStyle: 'textarea',
                                    dragDrop: true,
                                    selectionPointer: true,
                                    spellcheck: false,
                                    viewportMargin: Infinity,
                                    lineWrapping: true,
                                    direction: 'ltr' // Forçar direção da esquerda para direita
                                });
                                
                                // Definir o conteúdo
                                this.codeMirror.setValue(content);
                                
                                // Adicionar classe para garantir que o tema seja aplicado
                                const cmElement = this.codeMirror.getWrapperElement();
                                if (cmElement && !cmElement.classList.contains('cm-s-dracula')) {
                                    cmElement.classList.add('cm-s-dracula');
                                }
                                
                                // Forçar direção LTR no CodeMirror recriado - Configuração robusta
                                if (cmElement) {
                                    cmElement.style.direction = 'ltr';
                                    cmElement.style.textAlign = 'left';
                                    cmElement.style.unicodeBidi = 'normal';
                                    cmElement.style.writingMode = 'horizontal-tb';
                                    cmElement.setAttribute('dir', 'ltr');
                                    
                                    // Remover qualquer classe RTL
                                    cmElement.classList.remove('CodeMirror-rtl');
                                    
                                    // Aplicar direção LTR a TODOS os elementos internos
                                    const allElements = cmElement.querySelectorAll('*');
                                    allElements.forEach(element => {
                                        element.style.direction = 'ltr';
                                        element.style.textAlign = 'left';
                                        element.style.unicodeBidi = 'normal';
                                        element.style.writingMode = 'horizontal-tb';
                                        element.setAttribute('dir', 'ltr');
                                        element.classList.remove('CodeMirror-rtl');
                                    });
                                    
                                    // Configurar o documento do CodeMirror recriado
                                    if (this.codeMirror.getDoc && this.codeMirror.getDoc()) {
                                        const doc = this.codeMirror.getDoc();
                                        if (doc.cm) {
                                            doc.cm.setOption('direction', 'ltr');
                                        }
                                    }
                                }
                                
                                // Forçar a renderização
                                setTimeout(forceRender, 100);
                            }
                        }
                    }
                }
            };
            
            // Forçar a renderização do CodeMirror com múltiplas tentativas
            const forceRender = () => {
                console.log('Forçando renderização do CodeMirror...');
                
                // Forçar refresh do CodeMirror
                this.codeMirror.refresh();
                
                // Garantir que o wrapper do CodeMirror esteja visível
                const wrapper = this.codeMirror.getWrapperElement();
                if (wrapper) {
                    // Adicionar classe para garantir que o tema seja aplicado
                    if (!wrapper.classList.contains('cm-s-dracula')) {
                        wrapper.classList.add('cm-s-dracula');
                    }
                    
                    wrapper.style.display = 'block';
                    wrapper.style.visibility = 'visible';
                    wrapper.style.opacity = '1';
                    wrapper.style.position = 'absolute';
                    wrapper.style.top = '0';
                    wrapper.style.left = '0';
                    wrapper.style.right = '0';
                    wrapper.style.bottom = '0';
                    wrapper.style.zIndex = '999';
                    wrapper.style.height = 'calc(100% - 40px)';
                    wrapper.style.width = '100%';
                    wrapper.style.flex = '1';
                    wrapper.style.overflow = 'visible';
                    wrapper.style.transform = 'translateZ(0)';
                    wrapper.style.pointerEvents = 'auto';
                    wrapper.style.minHeight = '400px';
                    wrapper.style.margin = '0';
                    wrapper.style.padding = '0';
                    wrapper.style.backgroundColor = '#282a36';
                    
                    // Forçar o CodeMirror a recalcular seu layout
                    this.codeMirror.refresh();
                    
                    // Simular uma interação para garantir que o CodeMirror seja renderizado
                    this.codeMirror.focus();
                    this.codeMirror.setCursor(0, 0);
                }
                

                
                // Garantir que o textarea original esteja visível e posicionado corretamente
                const textarea = document.getElementById('script-content');
                if (textarea) {
                    textarea.style.display = 'block';
                    textarea.style.visibility = 'visible';
                    textarea.style.opacity = '1';
                    textarea.style.position = 'relative';
                    textarea.style.zIndex = '5';
                    textarea.style.height = 'calc(100% - 40px)';
                    textarea.style.width = '100%';
                    textarea.style.minHeight = '400px';
                }
            };
            
            // Tentar várias vezes com intervalos diferentes
            setTimeout(forceRender, 100);
            setTimeout(forceRender, 500);
            setTimeout(forceRender, 1000);
            setTimeout(forceRender, 2000);
            
            // Verificar a visibilidade do CodeMirror e recriar se necessário
            setTimeout(checkVisibility, 1500);
            setTimeout(checkVisibility, 3000);
            
            // Adicionar evento de clique para garantir que o editor receba o foco
            this.codeMirror.on('mousedown', () => {
                // Forçar o foco no editor
                setTimeout(() => {
                    this.codeMirror.focus();
                    console.log('Foco aplicado ao editor');
                    forceRender();
                }, 100);
            });
            
            // Adicionar evento de clique no documento para garantir que o CodeMirror seja editável
            document.addEventListener('click', () => {
                if (this.codeMirror) {
                    this.codeMirror.focus();
                    forceRender();
                    checkVisibility();
                }
            });
            
            // Adicionar evento de tecla para garantir que o CodeMirror seja editável
            document.addEventListener('keydown', () => {
                if (this.codeMirror) {
                    this.codeMirror.focus();
                    forceRender();
                    checkVisibility();
                }
            });
            
            // Forçar o foco no editor após a inicialização
            setTimeout(() => {
                this.codeMirror.focus();
                console.log('Foco inicial aplicado ao editor');
                
                // Forçar uma interação inicial para garantir que o editor seja editável
                this.codeMirror.setValue(this.codeMirror.getValue() + ' ');
                this.codeMirror.setValue(this.codeMirror.getValue().trim());
                
                // Forçar uma atualização do editor
                this.codeMirror.refresh();
            }, 500);
            
            // Adicionar um segundo timeout para garantir que o editor esteja realmente visível e editável
            setTimeout(() => {
                // Forçar uma atualização do editor novamente
                this.codeMirror.refresh();
                this.codeMirror.focus();
                
                // Verificar se o wrapper do CodeMirror está visível
                const wrapper = this.codeMirror.getWrapperElement();
                if (wrapper) {
                    wrapper.style.display = 'block';
                    wrapper.style.visibility = 'visible';
                    wrapper.style.opacity = '1';
                    wrapper.style.zIndex = '10';
                }
                
                console.log('Segunda verificação de visibilidade do editor concluída');
            }, 1000);
            
            // Verificar se o CodeMirror foi criado corretamente
            const cmElements = document.querySelectorAll('.CodeMirror');
            console.log(`Elementos CodeMirror encontrados: ${cmElements.length}`);
            
            if (cmElements.length > 0) {
                // Aplicar estilos básicos ao CodeMirror sem usar !important que pode causar problemas
            cmElements.forEach(el => {
                // Usar uma abordagem mais simples para os estilos
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.height = 'calc(100% - 40px)';
                el.style.minHeight = 'calc(100vh - 250px)';
                el.style.width = '100%';
                el.style.flex = '1';
                el.style.position = 'relative';
                el.style.zIndex = '10';
            });
                
                // Esconder o textarea original para evitar duplicação
                if (textarea) {
                    textarea.style.display = 'none';
                }
                
                // Garantir que o container do editor ocupe todo o espaço disponível
                const editorContainer = document.querySelector('.script-editor-container');
                if (editorContainer) {
                    editorContainer.style.display = 'flex';
                    editorContainer.style.flexDirection = 'column';
                    editorContainer.style.height = '100%';
                    editorContainer.style.flex = '1';
                }
                

                
                console.log('CodeMirror inicializado com sucesso!');
                return true;
            } else {
                console.error('Elementos CodeMirror não encontrados após inicialização!');
                return false;
            }
        } catch (error) {
            console.error('Erro ao inicializar o CodeMirror:', error);
            return false;
        }
    }
    
    // Adicionar método para carregar o CodeMirror via CDN
    loadCodeMirrorFromCDN() {
        console.log('Carregando CodeMirror via CDN...');
        
        // Carregar CSS
        const cssLinks = [
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css'
        ];
        
        cssLinks.forEach(link => {
            if (!document.querySelector(`link[href="${link}"]`)) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = link;
                document.head.appendChild(cssLink);
            }
        });
        
        // Carregar JavaScript
        const jsLinks = [
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/closebrackets.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/matchbrackets.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/selection/active-line.min.js'
        ];
        
        // Verificar quais scripts já estão carregados
        const loadedScripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
        const scriptsToLoad = jsLinks.filter(link => !loadedScripts.some(loaded => loaded.includes(link)));
        
        if (scriptsToLoad.length === 0) {
            // Todos os scripts já estão carregados, tentar inicializar imediatamente
            console.log('Todos os scripts do CodeMirror já estão carregados');
            setTimeout(() => this.initializeCodeMirror(), 100);
            return;
        }
        
        let loadedCount = 0;
        scriptsToLoad.forEach(link => {
            const script = document.createElement('script');
            script.src = link;
            script.onload = () => {
                loadedCount++;
                console.log(`Script carregado: ${link}`);
                if (loadedCount === scriptsToLoad.length) {
                    // Todos os scripts foram carregados, tentar inicializar novamente
                    console.log('Todos os scripts do CodeMirror foram carregados');
                    setTimeout(() => this.initializeCodeMirror(), 500);
                }
            };
            script.onerror = (error) => {
                console.error(`Erro ao carregar script: ${link}`, error);
                // Tentar carregar novamente em caso de erro
                setTimeout(() => {
                    console.log(`Tentando carregar novamente: ${link}`);
                    const retryScript = document.createElement('script');
                    retryScript.src = link;
                    retryScript.onload = () => {
                        loadedCount++;
                        console.log(`Script carregado na segunda tentativa: ${link}`);
                        if (loadedCount === scriptsToLoad.length) {
                            console.log('Todos os scripts do CodeMirror foram carregados');
                            setTimeout(() => this.initializeCodeMirror(), 500);
                        }
                    };
                    document.head.appendChild(retryScript);
                }, 1000);
            };
            document.head.appendChild(script);
        });
    }
}

// Função auxiliar para limpar instâncias do CodeMirror globalmente
// (Mantida para compatibilidade com código existente)

// Inicializar o editor quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando ScriptEditor...');
    
    // Verificar se o CodeMirror está disponível globalmente
    if (typeof CodeMirror === 'undefined') {
        console.error('CodeMirror não está definido. Verificando se os scripts estão sendo carregados...');
        
        // Verificar quais scripts do CodeMirror já estão carregados
        const loadedScripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
        console.log('Scripts carregados:', loadedScripts);
        
        // Tentar carregar o CodeMirror novamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js';
        script.onload = function() {
            console.log('CodeMirror carregado com sucesso!');
            
            // Carregar os addons necessários
            const addons = [
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/closebrackets.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/matchbrackets.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/selection/active-line.min.js'
            ];
            
            let loadedCount = 0;
            addons.forEach(addon => {
                if (!loadedScripts.some(loaded => loaded.includes(addon))) {
                    const addonScript = document.createElement('script');
                    addonScript.src = addon;
                    addonScript.onload = function() {
                        loadedCount++;
                        console.log(`Addon carregado: ${addon}`);
                        if (loadedCount === addons.length) {
                            initializeScriptEditor();
                        }
                    };
                    document.head.appendChild(addonScript);
                } else {
                    loadedCount++;
                    if (loadedCount === addons.length) {
                        initializeScriptEditor();
                    }
                }
            });
        };
        script.onerror = function() {
            console.error('Falha ao carregar o CodeMirror!');
        };
        document.head.appendChild(script);
    } else {
        console.log('CodeMirror já está disponível');
        initializeScriptEditor();
    }
    
    // Função para inicializar o ScriptEditor
    function initializeScriptEditor() {
        console.log('Inicializando ScriptEditor após carregamento dos scripts...');
        
        // Definir função global temporária para compatibilidade
        window.cleanupCodeMirrorInstances = function() {
            // Remover todas as instâncias do CodeMirror na página
            document.querySelectorAll('.CodeMirror').forEach(cm => {
                console.log('Removendo instância do CodeMirror durante limpeza inicial');
                cm.remove();
            });
            
            // Restaurar todos os textareas que podem ter sido escondidos pelo CodeMirror
            document.querySelectorAll('.script-textarea').forEach(textarea => {
                textarea.style.display = 'block';
                textarea.style.visibility = 'visible';
            });
        };
        
        // Limpar qualquer instância do CodeMirror que possa existir
        window.cleanupCodeMirrorInstances();
        
        // Garantir que o textarea esteja visível antes da inicialização
        const textarea = document.getElementById('script-content');
        if (textarea) {
            textarea.style.display = 'block';
            textarea.style.visibility = 'visible';
            textarea.style.height = 'calc(100% - 40px)';
            textarea.style.minHeight = 'calc(100vh - 250px)';
            textarea.style.width = '100%';
            textarea.style.flex = '1';
        }
        

        
        // Verificar se já existe uma instância do ScriptEditor
        if (!window.scriptEditorInstance) {
            console.log('Criando nova instância do ScriptEditor');
            window.scriptEditor = new ScriptEditor();
        } else {
            console.log('Usando instância existente do ScriptEditor');
            window.scriptEditor = window.scriptEditorInstance;
        }
        
        // Verificar se o CodeMirror foi inicializado corretamente
        setTimeout(() => {
            const cmElements = document.querySelectorAll('.CodeMirror');
            if (cmElements.length === 0) {
                console.log('CodeMirror não foi inicializado corretamente, tentando novamente...');
                if (window.scriptEditor) {
                    window.scriptEditor.initializeCodeMirror();
                }
            } else {
                console.log('CodeMirror inicializado com sucesso!');
                // Forçar visibilidade do CodeMirror
                cmElements.forEach(el => {
                    el.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; height: calc(100% - 40px) !important; min-height: calc(100vh - 250px) !important; width: 100% !important; flex: 1 !important; position: relative !important; z-index: 10 !important;');
                });
            }
        }, 500);
    }
    

});