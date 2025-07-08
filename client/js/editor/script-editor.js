/**
 * Script Editor - Versão redesenhada
 * Editor de código moderno e limpo para a engine Isoria
 */

// Import CodeMirror
const CodeMirror = window.CodeMirror

class ScriptEditor {
  constructor() {
    // Implementar padrão Singleton
    if (window.scriptEditorInstance) {
      console.log("Uma instância do ScriptEditor já existe, retornando a instância existente")
      return window.scriptEditorInstance
    }

    this.currentScript = null
    this.scripts = {
      "scene_script.js":
        "// Script para configuração da cena\nIsoria.scene.create('MainScene', { backgroundColor: '#2c3e50' });\nIsoria.scene.setBackground('#2c3e50');\n\n// Adicionar elementos à cena\nconst tilemap = Isoria.scene.addTilemap('main', 10, 10);",
      "player_script.js":
        "// Script para configuração do jogador\nconst player = Isoria.player.create(200, 200, {\n    speed: 5,\n    texture: 'player'\n});\n\n// Configurar controles do jogador\nIsoria.player.setControls({\n    up: 'W',\n    down: 'S',\n    left: 'A',\n    right: 'D'\n});\n\n// Configurar câmera para seguir o jogador\nIsoria.camera.follow(player);",
      "game_script.js":
        "// Script principal do jogo\n\n// Criar cena principal\nIsoria.scene.create('MainScene', { backgroundColor: '#2c3e50' });\n\n// Adicionar jogador\nconst player = Isoria.player.create(200, 200, {\n    speed: 5,\n    texture: 'player'\n});\n\n// Adicionar NPCs\nconst npc1 = Isoria.gameObject.create('npc', 300, 150);\nconst npc2 = Isoria.gameObject.create('npc', 150, 300);\n\n// Adicionar colisões\nIsoria.physics.addCollider(player, npc1);\nIsoria.physics.addCollider(player, npc2);\n\n// Adicionar texto de UI\nIsoria.ui.addText(400, 50, 'Isoria Game', {\n    fontSize: '24px',\n    color: '#ffffff'\n});",
    }

    this.codeMirror = null
    this.messageCount = 0

    // Recuperar scripts do localStorage
    this.recoverScriptsFromLocalStorage()

    // Inicializar interface
    this.initializeInterface()

    // Carregar último script ou primeiro por padrão
    const lastScript = localStorage.getItem("isoria_last_script")
    if (lastScript && this.scripts[lastScript]) {
      this.loadScript(lastScript)
    } else {
      this.loadScript(Object.keys(this.scripts)[0])
    }

    // Armazenar instância
    window.scriptEditorInstance = this

    // Configurar salvamento automático
    this.setupAutoSave()
  }

  recoverScriptsFromLocalStorage() {
    try {
      const timestamp = localStorage.getItem("isoria_scripts_timestamp")
      if (!timestamp) return

      console.log(
        "Encontrados scripts salvos no localStorage. Timestamp: " +
          new Date(Number.parseInt(timestamp)).toLocaleString(),
      )

      const unplannedExit = localStorage.getItem("isoria_unplanned_exit") === "true"
      const scriptKeys = Object.keys(localStorage).filter((key) => key.startsWith("isoria_script_"))

      if (scriptKeys.length > 0) {
        scriptKeys.forEach((key) => {
          const scriptName = key.replace("isoria_script_", "")
          const scriptContent = localStorage.getItem(key)

          if (scriptContent) {
            this.scripts[scriptName] = scriptContent
            console.log("Recuperado script: " + scriptName)
          }
        })

        if (unplannedExit) {
          this.logMessage(
            "Scripts recuperados do armazenamento local após fechamento não planejado da página.",
            "success",
          )
          localStorage.removeItem("isoria_unplanned_exit")
        }
      }
    } catch (e) {
      console.error("Erro ao recuperar scripts do localStorage:", e)
    }
  }

  setupAutoSave() {
    setInterval(() => {
      if (this.currentScript && this.codeMirror) {
        const content = this.codeMirror.getValue()

        try {
          localStorage.setItem("isoria_script_" + this.currentScript, content)
          localStorage.setItem("isoria_last_script", this.currentScript)
          localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())
          this.updateFileStatus("Auto-salvo")
        } catch (e) {
          console.error("Erro no auto-save:", e)
        }
      }
    }, 30000)
  }

  initializeInterface() {
    if (this._interfaceInitialized) {
      console.log("Interface já inicializada")
      return
    }

    // Elementos do DOM
    this.scriptContent = document.getElementById("script-content")
    this.scriptSelector = document.getElementById("script-selector")
    this.consoleOutput = document.getElementById("console-output")
    this.messageCountElement = document.getElementById("message-count")
    this.fileStatusElement = document.getElementById("file-status")

    if (!this.scriptContent || !this.scriptSelector) {
      console.error("Elementos necessários não encontrados no DOM")
      return
    }

    // Inicializar CodeMirror
    this.initializeCodeMirror()

    // Preencher seletor de scripts
    this.updateScriptSelector()

    // Event listeners
    this.setupEventListeners()

    this._interfaceInitialized = true
  }

  setupEventListeners() {
    // Botões principais
    document.getElementById("btn-run")?.addEventListener("click", () => this.runCurrentScript())
    document.getElementById("new-script-btn")?.addEventListener("click", () => this.createNewScript())
    document.getElementById("save-script-btn")?.addEventListener("click", () => this.saveCurrentScript())
    document.getElementById("btn-format")?.addEventListener("click", () => this.formatCurrentScript())
    document.getElementById("clear-console-btn")?.addEventListener("click", () => this.clearConsole())
    document.getElementById("btn-clear-console")?.addEventListener("click", () => this.clearConsole())
    document.getElementById("btn-test-recovery")?.addEventListener("click", () => this.simulateUnplannedExit())

    // Seletor de scripts
    this.scriptSelector.addEventListener("change", (e) => {
      this.loadScript(e.target.value)
    })

    // Toggle console
    document.getElementById("toggle-console")?.addEventListener("click", () => {
      const consoleSection = document.querySelector(".console-section")
      const icon = document.querySelector("#toggle-console i")

      consoleSection.classList.toggle("expanded")
      icon.classList.toggle("fa-chevron-up")
      icon.classList.toggle("fa-chevron-down")
    })

    // Botões de backup
    this.setupBackupButtons()
  }

  setupBackupButtons() {
    // Exportar scripts
    document.getElementById("export-scripts-button")?.addEventListener("click", () => this.exportScripts())

    // Importar scripts
    document.getElementById("import-scripts-button")?.addEventListener("click", () => this.importScripts())

    // Limpar localStorage
    document.getElementById("clear-storage-button")?.addEventListener("click", () => this.clearLocalStorage())
  }

  initializeCodeMirror() {
    console.log("Inicializando CodeMirror...")

    if (!this.scriptContent) {
      console.error("Textarea não encontrado!")
      return false
    }

    if (typeof CodeMirror === "undefined") {
      console.error("CodeMirror não está disponível!")
      return false
    }

    try {
      // Remover instância anterior se existir
      if (this.codeMirror) {
        this.codeMirror.toTextArea()
        this.codeMirror = null
      }

      // Criar nova instância
      this.codeMirror = CodeMirror.fromTextArea(this.scriptContent, {
        mode: "javascript",
        theme: "dracula",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: true,
        readOnly: false,
        inputStyle: "textarea",
        dragDrop: true,
        lineWrapping: true,
        direction: "ltr",
        extraKeys: {
          "Ctrl-Space": "autocomplete",
          F5: () => this.runCurrentScript(),
          "Ctrl-S": () => {
            this.saveCurrentScript()
            return false
          },
        },
      })

      // Event listeners do CodeMirror
      this.codeMirror.on("change", () => {
        if (this.currentScript) {
          this.scripts[this.currentScript] = this.codeMirror.getValue()
          this.updateFileStatus("Modificado")

          // Auto-save no localStorage
          try {
            localStorage.setItem("isoria_script_" + this.currentScript, this.codeMirror.getValue())
            localStorage.setItem("isoria_last_script", this.currentScript)
            localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())
          } catch (e) {
            console.error("Erro ao salvar no localStorage:", e)
          }
        }
      })

      console.log("CodeMirror inicializado com sucesso!")
      return true
    } catch (error) {
      console.error("Erro ao inicializar CodeMirror:", error)
      return false
    }
  }

  updateScriptSelector() {
    this.scriptSelector.innerHTML = ""

    Object.keys(this.scripts).forEach((scriptName) => {
      const option = document.createElement("option")
      option.value = scriptName
      option.textContent = scriptName
      this.scriptSelector.appendChild(option)
    })

    if (this.currentScript) {
      this.scriptSelector.value = this.currentScript
    }
  }

  loadScript(scriptName) {
    if (!this.scripts[scriptName]) {
      console.error(`Script ${scriptName} não encontrado.`)
      return
    }

    this.currentScript = scriptName

    // Verificar versão do localStorage
    let scriptContent = this.scripts[scriptName]
    const localStorageVersion = localStorage.getItem("isoria_script_" + scriptName)

    if (localStorageVersion) {
      scriptContent = localStorageVersion
      this.scripts[scriptName] = scriptContent
    }

    // Atualizar seletor
    this.scriptSelector.value = scriptName

    // Atualizar editor
    if (this.codeMirror) {
      this.codeMirror.setValue(scriptContent)
      this.codeMirror.clearHistory()
    }

    // Atualizar localStorage
    localStorage.setItem("isoria_last_script", scriptName)

    this.updateFileStatus("Carregado")
    console.log(`Script ${scriptName} carregado com sucesso.`)
  }

  runCurrentScript() {
    if (!this.currentScript) return

    this.saveCurrentScript()
    this.clearConsole()

    try {
      const scriptCode = this.codeMirror ? this.codeMirror.getValue() : ""

      if (window.IsoriaEngineInstance) {
        // Resetar e executar script
        window.IsoriaEngineInstance.reset()
        
        // Configurar o canvas para o Phaser se necessário
        const canvas = document.getElementById('game-canvas')
        if (canvas && !window.IsoriaEngineInstance.game) {
          // A engine criará o jogo automaticamente quando necessário
          window.IsoriaEngineInstance.config.parent = canvas.parentElement
        }
        
        // A engine já tem seu próprio redirecionamento de console
        window.IsoriaEngineInstance.executeScript(scriptCode)
        
        // Esconder placeholder do preview
        const placeholder = document.querySelector(".preview-placeholder")
        if (placeholder) {
          placeholder.style.display = "none"
        }
      } else {
        this.logMessage("Erro: Engine não inicializada", "error")
      }
    } catch (error) {
      this.logMessage(`Erro ao executar script: ${error.message}`, "error")
    }
  }

  saveCurrentScript() {
    if (!this.currentScript) return

    const content = this.codeMirror ? this.codeMirror.getValue() : ""
    this.scripts[this.currentScript] = content

    try {
      localStorage.setItem("isoria_script_" + this.currentScript, content)
      localStorage.setItem("isoria_last_script", this.currentScript)
      localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())

      this.updateFileStatus("Salvo")
      this.logMessage(`Script salvo: ${this.currentScript}`, "success")
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e)
      this.logMessage("Erro ao salvar script", "error")
    }
  }

  formatCurrentScript() {
    if (!this.codeMirror) return

    try {
      const code = this.codeMirror.getValue()
      const formattedCode = this.formatJavaScript(code)
      this.codeMirror.setValue(formattedCode)
      this.logMessage("Código formatado com sucesso", "success")
    } catch (error) {
      this.logMessage(`Erro ao formatar código: ${error.message}`, "error")
    }
  }

  formatJavaScript(code) {
    // Formatação simples
    let formatted = code.trim()
    formatted = formatted.replace(/;\s*/g, ";\n")
    formatted = formatted.replace(/{\s*/g, "{\n")
    formatted = formatted.replace(/}\s*/g, "}\n")

    const lines = formatted.split("\n")
    let indentLevel = 0
    const indentedLines = lines.map((line) => {
      if (line.trim().startsWith("}")) {
        indentLevel = Math.max(0, indentLevel - 1)
      }

      const indentedLine = "    ".repeat(indentLevel) + line.trim()

      if (line.trim().endsWith("{")) {
        indentLevel++
      }

      return indentedLine
    })

    return indentedLines.join("\n")
  }

  createNewScript() {
    const scriptName = prompt("Digite o nome do novo script (com extensão .js):", "new_script.js")

    if (!scriptName) return

    if (!scriptName.endsWith(".js")) {
      this.logMessage("Nome de script inválido. Deve terminar com .js", "error")
      return
    }

    if (this.scripts[scriptName]) {
      this.logMessage(`Script ${scriptName} já existe`, "warning")
      return
    }

    const defaultContent = `// ${scriptName} - Criado em ${new Date().toLocaleString()}\n\n// Seu código aqui\n`
    this.scripts[scriptName] = defaultContent

    try {
      localStorage.setItem("isoria_script_" + scriptName, defaultContent)
      localStorage.setItem("isoria_last_script", scriptName)
      localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())
    } catch (e) {
      console.error("Erro ao salvar novo script no localStorage:", e)
    }

    this.updateScriptSelector()
    this.loadScript(scriptName)
    this.logMessage(`Novo script criado: ${scriptName}`, "success")
  }

  exportScripts() {
    try {
      const scriptsData = {
        timestamp: Date.now(),
        scripts: this.scripts,
        currentScript: this.currentScript,
      }

      const jsonData = JSON.stringify(scriptsData, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const downloadLink = document.createElement("a")
      downloadLink.href = url
      downloadLink.download = `isoria_scripts_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      this.logMessage("Scripts exportados com sucesso!", "success")
    } catch (e) {
      console.error("Erro ao exportar scripts:", e)
      this.logMessage("Erro ao exportar scripts: " + e.message, "error")
    }
  }

  importScripts() {
    try {
      const fileInput = document.createElement("input")
      fileInput.type = "file"
      fileInput.accept = ".json"
      fileInput.style.display = "none"
      document.body.appendChild(fileInput)

      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0]
        if (!file) {
          document.body.removeChild(fileInput)
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)

            if (!data.scripts) {
              throw new Error("Formato de arquivo inválido")
            }

            const scriptCount = Object.keys(data.scripts).length
            const confirmImport = confirm(
              `Importar ${scriptCount} scripts? Isso substituirá scripts existentes com o mesmo nome.`,
            )

            if (confirmImport) {
              this.scripts = { ...this.scripts, ...data.scripts }

              Object.entries(data.scripts).forEach(([name, content]) => {
                localStorage.setItem("isoria_script_" + name, content)
              })

              localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())

              this.updateScriptSelector()

              if (data.currentScript && this.scripts[data.currentScript]) {
                this.loadScript(data.currentScript)
              }

              this.logMessage(`${scriptCount} scripts importados com sucesso!`, "success")
            }
          } catch (err) {
            console.error("Erro ao processar arquivo:", err)
            this.logMessage("Erro ao importar scripts: " + err.message, "error")
          }

          document.body.removeChild(fileInput)
        }

        reader.readAsText(file)
      })

      fileInput.click()
    } catch (e) {
      console.error("Erro ao importar scripts:", e)
      this.logMessage("Erro ao importar scripts: " + e.message, "error")
    }
  }

  clearLocalStorage() {
    try {
      const confirmClear = confirm(
        "Tem certeza que deseja limpar todos os scripts salvos no armazenamento local? Esta ação não pode ser desfeita.",
      )

      if (confirmClear) {
        const scriptKeys = Object.keys(localStorage).filter(
          (key) =>
            key.startsWith("isoria_script_") || key === "isoria_last_script" || key === "isoria_scripts_timestamp",
        )

        scriptKeys.forEach((key) => localStorage.removeItem(key))
        this.logMessage("Armazenamento local limpo com sucesso!", "success")
      }
    } catch (e) {
      console.error("Erro ao limpar localStorage:", e)
      this.logMessage("Erro ao limpar armazenamento local: " + e.message, "error")
    }
  }

  // Removido setupConsoleRedirection - a engine já gerencia isso

  logMessage(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString()
    
    // Criar elemento de log
    const createLogElement = () => {
      const logLine = document.createElement('div')
      logLine.className = `console-line ${type}`
      logLine.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="message">${message}</span>
      `
      return logLine
    }
    
    // Adicionar ao console principal
    const console = document.getElementById('console-output')
    if (console) {
      const logLine = createLogElement()
      console.appendChild(logLine)
      console.scrollTop = console.scrollHeight
      
      // Limitar número de mensagens
      const lines = console.querySelectorAll('.console-line')
      if (lines.length > 100) {
        lines[0].remove()
      }
    }
  }

  clearConsole() {
    if (!this.consoleOutput) return

    this.consoleOutput.innerHTML = ""
    this.messageCount = 0
    this.updateMessageCount()
    
    // Não registrar mensagem de "Console limpo" para evitar poluição
  }

  updateMessageCount() {
    if (this.messageCountElement) {
      this.messageCountElement.textContent = `${this.messageCount} mensagens`
    }
  }

  updateFileStatus(status) {
    if (this.fileStatusElement) {
      this.fileStatusElement.textContent = status
      this.fileStatusElement.className = "file-status"

      if (status === "Modificado") {
        this.fileStatusElement.style.color = "#fbbf24"
      } else if (status === "Salvo" || status === "Auto-salvo") {
        this.fileStatusElement.style.color = "#4ade80"
      } else {
        this.fileStatusElement.style.color = "#e0e0e0"
      }
    }
  }

  simulateUnplannedExit() {
    if (
      confirm(
        "Isso irá simular um fechamento não planejado da página para testar o sistema de recuperação. A página será recarregada. Continuar?",
      )
    ) {
      const currentScript = this.currentScript
      const content = this.codeMirror.getValue()

      if (currentScript && content) {
        localStorage.setItem("isoria_script_" + currentScript, content)
        localStorage.setItem("isoria_last_script", currentScript)
        localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())
        localStorage.setItem("isoria_unplanned_exit", "true")

        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    }
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado, inicializando ScriptEditor...")

  // Verificar se o CodeMirror está disponível
  if (typeof CodeMirror === "undefined") {
    console.error("CodeMirror não está definido")
    return
  }

  // Criar instância do ScriptEditor
  window.scriptEditor = new ScriptEditor()

  // Verificar inicialização do CodeMirror
  setTimeout(() => {
    const cmElements = document.querySelectorAll(".CodeMirror")
    if (cmElements.length === 0) {
      console.log("CodeMirror não foi inicializado, tentando novamente...")
      if (window.scriptEditor) {
        window.scriptEditor.initializeCodeMirror()
      }
    }
  }, 500)
})
