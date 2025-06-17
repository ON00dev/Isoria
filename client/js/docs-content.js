// Documentação da Isoria Engine - Comandos e API Reference
// Sistema de documentação integrado para o framework de scripts

class DocsContent {
    constructor() {
        this.sections = {
            'getting-started': this.getGettingStartedContent(),
            'api-reference': this.getAPIReferenceContent(),
            'examples': this.getExamplesContent()
        };
    }

    getGettingStartedContent() {
        return `
# Começando com Isoria Engine

## Introdução
A Isoria Engine é um framework JavaScript para criação de jogos 2D isométricos. Você pode desenvolver usando ferramentas visuais ou codificando diretamente.

## Modos de Desenvolvimento

### Modo Visual
- Use as ferramentas visuais para arrastar e soltar elementos
- Configure propriedades através do painel lateral
- O código é gerado automaticamente

### Modo Script
- Escreva código JavaScript diretamente
- Use a API completa da Isoria Engine
- Execute e veja o resultado no preview

## Estrutura Básica

\`\`\`javascript
// Criar uma cena
Isoria.scene.create('MainScene');

// Adicionar um jogador
Isoria.player.create(400, 300);

// Iniciar o jogo
Isoria.game.start();
\`\`\`

## Próximos Passos
1. Explore a API Reference
2. Veja os exemplos práticos
3. Comece criando sua primeira cena
        `;
    }

    getAPIReferenceContent() {
        return `
# API Reference - Isoria Engine

## Isoria.scene

### \`Isoria.scene.create(name, config)\`
Cria uma nova cena no jogo.

**Parâmetros:**
- \`name\` (string): Nome da cena
- \`config\` (object): Configurações da cena
  - \`backgroundColor\` (string): Cor de fundo (hex)
  - \`width\` (number): Largura da cena
  - \`height\` (number): Altura da cena

**Exemplo:**
\`\`\`javascript
Isoria.scene.create('MainScene', {
    backgroundColor: '#2c3e50',
    width: 800,
    height: 600
});
\`\`\`

### \`Isoria.scene.switch(name)\`
Muda para uma cena específica.

---

## Isoria.world

### \`Isoria.world.addTilemap(config)\`
Adiciona um tilemap à cena atual.

**Parâmetros:**
- \`config\` (object): Configurações do tilemap
  - \`width\` (number): Largura em tiles
  - \`height\` (number): Altura em tiles
  - \`tileSize\` (number): Tamanho do tile em pixels
  - \`data\` (array): Dados dos tiles

### \`Isoria.world.setCamera(config)\`
Configura a câmera do jogo.

**Parâmetros:**
- \`config\` (object): Configurações da câmera
  - \`zoom\` (number): Nível de zoom
  - \`followPlayer\` (boolean): Seguir o jogador
  - \`bounds\` (object): Limites da câmera

---

## Isoria.objects

### \`Isoria.objects.addSprite(x, y, config)\`
Adiciona um sprite à cena.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`config\` (object): Configurações do sprite
  - \`texture\` (string): Textura do sprite
  - \`width\` (number): Largura
  - \`height\` (number): Altura
  - \`color\` (string): Cor (se não houver textura)

### \`Isoria.objects.addPlayer(x, y, config)\`
Adiciona o jogador à cena.

**Parâmetros:**
- \`x\` (number): Posição inicial X
- \`y\` (number): Posição inicial Y
- \`config\` (object): Configurações do jogador
  - \`speed\` (number): Velocidade de movimento
  - \`texture\` (string): Textura do jogador
  - \`controls\` (object): Configurações de controle

### \`Isoria.objects.addNPC(x, y, config)\`
Adiciona um NPC à cena.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`config\` (object): Configurações do NPC
  - \`ai\` (string): Tipo de IA ('basic', 'patrol', 'follow')
  - \`dialogue\` (array): Diálogos do NPC
  - \`texture\` (string): Textura do NPC

### \`Isoria.objects.addItem(x, y, config)\`
Adiciona um item coletável.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`config\` (object): Configurações do item
  - \`type\` (string): Tipo do item
  - \`value\` (number): Valor do item
  - \`effect\` (function): Efeito ao coletar

---

## Isoria.physics

### \`Isoria.physics.addCollider(x, y, width, height, config)\`
Adiciona um colisor à cena.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`width\` (number): Largura
- \`height\` (number): Altura
- \`config\` (object): Configurações do colisor
  - \`static\` (boolean): Se é estático
  - \`sensor\` (boolean): Se é um sensor

### \`Isoria.physics.addTrigger(x, y, width, height, callback)\`
Adiciona uma área de trigger.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`width\` (number): Largura
- \`height\` (number): Altura
- \`callback\` (function): Função executada ao ativar

---

## Isoria.audio

### \`Isoria.audio.addMusic(file, config)\`
Adiciona música de fundo.

**Parâmetros:**
- \`file\` (string): Caminho do arquivo
- \`config\` (object): Configurações
  - \`loop\` (boolean): Se deve repetir
  - \`volume\` (number): Volume (0-1)

### \`Isoria.audio.addSound(name, file, config)\`
Adiciona um efeito sonoro.

**Parâmetros:**
- \`name\` (string): Nome do som
- \`file\` (string): Caminho do arquivo
- \`config\` (object): Configurações
  - \`volume\` (number): Volume (0-1)

### \`Isoria.audio.playSound(name)\`
Toca um efeito sonoro.

---

## Isoria.ui

### \`Isoria.ui.addText(x, y, text, config)\`
Adiciona texto à interface.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`text\` (string): Texto a exibir
- \`config\` (object): Configurações
  - \`fontSize\` (number): Tamanho da fonte
  - \`color\` (string): Cor do texto
  - \`fontFamily\` (string): Família da fonte

### \`Isoria.ui.addButton(x, y, text, callback, config)\`
Adiciona um botão à interface.

**Parâmetros:**
- \`x\` (number): Posição X
- \`y\` (number): Posição Y
- \`text\` (string): Texto do botão
- \`callback\` (function): Função ao clicar
- \`config\` (object): Configurações
  - \`width\` (number): Largura
  - \`height\` (number): Altura
  - \`backgroundColor\` (string): Cor de fundo

### \`Isoria.ui.addPanel(x, y, width, height, config)\`
Adiciona um painel à interface.

---

## Isoria.camera

### \`Isoria.camera.setZoom(zoom)\`
Define o zoom da câmera.

### \`Isoria.camera.followObject(object)\`
Faz a câmera seguir um objeto.

### \`Isoria.camera.setBounds(x, y, width, height)\`
Define os limites da câmera.

---

## Isoria.utils

### \`Isoria.utils.distance(obj1, obj2)\`
Calcula a distância entre dois objetos.

### \`Isoria.utils.angle(obj1, obj2)\`
Calcula o ângulo entre dois objetos.

### \`Isoria.utils.random(min, max)\`
Gera um número aleatório.

### \`Isoria.utils.clamp(value, min, max)\`
Limita um valor entre min e max.

---

## Isoria.game

### \`Isoria.game.start()\`
Inicia o jogo.

### \`Isoria.game.pause()\`
Pausa o jogo.

### \`Isoria.game.resume()\`
Retoma o jogo.

### \`Isoria.game.stop()\`
Para o jogo.

### \`Isoria.game.reset()\`
Reseta o jogo.
        `;
    }

    getExamplesContent() {
        return `
# Exemplos Práticos

## Exemplo 1: Jogo Básico

\`\`\`javascript
// Criar cena principal
Isoria.scene.create('MainScene', {
    backgroundColor: '#2c3e50',
    width: 800,
    height: 600
});

// Adicionar tilemap
Isoria.world.addTilemap({
    width: 25,
    height: 25,
    tileSize: 32,
    data: [] // Array com dados dos tiles
});

// Adicionar jogador
Isoria.objects.addPlayer(400, 300, {
    speed: 200,
    color: '#3498db'
});

// Configurar câmera
Isoria.camera.followObject('player');
Isoria.camera.setZoom(1);

// Iniciar jogo
Isoria.game.start();
\`\`\`

## Exemplo 2: NPCs e Diálogo

\`\`\`javascript
// Adicionar NPC
Isoria.objects.addNPC(200, 200, {
    ai: 'basic',
    color: '#e74c3c',
    dialogue: [
        'Olá, aventureiro!',
        'Bem-vindo ao mundo de Isoria!',
        'Boa sorte em sua jornada!'
    ]
});

// Adicionar trigger para diálogo
Isoria.physics.addTrigger(180, 180, 40, 40, () => {
    Isoria.ui.showDialogue('npc1');
});
\`\`\`

## Exemplo 3: Sistema de Coleta

\`\`\`javascript
// Adicionar itens coletáveis
for (let i = 0; i < 10; i++) {
    const x = Isoria.utils.random(50, 750);
    const y = Isoria.utils.random(50, 550);
    
    Isoria.objects.addItem(x, y, {
        type: 'coin',
        value: 10,
        color: '#f1c40f',
        effect: (player) => {
            player.score += 10;
            Isoria.ui.updateScore(player.score);
        }
    });
}

// Adicionar UI de pontuação
Isoria.ui.addText(10, 10, 'Score: 0', {
    fontSize: 24,
    color: '#ffffff',
    id: 'scoreText'
});
\`\`\`

## Exemplo 4: Sistema de Física

\`\`\`javascript
// Adicionar paredes
Isoria.physics.addCollider(0, 0, 800, 20, { static: true }); // Topo
Isoria.physics.addCollider(0, 580, 800, 20, { static: true }); // Base
Isoria.physics.addCollider(0, 0, 20, 600, { static: true }); // Esquerda
Isoria.physics.addCollider(780, 0, 20, 600, { static: true }); // Direita

// Adicionar obstáculos
for (let i = 0; i < 5; i++) {
    const x = Isoria.utils.random(100, 700);
    const y = Isoria.utils.random(100, 500);
    
    Isoria.physics.addCollider(x, y, 64, 64, {
        static: true,
        color: '#95a5a6'
    });
}
\`\`\`

## Exemplo 5: Sistema de Áudio

\`\`\`javascript
// Adicionar música de fundo
Isoria.audio.addMusic('assets/music/background.mp3', {
    loop: true,
    volume: 0.5
});

// Adicionar efeitos sonoros
Isoria.audio.addSound('jump', 'assets/sounds/jump.wav', {
    volume: 0.8
});

Isoria.audio.addSound('collect', 'assets/sounds/collect.wav', {
    volume: 1.0
});

// Tocar som ao pular
Isoria.input.onKeyPress('SPACE', () => {
    Isoria.audio.playSound('jump');
    // Lógica do pulo aqui
});
\`\`\`

## Exemplo 6: Interface Completa

\`\`\`javascript
// Criar painel de UI
Isoria.ui.addPanel(10, 10, 200, 150, {
    backgroundColor: '#34495e',
    border: '2px solid #2c3e50'
});

// Adicionar elementos ao painel
Isoria.ui.addText(20, 30, 'HP: 100', {
    fontSize: 16,
    color: '#e74c3c',
    id: 'hpText'
});

Isoria.ui.addText(20, 50, 'MP: 50', {
    fontSize: 16,
    color: '#3498db',
    id: 'mpText'
});

Isoria.ui.addButton(20, 80, 'Inventário', () => {
    Isoria.ui.toggleInventory();
}, {
    width: 100,
    height: 30,
    backgroundColor: '#2c3e50'
});

Isoria.ui.addButton(20, 120, 'Menu', () => {
    Isoria.scene.switch('MenuScene');
}, {
    width: 100,
    height: 30,
    backgroundColor: '#2c3e50'
});
\`\`\`

## Exemplo 7: Sistema de Salvamento

\`\`\`javascript
// Salvar estado do jogo
function saveGame() {
    const gameState = {
        playerPosition: Isoria.objects.getPlayer().position,
        playerStats: Isoria.objects.getPlayer().stats,
        currentScene: Isoria.scene.getCurrentScene(),
        inventory: Isoria.player.getInventory(),
        timestamp: Date.now()
    };
    
    localStorage.setItem('isoriaGameSave', JSON.stringify(gameState));
    Isoria.ui.showMessage('Jogo salvo!');
}

// Carregar estado do jogo
function loadGame() {
    const savedData = localStorage.getItem('isoriaGameSave');
    
    if (savedData) {
        const gameState = JSON.parse(savedData);
        
        Isoria.scene.switch(gameState.currentScene);
        Isoria.objects.getPlayer().setPosition(gameState.playerPosition);
        Isoria.objects.getPlayer().setStats(gameState.playerStats);
        Isoria.player.setInventory(gameState.inventory);
        
        Isoria.ui.showMessage('Jogo carregado!');
    }
}

// Adicionar botões de save/load
Isoria.ui.addButton(650, 10, 'Salvar', saveGame);
Isoria.ui.addButton(650, 50, 'Carregar', loadGame);
\`\`\`
        `;
    }

    getContent(section) {
        return this.sections[section] || 'Seção não encontrada.';
    }

    searchContent(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        Object.entries(this.sections).forEach(([section, content]) => {
            if (content.toLowerCase().includes(searchTerm)) {
                results.push({
                    section: section,
                    title: this.getSectionTitle(section),
                    excerpt: this.getExcerpt(content, searchTerm)
                });
            }
        });
        
        return results;
    }

    getSectionTitle(section) {
        const titles = {
            'getting-started': 'Começando',
            'api-reference': 'API Reference',
            'examples': 'Exemplos'
        };
        
        return titles[section] || section;
    }

    getExcerpt(content, searchTerm) {
        const index = content.toLowerCase().indexOf(searchTerm);
        if (index === -1) return '';
        
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + 100);
        
        return '...' + content.substring(start, end) + '...';
    }
}

// Instância global da documentação
window.DocsContent = new DocsContent();

// Função para carregar documentação no modal
function loadDocumentation(section = 'getting-started') {
    const content = window.DocsContent.getContent(section);
    const docContent = document.getElementById('doc-content');
    
    if (docContent) {
        // Converter markdown para HTML (implementação básica)
        const htmlContent = convertMarkdownToHTML(content);
        docContent.innerHTML = htmlContent;
    }
    
    // Atualizar abas ativas
    document.querySelectorAll('.doc-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === section);
    });
}

// Converter markdown básico para HTML
function convertMarkdownToHTML(markdown) {
    return markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/```javascript([\s\S]*?)```/g, '<pre><code class="language-javascript">$1</code></pre>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n/g, '<br>');
}

// Event listeners para documentação
document.addEventListener('DOMContentLoaded', () => {
    // Abas da documentação
    document.querySelectorAll('.doc-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            loadDocumentation(section);
        });
    });
    
    // Botão de documentação
    const docBtn = document.getElementById('show-docs');
    if (docBtn) {
        docBtn.addEventListener('click', () => {
            const modal = document.getElementById('docs-modal');
            if (modal) {
                modal.style.display = 'flex';
                loadDocumentation('getting-started');
            }
        });
    }
    
    // Fechar modal
    const closeBtn = document.querySelector('.docs-modal .close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('docs-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Fechar modal clicando fora
    const modal = document.getElementById('docs-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});