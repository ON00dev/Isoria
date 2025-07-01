// Script de monitoramento e depuração para a engine Isoria

/**
 * Classe para monitoramento e depuração da engine Isoria
 * Permite rastrear eventos, performance e estado da aplicação
 */
class IsoriaDebugMonitor {
    constructor() {
        this.startTime = Date.now();
        this.events = [];
        this.maxEvents = 100; // Limitar número de eventos armazenados
        this.isActive = true;
        
        // Inicializar monitor
        this.initialize();
    }
    
    /**
     * Inicializa o monitor de depuração
     */
    initialize() {
        console.log('%c[IsoriaDebugMonitor]%c Inicializado', 'color: #4CAF50; font-weight: bold', '');
        
        // Registrar evento de inicialização
        this.trackEvent('monitor_initialized', { timestamp: this.startTime });
        
        // Verificar disponibilidade da API Isoria
        if (typeof Isoria !== 'undefined') {
            console.log('%c[IsoriaDebugMonitor]%c API Isoria detectada', 'color: #4CAF50; font-weight: bold', '');
            this.trackEvent('isoria_api_detected');
        } else {
            console.warn('%c[IsoriaDebugMonitor]%c API Isoria não disponível', 'color: #FFC107; font-weight: bold', '');
            this.trackEvent('isoria_api_missing');
        }
        
        // Iniciar monitoramento periódico
        this.startPeriodicMonitoring();
    }
    
    /**
     * Registra um evento no monitor
     * @param {string} eventName - Nome do evento
     * @param {Object} data - Dados adicionais do evento
     */
    trackEvent(eventName, data = {}) {
        if (!this.isActive) return;
        
        const event = {
            eventName,
            timestamp: Date.now(),
            timeElapsed: Date.now() - this.startTime,
            data
        };
        
        // Adicionar evento à lista
        this.events.push(event);
        
        // Limitar tamanho da lista
        if (this.events.length > this.maxEvents) {
            this.events.shift(); // Remover evento mais antigo
        }
        
        // Registrar no console se for um evento importante
        if (data.important) {
            console.log(`%c[Evento Importante]%c ${eventName}`, 'color: #2196F3; font-weight: bold', '', event);
        }
        
        // Usar API Isoria para log se disponível
        if (typeof Isoria !== 'undefined' && Isoria.utils) {
            Isoria.utils.log(`Evento: ${eventName}`, data.level || 'info');
        }
    }
    
    /**
     * Inicia monitoramento periódico de performance
     */
    startPeriodicMonitoring() {
        // Monitorar a cada 5 segundos
        this.monitorInterval = setInterval(() => {
            this.checkPerformance();
        }, 5000);
        
        console.log('%c[IsoriaDebugMonitor]%c Monitoramento periódico iniciado', 'color: #4CAF50; font-weight: bold', '');
    }
    
    /**
     * Verifica a performance atual
     */
    checkPerformance() {
        if (!this.isActive) return;
        
        // Dados de performance básicos
        const performanceData = {
            memoryUsage: window.performance && window.performance.memory ? 
                Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) : 'N/A',
            timeRunning: Math.round((Date.now() - this.startTime) / 1000)
        };
        
        // Registrar dados de performance
        this.trackEvent('performance_check', performanceData);
        
        // Exibir no console
        console.log(`%c[Performance]%c Tempo: ${performanceData.timeRunning}s | Memória: ${performanceData.memoryUsage} MB`, 
            'color: #9C27B0; font-weight: bold', '');
    }
    
    /**
     * Para o monitoramento
     */
    stop() {
        this.isActive = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        console.log('%c[IsoriaDebugMonitor]%c Monitoramento interrompido', 'color: #F44336; font-weight: bold', '');
    }
    
    /**
     * Retoma o monitoramento
     */
    resume() {
        this.isActive = true;
        this.startPeriodicMonitoring();
        console.log('%c[IsoriaDebugMonitor]%c Monitoramento retomado', 'color: #4CAF50; font-weight: bold', '');
    }
    
    /**
     * Exibe relatório de eventos no console
     */
    showReport() {
        console.group('%c[IsoriaDebugMonitor]%c Relatório de Eventos', 'color: #2196F3; font-weight: bold', '');
        console.log(`Total de eventos: ${this.events.length}`);
        console.log(`Tempo de execução: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        console.table(this.events);
        console.groupEnd();
        
        // Usar API Isoria para log se disponível
        if (typeof Isoria !== 'undefined' && Isoria.utils) {
            Isoria.utils.log(`Relatório gerado com ${this.events.length} eventos`, 'info');
        }
    }
}

// Inicializar o monitor de depuração
const debugMonitor = new IsoriaDebugMonitor();

// Registrar alguns eventos de teste
setTimeout(() => {
    debugMonitor.trackEvent('test_event_1', { value: 42, important: true, level: 'info' });
}, 1000);

setTimeout(() => {
    debugMonitor.trackEvent('test_event_2', { value: 'teste', important: false, level: 'warning' });
}, 2000);

setTimeout(() => {
    debugMonitor.trackEvent('test_event_3', { value: true, important: true, level: 'error' });
}, 3000);

// Gerar relatório após 10 segundos
setTimeout(() => {
    debugMonitor.showReport();
}, 10000);

// Exportar o monitor para uso global
window.debugMonitor = debugMonitor;

console.log('Script de monitoramento carregado. Use window.debugMonitor para acessar.');