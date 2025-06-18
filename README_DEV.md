# Servidor Completo - Isoria

Este documento explica como usar o servidor único que integra tanto o frontend quanto o backend.

## Configuração

O servidor está configurado para rodar na porta **3555** no endereço **127.0.0.1**, servindo tanto os arquivos estáticos quanto as funcionalidades de Socket.IO.

### Variáveis de Ambiente

No arquivo `.env`, a porta é configurada através da variável:
```
FRONTEND_PORT=3555
```

## Instalar dependências
```bash
npm install
```

## Como Executar

| Ambiente | Comando       | Descrição                                    |
| -------- | ------------- | -------------------------------------------- |
| Browser  | `npm run start:web`   | Roda servidor via navegador |
| nodemon  | `npm run dev:web`   | Roda servidor em modo nodemon  |
| Desktop  | `npm run start:desktop` | Abre o Electron e carrega a engine             |

## URL de Acesso

- **Aplicação Completa**: http://127.0.0.1:3555

## Funcionalidades

- ✅ Serve arquivos estáticos do cliente
- ✅ Socket.IO para comunicação em tempo real
- ✅ Suporte a SPA (Single Page Application)
- ✅ CORS habilitado
- ✅ Logs de requisições
- ✅ Tratamento de erros
- ✅ Encerramento gracioso
- ✅ Gerenciamento de salas e jogadores
- ✅ Sistema de chat multiplayer

## Arquitetura

O servidor único integra:
- **Express.js** para servir arquivos estáticos
- **Socket.IO** para comunicação em tempo real
- **Gerenciamento de Salas** para múltiplos jogadores
- **Sistema de Chat** multiplayer
- **Lógica de Jogo** isométrico tile-based
