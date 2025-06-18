# Isoria Game Engine

Engine web para desenvolvimento de jogos isométricos tile-based multiplayer online

## 🌐 Versão Web Pura

O Isoria Engine agora é uma aplicação web pura que utiliza a **File System Access API** para operações de arquivo locais, eliminando a necessidade do Electron.

### Funcionalidades de Arquivo

- **Criar/Abrir/Salvar projetos** diretamente no sistema de arquivos local
- **Importar assets** (SVG, PNG, JPG, JSON) com drag & drop
- **Exportar projetos** em formato JSON
- **Abrir pastas de projeto** para acesso completo aos arquivos
- **Fallback automático** para navegadores sem suporte à File System Access API

Isoria é uma engine completa para desenvolvimento de jogos isométricos tile-based com suporte a multiplayer online. Desenvolvida com tecnologias web modernas, a engine oferece todas as ferramentas necessárias para criar jogos isométricos multiplayer de forma simples e eficiente.

## Tecnologias Utilizadas

### Frontend
- **Phaser.js**: Para renderização e lógica de jogo no cliente
- **HTML5 + CSS3 + Canvas**: Para interface e gráficos
- **JavaScript**: Para scripts e interações adicionais

### Backend
- **Node.js**: Para servidor
- **Express**: Para servir arquivos e rotas HTTP
- **Socket.io**: Para comunicação em tempo real via WebSocket

## Funcionalidades

- **Mapa Isométrico Tile-Based**
  - Sistema robusto de mapas isométricos com tiles
  - Carregamento dinâmico de mapas a partir de arquivos JSON ou TMX
  - Suporte a colisões, camadas (layers) e objetos no mapa

- **Criação de Personagens Jogáveis**
  - Sistema de criação e customização de personagens
  - Sprites animados com movimento nas quatro direções isométricas
  - Atributos como nome, skin, posição, status

- **Pathfinding com Algoritmo A***
  - Implementação de pathfinding A* para movimentação dos personagens
  - Cálculo de caminhos considerando colisões e obstáculos do mapa

- **Multiplayer Online**
  - Conexão e desconexão de jogadores
  - Sincronização de posição e status em tempo real
  - Criação e gerenciamento de salas (ou mundos compartilhados)
  - Persistência temporária de dados dos jogadores online

- **Interação entre Jogadores**
  - Sistema de chat em tempo real via WebSocket
  - Visualização em tempo real dos outros jogadores no mapa
  - Movimentação sincronizada e interações básicas

- **Sistema de Combate PvP**
  - Ataques entre jogadores (range ou melee)
  - Sistema de pontos de vida (HP)
  - Detecção de colisões para ataques
  - Atualização em tempo real do status de combate
  - Sistema de respawn ou desconexão após morte

- **Renderização da Interface (UI)**
  - Interface responsiva com HTML5 e CSS3
  - Painéis de status (HP, nome, chat)
  - Botões de ação (atacar, interagir, inventário, sair)
  - Feedback visual para interações e eventos

## Estrutura do Projeto

```
/client         → Frontend com Phaser.js + HTML/CSS
/server         → Backend com Node.js + Express + Socket.io
/assets         → Imagens, sprites, tilesets, sons
/maps           → Arquivos JSON dos mapas tile-based
/shared         → Código compartilhado (constantes, algoritmos, regras)
```

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/isoria.git
cd isoria
```
Veja mais detalhes no [README_DEV](./README_DEV.md)

## Licença

[MIT](./LICENSE)