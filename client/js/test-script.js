// Script de teste para verificar o console.log
console.log('Teste de console.log');
console.log('Outro teste de console.log');
console.log({ objeto: 'Teste de objeto' });

// Usando a API da Isoria
Isoria.utils.log('Teste usando Isoria.utils.log');

// Criando elementos na cena
Isoria.scene.create('TestScene');
const player = Isoria.player.create(200, 200, { speed: 5 });
console.log('Player criado:', player);