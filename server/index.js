/**
 * Servidor principal da engine de jogos isométricos
 */

// Importa as dependências
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');

// Importa os gerenciadores e utilitários
const RoomManager = require('./managers/RoomManager');
const CONSTANTS = require('../shared/constants');
const Utils = require('../shared/utils');

// Carrega as variáveis de ambiente
dotenv.config();

// Cria o servidor Express
const app = express();
const server = http.createServer(app);

// Configura o CORS
app.use(cors());

// Middleware para desabilitar cache
app.use((req, res, next) => {
    // Desabilitar cache para todas as requisições
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// Middleware para redirecionar requisições de /assets/pack/ para /assets/svgs/
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`Referer: ${req.get('Referer') || 'Nenhum'}`);
    console.log(`User-Agent: ${req.get('User-Agent') || 'Nenhum'}`);
    if (req.url.includes('/assets/pack/')) {
        console.log('Requisição para /assets/pack/ detectada!');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        // Redirecionar para a nova localização
        const fileName = req.url.split('/assets/pack/')[1];
        if (fileName) {
            console.log(`Redirecionando requisição de /assets/pack/${fileName} para /assets/svgs/${fileName}`);
            return res.redirect(`/assets/svgs/${fileName}?t=${Date.now()}`);
        } else {
            // Se não houver nome de arquivo, redirecionar para a lista de SVGs
            console.log('Redirecionando requisição de /assets/pack/ para /api/assets/svg');
            return res.redirect(`/api/assets/svg?t=${Date.now()}`);
        }
    }
    if (req.url.includes('/api/assets/svg')) {
        console.log('Requisição para /api/assets/svg detectada!');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
    }
    next();
});

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/assets/uploads');
        // Criar diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único para o arquivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Aceitar apenas SVG, JPG, JPEG e PNG
        const allowedTypes = ['image/svg+xml', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos SVG, JPG e PNG são permitidos'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Endpoint para upload de assets
app.post('/api/upload-asset', upload.single('asset'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
        }
        
        const filePath = `/assets/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Arquivo enviado com sucesso',
            path: filePath,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
        
        console.log(`Arquivo enviado: ${req.file.originalname} -> ${req.file.filename}`);
        
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Configura o diretório estático para servir os arquivos do cliente
app.use(express.static(path.join(__dirname, '../client')));

// Configura o diretório estático para servir os arquivos públicos
app.use(express.static(path.join(__dirname, '../public')));

// Removemos a rota estática para /assets/pack/ para forçar o uso da API

// Configura o diretório de assets, excluindo a pasta pack
app.use('/assets', (req, res, next) => {
    // Se a requisição for para a pasta pack, bloqueamos
    if (req.url.startsWith('/pack/')) {
        console.log('Bloqueando acesso direto a /assets/pack/', req.url);
        return res.status(404).json({ error: 'Esta pasta agora é acessível apenas via API' });
    }
    // Para outras pastas de assets, permitimos o acesso normalmente
    next();
}, express.static(path.join(__dirname, '../assets')));

// Rota para listar arquivos SVG na pasta pública
app.get('/api/assets/svg', (req, res) => {
    const svgsDir = path.join(__dirname, '../public/assets/svgs');
    const fs = require('fs');
    
    fs.readdir(svgsDir, (err, files) => {
        if (err) {
            console.error('Erro ao ler diretório de SVGs:', err);
            return res.status(500).json({ error: 'Erro ao ler diretório de SVGs' });
        }
        
        // Filtrar apenas arquivos SVG
        const svgFiles = files.filter(file => file.toLowerCase().endsWith('.svg'));
        
        // Retornar lista de arquivos SVG apenas com os nomes dos arquivos
        const svgList = svgFiles.map(file => ({
            name: file.replace('.svg', ''),
            path: `/assets/svgs/${file}`
        }));
        
        res.json(svgList);
    });
});

// Rota para obter o conteúdo de um arquivo SVG específico
app.get('/api/assets/svg/:filename', (req, res) => {
    const filename = req.params.filename;
    
    console.log(`[API] Requisição para SVG filename: ${filename}`);
    console.log(`[API] Query params:`, req.query);
    
    // Redirecionar para o arquivo estático na pasta pública
    res.redirect(`/assets/svgs/${filename}`);
});

// Configura o diretório de mapas
app.use('/maps', express.static(path.join(__dirname, '../maps')));

// Configura o diretório shared para acessar constantes e utilitários
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Rota principal - serve o engine-tools.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/engine-tools.html'));
});

// Rota para servir o engine-tools.html em qualquer rota (SPA support)
app.get('*', (req, res, next) => {
    // Verifica se é uma requisição para um arquivo estático
    if (req.url.includes('.') || req.url.startsWith('/socket.io')) {
        next();
    } else {
        res.sendFile(path.join(__dirname, '../client/engine-tools.html'));
    }
});

// Configura o Socket.IO
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Cria o gerenciador de salas
const roomManager = new RoomManager();

// Cria uma sala padrão
const defaultRoom = roomManager.createRoom('Sala Principal', 'world');

// Mapa de sockets para salas
const socketRooms = new Map();

// Evento de conexão de um cliente
io.on('connection', (socket) => {
    console.log(`Novo cliente conectado: ${socket.id}`);

    // Evento de entrada no jogo
    socket.on(CONSTANTS.SOCKET_EVENTS.JOIN_GAME, (data) => {
        try {
            // Valida os dados recebidos
            if (!data.playerName || !data.character) {
                socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, {
                    message: 'Nome do jogador e personagem são obrigatórios'
                });
                return;
            }

            // Obtém uma sala disponível ou usa a sala especificada
            const roomId = data.roomId || defaultRoom.id;
            const room = roomManager.getRoom(roomId) || defaultRoom;

            // Adiciona o jogador à sala
            const result = roomManager.addPlayerToRoom(
                room.id,
                socket.id,
                data.playerName,
                data.character
            );

            if (!result) {
                socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, {
                    message: 'Não foi possível entrar na sala'
                });
                return;
            }

            // Armazena a sala do socket
            socketRooms.set(socket.id, room.id);

            // Entra na sala do Socket.IO
            socket.join(room.id);

            // Envia o estado atual do jogo para o jogador
            socket.emit(CONSTANTS.SOCKET_EVENTS.GAME_STATE, room.getState());

            // Notifica os outros jogadores sobre o novo jogador
            socket.to(room.id).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_JOINED, result.player.toJSON());

            console.log(`Jogador ${data.playerName} entrou na sala ${room.name}`);
        } catch (error) {
            console.error('Erro ao entrar no jogo:', error);
            socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, {
                message: 'Erro ao entrar no jogo'
            });
        }
    });

    // Evento de movimento do jogador
    socket.on(CONSTANTS.SOCKET_EVENTS.PLAYER_MOVEMENT, (data) => {
        try {
            // Obtém a sala do jogador
            const roomId = socketRooms.get(socket.id);
            if (!roomId) return;

            const room = roomManager.getRoom(roomId);
            if (!room) return;

            // Obtém o jogador
            const player = room.getPlayer(socket.id);
            if (!player || player.isDead) return;

            // Atualiza a posição do jogador
            player.updatePosition(data.x, data.y, data.direction, data.state);

            // Notifica os outros jogadores sobre o movimento
            socket.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_MOVED, {
                id: socket.id,
                x: player.x,
                y: player.y,
                direction: player.direction,
                state: player.state
            });
        } catch (error) {
            console.error('Erro ao processar movimento:', error);
        }
    });

    // Evento de ataque do jogador
    socket.on(CONSTANTS.SOCKET_EVENTS.PLAYER_ATTACK, () => {
        try {
            // Obtém a sala do jogador
            const roomId = socketRooms.get(socket.id);
            if (!roomId) return;

            // Processa o ataque na sala
            const hitPlayers = roomManager.processAttackInRoom(roomId, socket.id);
            if (hitPlayers.length === 0) return;

            // Obtém a sala
            const room = roomManager.getRoom(roomId);
            if (!room) return;

            // Obtém o jogador atacante
            const attacker = room.getPlayer(socket.id);
            if (!attacker) return;

            // Notifica todos os jogadores sobre o ataque
            io.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_ATTACKED, {
                id: socket.id,
                x: attacker.x,
                y: attacker.y,
                direction: attacker.direction
            });

            // Processa os jogadores atingidos
            hitPlayers.forEach(({ player, damageInfo }) => {
                // Notifica todos os jogadores sobre o dano
                io.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_HIT, {
                    id: player.id,
                    attackerId: socket.id,
                    damage: damageInfo.damage,
                    newHp: damageInfo.newHp
                });

                // Se o jogador morreu, notifica todos
                if (damageInfo.isDead) {
                    io.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_DIED, {
                        id: player.id,
                        attackerId: socket.id
                    });

                    // Inicia o respawn do jogador
                    player.startRespawn((respawnedPlayer) => {
                        // Notifica todos sobre o respawn
                        io.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_RESPAWNED, {
                            id: respawnedPlayer.id,
                            x: respawnedPlayer.x,
                            y: respawnedPlayer.y,
                            hp: respawnedPlayer.hp
                        });
                    });
                }
            });
        } catch (error) {
            console.error('Erro ao processar ataque:', error);
        }
    });

    // Evento de mensagem de chat
    socket.on(CONSTANTS.SOCKET_EVENTS.CHAT_MESSAGE, (data) => {
        try {
            // Valida os dados recebidos
            if (!data.message || typeof data.message !== 'string') return;

            // Limita o tamanho da mensagem
            const message = data.message.trim().substring(0, 200);
            if (message.length === 0) return;

            // Obtém a sala do jogador
            const roomId = socketRooms.get(socket.id);
            if (!roomId) return;

            // Adiciona a mensagem ao chat da sala
            const chatMessage = roomManager.addChatMessageToRoom(roomId, socket.id, message);
            if (!chatMessage) return;

            // Notifica todos os jogadores da sala sobre a nova mensagem
            io.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, chatMessage);
        } catch (error) {
            console.error('Erro ao processar mensagem de chat:', error);
        }
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
        try {
            // Obtém a sala do jogador
            const roomId = socketRooms.get(socket.id);
            if (!roomId) return;

            // Remove o jogador da sala
            const player = roomManager.removePlayerFromRoom(roomId, socket.id);
            if (!player) return;

            // Remove a sala do socket
            socketRooms.delete(socket.id);

            // Notifica os outros jogadores sobre a saída
            io.to(roomId).emit(CONSTANTS.SOCKET_EVENTS.PLAYER_LEFT, {
                id: socket.id
            });

            console.log(`Jogador ${player.name} saiu da sala ${roomId}`);
        } catch (error) {
            console.error('Erro ao processar desconexão:', error);
        }
    });
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('[Servidor] Erro:', err.stack);
    res.status(500).send('Erro interno do servidor');
});

// Inicia o servidor
const PORT = process.env.FRONTEND_PORT || 3555;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`[Servidor] Rodando em:`);
    console.log(`  - Local: http://127.0.0.1:${PORT}`);
    console.log(`  - Rede: http://${getLocalIP()}:${PORT}`);
    console.log(`  - Mobile: Acesse o IP da rede no seu dispositivo móvel`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Servidor] Porta ${PORT} já está em uso.`);
    } else {
      throw err;
    }
  });

// Função para obter o IP local da máquina
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = {};
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Pular endereços internos (localhost) e não IPv4
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    
    // Retornar o primeiro IP encontrado ou localhost como fallback
    const firstInterface = Object.keys(results)[0];
    return firstInterface ? results[firstInterface][0] : '127.0.0.1';
}

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n[Servidor] Encerrando servidor...');
    server.close(() => {
        console.log('[Servidor] Servidor encerrado com sucesso');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n[Servidor] Encerrando servidor...');
    server.close(() => {
        console.log('[Servidor] Servidor encerrado com sucesso');
        process.exit(0);
    });
});

// Middleware para parsing JSON
app.use(express.json());

// Rotas da API para a engine
app.get('/api/scene/current', (req, res) => {
    // Retornar dados da cena atual
    res.json({
        name: 'Main Scene',
        objects: [
            { id: 'main-camera', name: 'Main Camera', type: 'camera', position: [0, 5, 10] },
            { id: 'ambient-light', name: 'Ambient Light', type: 'light', position: [0, 0, 0] },
            { id: 'directional-light', name: 'Directional Light', type: 'light', position: [10, 10, 5] }
        ]
    });
});

app.post('/api/scene/save', (req, res) => {
    // Salvar dados da cena
    console.log('Salvando cena:', req.body);
    res.json({ success: true });
});

app.get('/api/assets', (req, res) => {
    // Retornar lista de assets
    res.json([
        { id: 'default-material', name: 'Default Material', type: 'material', icon: '<i class="fi fi-tr-folder-archive"></i>' },
        { id: 'default-texture', name: 'Default Texture', type: 'texture', icon: '<i class="fi fi-ss-mode-landscape"></i>' }
    ]);
});

app.get('/api/project/current', (req, res) => {
    // Retornar dados do projeto atual
    res.json({
        name: 'Isoria Project',
        scenes: ['Main Scene'],
        assets: [],
        scripts: []
    });
});

app.post('/api/project/save', (req, res) => {
    // Salvar projeto
    console.log('Salvando projeto:', req.body);
    res.json({ success: true });
});