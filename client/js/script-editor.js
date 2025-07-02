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
        this.scripts = {};
        // Tentar recuperar scripts do localStorage (em caso de queda da página)
        this.recoverScriptsFromLocalStorage();
        // Instância do CodeMirror
        this.codeMirror = null;
        // Inicializar a interface do editor
        this.initializeInterface();
        // Não carregar nenhum script automaticamente
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
        
        // Configurar o textarea para iniciar vazio
        textarea.value = '';
        this.currentScript = null;
        this.scripts = {};
        // Tentar recuperar scripts do localStorage (em caso de queda da página)
        this.recoverScriptsFromLocalStorage();
        // Instância do CodeMirror
        this.codeMirror = null;
        // Inicializar a interface do editor
        this.initializeInterface();
        // Não carregar nenhum script automaticamente
        // Armazenar a instância para o padrão Singleton
        window.scriptEditorInstance = this;
        // Configurar salvamento automático periódico
        this.setupAutoSave();
        
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