/**
 * File System Access API Utilities
 * Permite criar, salvar, abrir e editar arquivos locais com permissão do usuário
 */

class FileSystemAPI {
    constructor() {
        this.isSupported = 'showOpenFilePicker' in window;
        this.currentFileHandle = null;
    }

    /**
     * Verifica se a File System Access API é suportada
     */
    isFileSystemAccessSupported() {
        return this.isSupported;
    }

    /**
     * Abre um arquivo do sistema
     * @param {Object} options - Opções para o seletor de arquivo
     * @returns {Promise<{content: string, handle: FileSystemFileHandle}>}
     */
    async openFile(options = {}) {
        if (!this.isSupported) {
            throw new Error('File System Access API não é suportada neste navegador');
        }

        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Arquivos de projeto',
                    accept: {
                        'application/json': ['.json'],
                        'text/plain': ['.txt'],
                        'image/svg+xml': ['.svg'],
                        ...options.accept
                    }
                }],
                ...options
            });

            const file = await fileHandle.getFile();
            const content = await file.text();
            
            this.currentFileHandle = fileHandle;
            
            return {
                content,
                handle: fileHandle,
                name: file.name,
                size: file.size,
                lastModified: file.lastModified
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Operação cancelada pelo usuário');
            }
            throw error;
        }
    }

    /**
     * Salva conteúdo em um arquivo
     * @param {string} content - Conteúdo a ser salvo
     * @param {Object} options - Opções para salvar
     * @returns {Promise<FileSystemFileHandle>}
     */
    async saveFile(content, options = {}) {
        if (!this.isSupported) {
            throw new Error('File System Access API não é suportada neste navegador');
        }

        try {
            let fileHandle;
            
            if (options.useCurrentHandle && this.currentFileHandle) {
                fileHandle = this.currentFileHandle;
            } else {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: options.suggestedName || 'arquivo.json',
                    types: [{
                        description: 'Arquivos de projeto',
                        accept: {
                            'application/json': ['.json'],
                            'text/plain': ['.txt'],
                            'image/svg+xml': ['.svg'],
                            ...options.accept
                        }
                    }],
                    ...options
                });
                
                this.currentFileHandle = fileHandle;
            }

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            return fileHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Operação cancelada pelo usuário');
            }
            throw error;
        }
    }

    /**
     * Salva como novo arquivo (sempre abre o diálogo)
     * @param {string} content - Conteúdo a ser salvo
     * @param {Object} options - Opções para salvar
     * @returns {Promise<FileSystemFileHandle>}
     */
    async saveAsFile(content, options = {}) {
        return this.saveFile(content, { ...options, useCurrentHandle: false });
    }

    /**
     * Salva no arquivo atual (se existir)
     * @param {string} content - Conteúdo a ser salvo
     * @returns {Promise<FileSystemFileHandle>}
     */
    async saveCurrentFile(content) {
        if (!this.currentFileHandle) {
            throw new Error('Nenhum arquivo atual definido. Use saveAsFile() primeiro.');
        }
        
        return this.saveFile(content, { useCurrentHandle: true });
    }

    /**
     * Abre múltiplos arquivos
     * @param {Object} options - Opções para o seletor
     * @returns {Promise<Array>}
     */
    async openMultipleFiles(options = {}) {
        if (!this.isSupported) {
            throw new Error('File System Access API não é suportada neste navegador');
        }

        try {
            const fileHandles = await window.showOpenFilePicker({
                multiple: true,
                types: [{
                    description: 'Arquivos de projeto',
                    accept: {
                        'application/json': ['.json'],
                        'text/plain': ['.txt'],
                        'image/svg+xml': ['.svg'],
                        ...options.accept
                    }
                }],
                ...options
            });

            const files = [];
            for (const fileHandle of fileHandles) {
                const file = await fileHandle.getFile();
                const content = await file.text();
                
                files.push({
                    content,
                    handle: fileHandle,
                    name: file.name,
                    size: file.size,
                    lastModified: file.lastModified
                });
            }

            return files;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Operação cancelada pelo usuário');
            }
            throw error;
        }
    }

    /**
     * Abre um diretório
     * @param {Object} options - Opções para o seletor
     * @returns {Promise<FileSystemDirectoryHandle>}
     */
    async openDirectory(options = {}) {
        if (!this.isSupported) {
            throw new Error('File System Access API não é suportada neste navegador');
        }

        try {
            const directoryHandle = await window.showDirectoryPicker(options);
            return directoryHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Operação cancelada pelo usuário');
            }
            throw error;
        }
    }

    /**
     * Lista arquivos em um diretório
     * @param {FileSystemDirectoryHandle} directoryHandle
     * @returns {Promise<Array>}
     */
    async listDirectoryFiles(directoryHandle) {
        const files = [];
        
        for await (const [name, handle] of directoryHandle.entries()) {
            if (handle.kind === 'file') {
                const file = await handle.getFile();
                files.push({
                    name,
                    handle,
                    size: file.size,
                    lastModified: file.lastModified,
                    type: file.type
                });
            }
        }
        
        return files;
    }

    /**
     * Obtém informações do arquivo atual
     * @returns {Object|null}
     */
    getCurrentFileInfo() {
        if (!this.currentFileHandle) {
            return null;
        }
        
        return {
            name: this.currentFileHandle.name,
            kind: this.currentFileHandle.kind
        };
    }

    /**
     * Limpa a referência do arquivo atual
     */
    clearCurrentFile() {
        this.currentFileHandle = null;
    }

    /**
     * Fallback para navegadores sem suporte à File System Access API
     * @param {string} content - Conteúdo do arquivo
     * @param {string} filename - Nome do arquivo
     * @param {string} mimeType - Tipo MIME
     */
    downloadFile(content, filename, mimeType = 'application/json') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Fallback para upload de arquivos
     * @param {Object} options - Opções do input
     * @returns {Promise<Array>}
     */
    uploadFile(options = {}) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options.multiple || false;
            input.accept = options.accept || '.json,.txt,.svg';
            
            input.onchange = async (event) => {
                try {
                    const files = Array.from(event.target.files);
                    const results = [];
                    
                    for (const file of files) {
                        const content = await file.text();
                        results.push({
                            content,
                            name: file.name,
                            size: file.size,
                            lastModified: file.lastModified,
                            type: file.type
                        });
                    }
                    
                    resolve(options.multiple ? results : results[0]);
                } catch (error) {
                    reject(error);
                }
            };
            
            input.oncancel = () => {
                reject(new Error('Operação cancelada pelo usuário'));
            };
            
            input.click();
        });
    }
}

// Instância global
const fileSystemAPI = new FileSystemAPI();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileSystemAPI;
}

// Disponibilizar globalmente
window.FileSystemAPI = FileSystemAPI;
window.fileSystemAPI = fileSystemAPI;