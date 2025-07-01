// Script para forçar direção LTR (esquerda para direita) em todo o documento
// Este script garante que o texto seja sempre exibido da esquerda para direita

(function() {
    'use strict';
    
    // Função para forçar LTR em um elemento
    function forceLTR(element) {
        if (!element) return;
        
        element.style.direction = 'ltr';
        element.style.textAlign = 'left';
        element.style.unicodeBidi = 'normal';
        element.style.writingMode = 'horizontal-tb';
        element.setAttribute('dir', 'ltr');
        element.classList.remove('CodeMirror-rtl');
    }
    
    // Função para aplicar LTR a todos os elementos
    function applyLTRToAll() {
        // Forçar no documento
        document.documentElement.style.direction = 'ltr';
        document.documentElement.setAttribute('dir', 'ltr');
        document.body.style.direction = 'ltr';
        document.body.setAttribute('dir', 'ltr');
        
        // Aplicar a todos os elementos do CodeMirror
        const codeMirrorElements = document.querySelectorAll('.CodeMirror, .CodeMirror *, .cm-s-dracula, .cm-s-dracula *');
        codeMirrorElements.forEach(forceLTR);
        
        // Aplicar a elementos específicos que podem ter problemas de direção
        const problematicElements = document.querySelectorAll('textarea, pre, code, span, div');
        problematicElements.forEach(forceLTR);
    }
    
    // Aplicar LTR quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyLTRToAll);
    } else {
        applyLTRToAll();
    }
    
    // Observar mudanças no DOM para aplicar LTR a novos elementos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Se for um elemento do CodeMirror, aplicar LTR
                        if (node.classList && (node.classList.contains('CodeMirror') || 
                            node.classList.contains('cm-s-dracula') ||
                            node.querySelector && node.querySelector('.CodeMirror'))) {
                            forceLTR(node);
                            const children = node.querySelectorAll('*');
                            children.forEach(forceLTR);
                        }
                    }
                });
            }
        });
    });
    
    // Iniciar observação
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Função específica para corrigir comportamento do cursor
    function fixCursorBehavior() {
        const codeMirrorElements = document.querySelectorAll('.CodeMirror');
        codeMirrorElements.forEach(cm => {
            // Forçar configurações específicas do cursor
            const cursors = cm.querySelectorAll('.CodeMirror-cursor, .CodeMirror-cursors');
            cursors.forEach(cursor => {
                cursor.style.direction = 'ltr';
                cursor.style.unicodeBidi = 'normal';
                cursor.style.writingMode = 'horizontal-tb';
            });
            
            // Forçar configurações no elemento de medição
            const measures = cm.querySelectorAll('.CodeMirror-measure');
            measures.forEach(measure => {
                measure.style.direction = 'ltr';
                measure.style.unicodeBidi = 'normal';
                measure.style.writingMode = 'horizontal-tb';
            });
        });
    }
    
    // Aplicar força LTR e correção de cursor periodicamente
    setInterval(() => {
        applyLTRToAll();
        fixCursorBehavior();
    }, 500);
    
    console.log('Script de força LTR carregado e ativo');
})();