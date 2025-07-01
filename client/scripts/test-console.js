// Script de teste para verificar a exibição de mensagens no console

// Função para testar diferentes tipos de mensagens de console
function testarConsole() {
    console.log('=== Teste de Console Isoria ===');
    
    // Mensagens simples para o console
    console.log('Teste de mensagem normal no console');
    console.warn('Teste de aviso no console');
    console.error('Teste de erro no console');
    
    // Mensagens com formatação
    console.log('Mensagem com %cnegrito%c e %ccor', 'font-weight: bold', '', 'color: blue');
    
    // Mensagens com objetos
    console.log('Objeto:', { nome: 'Teste', valor: 123, ativo: true });
    
    // Array
    console.log('Array:', [1, 2, 3, 'teste', { a: 1, b: 2 }]);
    
    // Mensagens usando a API Isoria
    if (typeof Isoria !== 'undefined' && Isoria.utils) {
        console.log('Testando API Isoria:');
        Isoria.utils.log('Mensagem usando Isoria.utils.log', 'info');
        
        // Testar diferentes tipos de mensagens
        setTimeout(() => {
            Isoria.utils.log('Mensagem de informação', 'info');
        }, 500);
        
        setTimeout(() => {
            Isoria.utils.log('Mensagem de sucesso', 'success');
        }, 1000);
        
        setTimeout(() => {
            Isoria.utils.log('Mensagem de aviso', 'warning');
        }, 1500);
        
        setTimeout(() => {
            Isoria.utils.log('Mensagem de erro', 'error');
        }, 2000);
    } else {
        console.warn('API Isoria não disponível');
    }
}

// Executar o teste imediatamente
testarConsole();

// Adicionar mensagens após um pequeno atraso para garantir que sejam exibidas
setTimeout(() => {
    console.log('Mensagem após delay de 1 segundo');
}, 1000);

setTimeout(() => {
    console.log('Mensagem após delay de 3 segundos');
    console.log('Teste de console concluído!');
}, 3000);