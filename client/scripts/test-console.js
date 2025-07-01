// Script de teste para verificar a exibição de mensagens no console

// Função para testar diferentes tipos de mensagens de console
function testarConsole() {
    // Mensagens simples para o console
    console.log('Teste de mensagem no console');
    console.warn('Teste de aviso no console');
    console.error('Teste de erro no console');
    
    // Mensagens usando a API Isoria
    if (Isoria && Isoria.utils) {
        Isoria.utils.log('Mensagem usando Isoria.utils.log', 'info');
    }
}

// Executar o teste imediatamente
testarConsole();

// Adicionar mensagem após um pequeno atraso para garantir que seja exibida
setTimeout(() => {
    console.log('Mensagem após delay de 1 segundo');
}, 1000);