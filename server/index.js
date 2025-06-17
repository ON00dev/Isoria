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

// Middleware para logs de requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Configura o diretório estático para servir os arquivos do cliente
app.use(express.static(path.join(__dirname, '../client')));

// Configura o diretório de assets
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Configura o diretório de mapas
app.use('/maps', express.static(path.join(__dirname, '../maps')));

// Configura o diretório shared para acessar constantes e utilitários
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Rota principal - serve o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Rota para servir o index.html em qualquer rota (SPA support)
app.get('*', (req, res, next) => {
    // Verifica se é uma requisição para um arquivo estático
    if (req.url.includes('.') || req.url.startsWith('/socket.io')) {
        next();
    } else {
        res.sendFile(path.join(__dirname, '../client/index.html'));
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
server.listen(PORT, '127.0.0.1', () => {
    console.log(`[Servidor] Aplicação completa rodando em http://127.0.0.1:${PORT}`);
    console.log(`[Servidor] Servindo arquivos do diretório: ${path.join(__dirname, '../client')}`);
    console.log(`[Servidor] Socket.IO habilitado para comunicação em tempo real`);
});

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