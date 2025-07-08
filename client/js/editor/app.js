/**
 * Aplicação principal - Gerencia a interface e interações
 */

// Detectar fechamento não planejado da página
window.addEventListener("beforeunload", (e) => {
  if (window.scriptEditor && window.scriptEditor.codeMirror) {
    const currentScript = window.scriptEditor.currentScript
    const content = window.scriptEditor.codeMirror.getValue()

    if (currentScript && content) {
      localStorage.setItem("isoria_script_" + currentScript, content)
      localStorage.setItem("isoria_last_script", currentScript)
      localStorage.setItem("isoria_scripts_timestamp", Date.now().toString())
      localStorage.setItem("isoria_unplanned_exit", "true")
    }
  }

  const message = "Você tem alterações não salvas. Tem certeza que deseja sair?"
  e.returnValue = message
  return message
})

// Verificar recuperação após fechamento não planejado
function checkForUnplannedExit() {
  const unplannedExit = localStorage.getItem("isoria_unplanned_exit") === "true"
  if (unplannedExit) {
    console.log("Detectado fechamento não planejado da página")

    const checkInterval = setInterval(() => {
      if (window.scriptEditor && window.scriptEditor.codeMirror) {
        clearInterval(checkInterval)

        window.scriptEditor.recoverScriptsFromLocalStorage()

        const lastScript = localStorage.getItem("isoria_last_script")
        if (lastScript && window.scriptEditor.scripts[lastScript]) {
          window.scriptEditor.loadScript(lastScript)
        }
      }
    }, 100)

    setTimeout(() => clearInterval(checkInterval), 10000)
  }
}

// Inicializar AudioContext após interação do usuário
document.addEventListener(
  "click",
  function initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const silentContext = new AudioContext()
      document.removeEventListener("click", initAudioContext)
      console.log("AudioContext inicializado")
    } catch (e) {
      console.warn("Não foi possível inicializar o AudioContext:", e)
    }
  },
  { once: true },
)

// Atalhos de teclado globais
document.addEventListener("keydown", (e) => {
  // F5 - Executar script
  if (e.key === "F5") {
    e.preventDefault()
    if (window.scriptEditor) {
      window.scriptEditor.runCurrentScript()
    }
  }

  // Ctrl+S - Salvar script
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault()
    if (window.scriptEditor) {
      window.scriptEditor.saveCurrentScript()
    }
  }

  // Ctrl+N - Novo script
  if (e.ctrlKey && e.key === "n") {
    e.preventDefault()
    if (window.scriptEditor) {
      window.scriptEditor.createNewScript()
    }
  }
})

// Gerenciar dropdown menus
document.addEventListener("click", (e) => {
  // Fechar todos os dropdowns quando clicar fora
  const dropdowns = document.querySelectorAll(".dropdown-menu")
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target) && !e.target.closest("[data-menu]")) {
      dropdown.style.display = "none"
    }
  })

  // Abrir dropdown específico
  if (e.target.closest("[data-menu]")) {
    const menuType = e.target.closest("[data-menu]").dataset.menu
    const dropdown = document.getElementById(menuType + "-menu")

    if (dropdown) {
      const rect = e.target.getBoundingClientRect()
      dropdown.style.display = "block"
      dropdown.style.left = rect.left + "px"
      dropdown.style.top = rect.bottom + 5 + "px"
    }
  }
})

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  console.log("Aplicação inicializada")

  // Verificar recuperação
  checkForUnplannedExit()

  // Configurar estatísticas do preview (simulação)
  setInterval(() => {
    const fpsCounter = document.getElementById("fps-counter")
    const objectsCounter = document.getElementById("objects-counter")
    const memoryCounter = document.getElementById("memory-counter")

    if (fpsCounter) {
      fpsCounter.textContent = Math.floor(Math.random() * 5) + 58 // 58-62 FPS
    }

    if (objectsCounter) {
      objectsCounter.textContent = Math.floor(Math.random() * 10)
    }

    if (memoryCounter) {
      const memory = (2.0 + Math.random() * 0.5).toFixed(1)
      memoryCounter.textContent = memory + "MB"
    }
  }, 1000)
})

// Inicializar a IsoriaEngine real
if (!window.IsoriaEngineInstance && typeof IsoriaEngine !== 'undefined') {
  window.IsoriaEngineInstance = new IsoriaEngine()
  console.log('IsoriaEngine inicializada com sucesso')
} else if (!window.IsoriaEngineInstance) {
  console.warn('IsoriaEngine não encontrada. Verifique se o arquivo isoria-engine.js foi carregado.')
}
