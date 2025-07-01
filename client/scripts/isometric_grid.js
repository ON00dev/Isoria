// Script para criar uma grade isométrica
// Define tamanhos de grade: pequeno (15x15), médio (50x50) e grande (120x120)

/**
 * Função para criar uma grade isométrica
 * @param {string} size - Tamanho da grade: 'pequeno', 'medio' ou 'grande'
 * @returns {object} - Informações sobre a grade criada
 */
function criarGradeIsometrica(size = 'medio') {
    // Definir dimensões da grade com base no tamanho selecionado
    let largura, altura;
    
    switch(size.toLowerCase()) {
        case 'pequeno':
            largura = altura = 15;
            break;
        case 'medio':
            largura = altura = 50;
            break;
        case 'grande':
            largura = altura = 120;
            break;
        default:
            largura = altura = 50; // Médio como padrão
            console.warn(`Tamanho '${size}' não reconhecido. Usando tamanho médio (50x50).`);
    }
    
    console.log(`Criando grade isométrica ${largura}x${altura}`);
    
    // Criar cena principal se não existir
    Isoria.scene.create('GradeIsometrica', { 
        backgroundColor: '#1a1a2e',
        width: 800,
        height: 600
    });
    
    // Configurações da grade isométrica
    const tileWidth = 32; // Largura do tile em pixels
    const tileHeight = 16; // Altura do tile em pixels
    const tileColors = [
        0x3498db, // Azul
        0x2ecc71, // Verde
        0xe74c3c, // Vermelho
        0xf1c40f, // Amarelo
        0x9b59b6  // Roxo
    ];
    
    // Calcular o centro da tela para posicionar a grade
    const centerX = 400;
    const centerY = 300;
    
    // Calcular o deslocamento para centralizar a grade
    const offsetX = centerX - ((largura + altura) * tileWidth / 4);
    const offsetY = centerY - ((largura + altura) * tileHeight / 4);
    
    // Criar os tiles da grade
    const tiles = [];
    
    for (let y = 0; y < altura; y++) {
        for (let x = 0; x < largura; x++) {
            // Calcular posição isométrica
            const isoX = (x - y) * (tileWidth / 2) + offsetX;
            const isoY = (x + y) * (tileHeight / 2) + offsetY;
            
            // Escolher uma cor aleatória para o tile
            const colorIndex = Math.floor(Math.random() * tileColors.length);
            const tileColor = tileColors[colorIndex];
            
            // Criar o tile como um objeto de jogo
            const tileId = Isoria.gameObject.create('sprite', isoX, isoY, {
                width: tileWidth,
                height: tileHeight,
                color: tileColor
            });
            
            // Armazenar informações do tile
            tiles.push({
                id: tileId,
                x: x,
                y: y,
                isoX: isoX,
                isoY: isoY,
                color: tileColor
            });
        }
    }
    
    // Adicionar informações da grade
    const infoText = Isoria.ui.addText(20, 20, `Grade Isométrica: ${largura}x${altura} tiles`, {
        fontSize: '16px',
        fill: '#ffffff',
        fontFamily: 'Arial'
    });
    
    // Configurar câmera
    Isoria.camera.setZoom(1.0);
    
    console.log(`Grade isométrica ${largura}x${altura} criada com sucesso!`);
    
    return {
        tamanho: size,
        largura: largura,
        altura: altura,
        totalTiles: tiles.length,
        tiles: tiles
    };
}

// Criar grade isométrica de tamanho médio por padrão
const grade = criarGradeIsometrica('medio');

// Exibir informações da grade no console
console.log('Informações da grade:', grade);