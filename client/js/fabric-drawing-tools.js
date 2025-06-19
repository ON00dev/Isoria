/**
 * Fabric.js Drawing Tools para Isoria Game Engine
 * Este arquivo implementa ferramentas de desenho usando a biblioteca Fabric.js
 */

class FabricDrawingTools {
    constructor() {
        this.canvas = null;
        this.currentTool = 'select';
        this.currentColor = 'rgba(255, 0, 0, 1)';
        this.isDrawing = false;
        this.initialized = false;
        this.phaserCanvas = null;
        this.engineTools = null;
        
        // Referências para elementos DOM
        this.fabricCanvasElement = document.getElementById('fabric-canvas');
        this.gameCanvasElement = document.getElementById('game-canvas');
        this.viewportElement = document.getElementById('preview-viewport');
        
        // Ferramentas disponíveis
        this.tools = {
            select: { cursor: 'default' },
            paint: { cursor: 'crosshair' },
            fill: { cursor: 'cell' },
            eraser: { cursor: 'not-allowed' }
        };
    }
    
    /**
     * Inicializa as ferramentas de desenho com Fabric.js
     * @param {Object} engineTools - Instância da classe EngineTools
     */
    initialize(engineTools) {
        if (this.initialized) return;
        
        this.engineTools = engineTools;
        this.phaserCanvas = this.gameCanvasElement;
        
        // Configurar o canvas do Fabric.js com o mesmo tamanho do canvas do Phaser
        this.fabricCanvasElement.width = this.viewportElement.clientWidth;
        this.fabricCanvasElement.height = this.viewportElement.clientHeight;
        
        // Inicializar o canvas do Fabric.js
        this.canvas = new fabric.Canvas('fabric-canvas', {
            isDrawingMode: false,
            selection: true,
            backgroundColor: 'transparent'
        });
        
        // Configurar eventos para ferramentas de desenho
        this.setupToolEvents();
        
        // Configurar eventos para seleção de cores
        this.setupColorEvents();
        
        // Configurar redimensionamento
        window.addEventListener('resize', () => this.onResize());
        
        this.initialized = true;
        console.log('Fabric.js Drawing Tools inicializado');
    }
    
    /**
     * Configura eventos para as ferramentas de desenho
     */
    setupToolEvents() {
        // Obter todos os botões de ferramentas
        const toolButtons = document.querySelectorAll('.tool-btn');
        
        // Adicionar evento de clique para cada botão
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tool = button.getAttribute('data-tool');
                this.selectTool(tool);
            });
        });
    }
    
    /**
     * Configura eventos para seleção de cores
     */
    setupColorEvents() {
        // Obter todos os swatches de cores
        const colorSwatches = document.querySelectorAll('.color-swatch');
        
        // Adicionar evento de clique para cada swatch
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = swatch.getAttribute('data-color');
                this.selectColor(color);
            });
        });
        
        // Configurar controles RGBA
        const redInput = document.getElementById('red-input');
        const greenInput = document.getElementById('green-input');
        const blueInput = document.getElementById('blue-input');
        const alphaInput = document.getElementById('alpha-input');
        
        const updateCustomColor = () => {
            const r = redInput.value;
            const g = greenInput.value;
            const b = blueInput.value;
            const a = alphaInput.value;
            
            document.getElementById('red-value').textContent = r;
            document.getElementById('green-value').textContent = g;
            document.getElementById('blue-value').textContent = b;
            document.getElementById('alpha-value').textContent = parseFloat(a).toFixed(1);
            
            const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
            this.selectColor(rgba);
        };
        
        redInput.addEventListener('input', updateCustomColor);
        greenInput.addEventListener('input', updateCustomColor);
        blueInput.addEventListener('input', updateCustomColor);
        alphaInput.addEventListener('input', updateCustomColor);
    }
    
    /**
     * Seleciona uma ferramenta de desenho
     * @param {string} tool - Nome da ferramenta
     */
    selectTool(tool) {
        if (!this.tools[tool]) return;
        
        // Atualizar ferramenta atual
        this.currentTool = tool;
        
        // Atualizar UI
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(button => {
            if (button.getAttribute('data-tool') === tool) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Mostrar/ocultar o seletor de cores para ferramentas de pintura
        const colorPickerPanel = document.getElementById('color-picker-panel');
        if (['paint', 'fill'].includes(tool)) {
            colorPickerPanel.style.display = 'block';
        } else {
            colorPickerPanel.style.display = 'none';
        }
        
        // Configurar o canvas do Fabric.js com base na ferramenta selecionada
        this.configureFabricForTool(tool);
        
        // Atualizar o cursor
        this.updateCursor();
        
        // Alternar entre canvas do Phaser e Fabric.js
        this.toggleCanvasVisibility(tool);
        
        console.log(`Ferramenta selecionada: ${tool}`);
    }
    
    /**
     * Configura o canvas do Fabric.js com base na ferramenta selecionada
     * @param {string} tool - Nome da ferramenta
     */
    configureFabricForTool(tool) {
        // Resetar configurações
        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        
        // Configurar com base na ferramenta
        switch (tool) {
            case 'select':
                this.canvas.selection = true;
                break;
                
            case 'paint':
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.color = this.currentColor;
                this.canvas.freeDrawingBrush.width = 5;
                break;
                
            // Casos 'line' e 'rectangle' foram removidos
                
            case 'eraser':
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.color = 'white';
                this.canvas.freeDrawingBrush.width = 10;
                break;
                
            case 'fill':
                this.canvas.selection = false;
                // Configurado nos eventos do mouse
                break;
        }
        
        // Configurar eventos do mouse para ferramentas específicas
        this.setupMouseEvents();
    }
    
    /**
     * Configura eventos do mouse para ferramentas específicas
     */
    setupMouseEvents() {
        // Remover eventos existentes
        this.canvas.off('mouse:down');
        this.canvas.off('mouse:move');
        this.canvas.off('mouse:up');
        
        // Configurar eventos com base na ferramenta atual
        switch (this.currentTool) {
            // Casos 'line' e 'rectangle' foram removidos
                
            case 'fill':
                this.setupFillEvents();
                break;
        }
    }
    
    // As funções setupLineEvents e setupRectangleEvents foram removidas
    
    /**
     * Configura eventos para a ferramenta de preenchimento
     */
    setupFillEvents() {
        this.canvas.on('mouse:down', (o) => {
            const pointer = this.canvas.getPointer(o.e);
            
            // Verificar se clicou em um objeto
            const target = this.canvas.findTarget(o.e);
            
            if (target) {
                // Preencher o objeto com a cor atual
                target.set('fill', this.currentColor);
                this.canvas.renderAll();
                
                // Converter para o formato do Phaser se necessário
                this.convertToPhaser();
            } else {
                // Preencher o fundo do canvas
                this.canvas.backgroundColor = this.currentColor;
                this.canvas.renderAll();
                
                // Atualizar o fundo do Phaser se necessário
                if (this.engineTools) {
                    this.engineTools.backgroundColor = this.currentColor;
                }
            }
        });
    }
    
    /**
     * Seleciona uma cor para desenho
     * @param {string} color - Cor no formato rgba
     */
    selectColor(color) {
        this.currentColor = color;
        
        // Atualizar a exibição da cor atual
        const currentColorElement = document.getElementById('current-color');
        if (currentColorElement) {
            currentColorElement.style.backgroundColor = color;
        }
        
        // Atualizar a cor do pincel se estiver no modo de desenho
        if (this.canvas && this.canvas.isDrawingMode) {
            this.canvas.freeDrawingBrush.color = color;
        }
        
        console.log(`Cor selecionada: ${color}`);
    }
    
    /**
     * Atualiza o cursor com base na ferramenta atual
     */
    updateCursor() {
        if (!this.canvas) return;
        
        const tool = this.tools[this.currentTool];
        if (tool && tool.cursor) {
            this.canvas.defaultCursor = tool.cursor;
        } else {
            this.canvas.defaultCursor = 'default';
        }
    }
    
    /**
     * Alterna a visibilidade entre os canvas do Phaser e Fabric.js
     * @param {string} tool - Nome da ferramenta
     */
    toggleCanvasVisibility(tool) {
        // Ferramentas que usam o Fabric.js
        const fabricTools = ['paint', 'eraser', 'fill'];
        
        if (fabricTools.includes(tool)) {
            // Mostrar canvas do Fabric.js e ocultar canvas do Phaser
            this.fabricCanvasElement.style.display = 'block';
            this.gameCanvasElement.style.display = 'none';
        } else {
            // Mostrar canvas do Phaser e ocultar canvas do Fabric.js
            this.fabricCanvasElement.style.display = 'none';
            this.gameCanvasElement.style.display = 'block';
        }
    }
    
    /**
     * Converte os objetos do Fabric.js para o formato do Phaser
     */
    convertToPhaser() {
        // Esta função seria implementada para converter os objetos desenhados
        // no Fabric.js para o formato adequado do Phaser/Isoria Engine
        
        // Por exemplo, poderia exportar os objetos como JSON e depois
        // interpretá-los no Phaser, ou renderizar em uma imagem
        
        // Para este exemplo, apenas registramos os objetos
        if (this.canvas) {
            const objects = this.canvas.getObjects();
            console.log('Objetos para converter para Phaser:', objects);
            
            // Aqui você implementaria a conversão real para o Phaser
            // Por exemplo, para cada objeto, criar um sprite ou gráfico no Phaser
        }
    }
    
    /**
     * Manipula o redimensionamento da janela
     */
    onResize() {
        if (!this.canvas) return;
        
        // Atualizar dimensões do canvas
        this.canvas.setWidth(this.viewportElement.clientWidth);
        this.canvas.setHeight(this.viewportElement.clientHeight);
        this.canvas.renderAll();
    }
    
    /**
     * Limpa o canvas do Fabric.js
     */
    clearCanvas() {
        if (!this.canvas) return;
        
        this.canvas.clear();
        this.canvas.backgroundColor = 'transparent';
        this.canvas.renderAll();
    }
}

// Criar instância global
const fabricDrawingTools = new FabricDrawingTools();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // A inicialização completa ocorrerá quando a instância do EngineTools estiver disponível
});