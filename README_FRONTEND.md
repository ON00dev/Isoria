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
| Browser  | `npm run start:web`   | Roda apenas o servidor e testa via navegador |
| Desktop  | `npm run start:desktop` | Abre o Electron e carrega o jogo             |


## Estrutura de Arquivos Servidos

O servidor serve os seguintes diretórios:

- **/** - Arquivos do cliente (`client/`)
- **/assets** - Assets do jogo (`assets/`)
- **/maps** - Mapas do jogo (`maps/`)
- **/shared** - Utilitários compartilhados (`shared/`)
- **/socket.io** - Comunicação em tempo real

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

## Instalação de Dependências

Antes de executar, certifique-se de instalar as dependências:

```bash
npm install
```

## Desenvolvimento

Para desenvolvimento, use:

```bash
npm run dev
```

Este comando iniciará o servidor completo na porta 3555 com auto-reload através do nodemon.

## Arquitetura

O servidor único integra:
- **Express.js** para servir arquivos estáticos
- **Socket.IO** para comunicação em tempo real
- **Gerenciamento de Salas** para múltiplos jogadores
- **Sistema de Chat** multiplayer
- **Lógica de Jogo** isométrico tile-based