/**
 * Gerenciador de salas para o servidor
 */

// Importa os modelos e utilitários
const Room = require('../models/Room');
const Player = require('../models/Player');
const CONSTANTS = require('../../shared/constants');
const Utils = require('../../shared/utils');

/**
 * Classe que gerencia as salas do servidor
 */
class RoomManager {
    constructor() {
        this.rooms = new Map(); // Map de salas (id -> Room)
        this.defaultSpawnPoints = {
            'world': { x: 640, y: 320 } // Ponto de spawn padrão para o mapa 'world'
        };
    }

    /**
     * Cria uma nova sala
     * @param {string} name - Nome da sala
     * @param {string} mapName - Nome do mapa
     * @returns {Room} - Sala criada
     */
    createRoom(name, mapName = 'world') {
        const id = Utils.generateId();
        const room = new Room(id, name, mapName);
        this.rooms.set(id, room);
        return room;
    }

    /**
     * Remove uma sala
     * @param {string} roomId - ID da sala a ser removida
     * @returns {boolean} - true se a sala foi removida, false caso contrário
     */
    removeRoom(roomId) {
        return this.rooms.delete(roomId);
    }

    /**
     * Obtém uma sala pelo ID
     * @param {string} roomId - ID da sala
     * @returns {Room|null} - Sala encontrada ou null se não encontrada
     */
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    /**
     * Obtém todas as salas
     * @returns {Array} - Array de salas
     */
    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    /**
     * Obtém uma sala disponível ou cria uma nova se necessário
     * @param {string} mapName - Nome do mapa
     * @returns {Room} - Sala disponível
     */
    getAvailableRoom(mapName = 'world') {
        // Procura por uma sala disponível com o mesmo mapa
        for (const room of this.rooms.values()) {
            if (room.mapName === mapName && !room.isFull()) {
                return room;
            }
        }

        // Cria uma nova sala se não encontrar uma disponível
        return this.createRoom(`Sala ${this.rooms.size + 1}`, mapName);
    }

    /**
     * Adiciona um jogador a uma sala
     * @param {string} roomId - ID da sala
     * @param {string} playerId - ID do jogador
     * @param {string} playerName - Nome do jogador
     * @param {string} character - Tipo de personagem
     * @returns {Object|null} - Informações do jogador adicionado ou null se falhar
     */
    addPlayerToRoom(roomId, playerId, playerName, character) {
        const room = this.getRoom(roomId);
        if (!room || room.isFull()) return null;

        // Obtém o ponto de spawn para o mapa da sala
        const spawnPoint = this.getSpawnPoint(room.mapName);

        // Cria o jogador
        const player = new Player(playerId, playerName, character, spawnPoint.x, spawnPoint.y);

        // Adiciona o jogador à sala
        if (room.addPlayer(player)) {
            return {
                player: player,
                room: room
            };
        }

        return null;
    }

    /**
     * Remove um jogador de uma sala
     * @param {string} roomId - ID da sala
     * @param {string} playerId - ID do jogador
     * @returns {Player|null} - Jogador removido ou null se não encontrado
     */
    removePlayerFromRoom(roomId, playerId) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        const player = room.removePlayer(playerId);

        // Remove a sala se estiver vazia
        if (room.isEmpty()) {
            this.removeRoom(roomId);
        }

        return player;
    }

    /**
     * Obtém um ponto de spawn para um mapa
     * @param {string} mapName - Nome do mapa
     * @returns {Object} - Coordenadas do ponto de spawn {x, y}
     */
    getSpawnPoint(mapName) {
        // Retorna o ponto de spawn padrão para o mapa ou um ponto padrão
        return this.defaultSpawnPoints[mapName] || { x: 0, y: 0 };
    }

    /**
     * Processa um ataque em uma sala
     * @param {string} roomId - ID da sala
     * @param {string} playerId - ID do jogador atacante
     * @returns {Array} - Array de jogadores atingidos e informações de dano
     */
    processAttackInRoom(roomId, playerId) {
        const room = this.getRoom(roomId);
        if (!room) return [];

        return room.processAttack(playerId);
    }

    /**
     * Adiciona uma mensagem ao chat de uma sala
     * @param {string} roomId - ID da sala
     * @param {string} playerId - ID do jogador
     * @param {string} message - Conteúdo da mensagem
     * @returns {Object|null} - Informações da mensagem ou null se falhar
     */
    addChatMessageToRoom(roomId, playerId, message) {
        const room = this.getRoom(roomId);
        if (!room) return null;

        return room.addChatMessage(playerId, message);
    }

    /**
     * Obtém o estado de todas as salas
     * @returns {Array} - Array com o estado de todas as salas
     */
    getAllRoomsState() {
        const roomsState = [];
        
        this.rooms.forEach((room) => {
            roomsState.push(room.getState());
        });

        return roomsState;
    }
}

module.exports = RoomManager;