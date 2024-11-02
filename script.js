// Importação da função do arquivo api.js
import { enviarParaGemini } from './api.js';

// Variáveis globais
let accordion;
let videoStream = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    initializeAccordion();
    setupEventListeners();
});

// Inicializa o acordeon
function initializeAccordion() {
    accordion = new Accordion('.accordion-container', {
        duration: 400,
        showMultiple: true,
    });
}

// Configura os event listeners dos botões
function setupEventListeners() {
    const btnTirarFoto = document.getElementById('btnTirarFoto');
    const btnEnviarFoto = document.getElementById('btnEnviarFoto');
    const btnEnviarPrint = document.getElementById('btnEnviarPrint');
    const btnOutraQuestao = document.getElementById('btnOutraQuestao');
    const fileInput = document.getElementById('fileInput');

    btnTirarFoto.addEventListener('click', handleTirarFoto);
    btnEnviarFoto.addEventListener('click', () => fileInput.click());
    btnEnviarPrint.addEventListener('click', handleEnviarPrint);
    btnOutraQuestao.addEventListener('click', handleOutraQuestao);
    fileInput.addEventListener('change', handleFileSelect);
}

// Função para tirar foto usando a câmera
async function handleTirarFoto() {
    try {
        // Criar elementos para a câmera
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        
        const video = document.createElement('video');
        video.autoplay = true;
        
        const btnCapturar = document.createElement('button');
        btnCapturar.textContent = 'Capturar';
        btnCapturar.className = 'action-button';
        
        const btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.className = 'close-button';

        modal.appendChild(video);
        modal.appendChild(btnCapturar);
        modal.appendChild(btnFechar);
        document.body.appendChild(modal);

        // Iniciar stream da câmera
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = videoStream;

        // Event listeners para os botões
        btnCapturar.addEventListener('click', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            canvas.toBlob(async (blob) => {
                await processarFoto(new File([blob], "camera.jpg", { type: "image/jpeg" }));
                fecharCamera();
            }, 'image/jpeg');
        });

        btnFechar.addEventListener('click', fecharCamera);

    } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
}

// Função para fechar a câmera
function fecharCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const modal = document.querySelector('.camera-modal');
    if (modal) {
        modal.remove();
    }
}

// Função para lidar com prints da área de transferência
async function handleEnviarPrint() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], 'clipboard.png', { type });
                    await processarFoto(file);
                    return;
                }
            }
        }
        alert('Nenhuma imagem encontrada na área de transferência');
    } catch (error) {
        console.error('Erro ao acessar a área de transferência:', error);
        alert('Não foi possível acessar a área de transferência. Verifique as permissões.');
    }
}

// Função para lidar com seleção de arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processarFoto(file);
    }
}

// Função para lidar com o botão "Outra Questão"
function handleOutraQuestao() {
    // Limpa cache e cookies
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpa os campos de conteúdo
    document.getElementById('linksContent').innerHTML = '';
    document.getElementById('aulaContent').innerHTML = '';
    
    // Recarrega a página
    window.location.reload(true);
}

// Função principal de processamento
async function processarFoto(file) {
    try {
        showLoading();
        
        const resultado = await enviarParaGemini(file);
        exibirResultados(resultado);
        
        // Mostrar botão de outra questão
        document.getElementById('btnOutraQuestao').style.display = 'block';
    } catch (error) {
        console.error('Erro ao processar foto:', error);
        alert('Ocorreu um erro ao processar a imagem. Tente novamente.');
    } finally {
        hideLoading();
    }
}

// Função para exibir resultados
function exibirResultados(resultado) {
    const linksContent = document.getElementById('linksContent');
    const aulaContent = document.getElementById('aulaContent');

    // Usar marked para converter markdown para HTML
    linksContent.innerHTML = marked.parse(resultado.links);
    aulaContent.innerHTML = marked.parse(resultado.aula);

    // Adicionar target="_blank" em todos os links
    const allLinks = document.querySelectorAll('.ac-content a');
    allLinks.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer'); // Adiciona segurança extra
    });

    // Abrir os acordeons
    accordion.openAll();
}

// Atualize as funções de loading
function showLoading() {
    const loading = document.querySelector('.loading-container');
    loading.style.display = 'flex';
    loading.classList.add('visible');
}

function hideLoading() {
    const loading = document.querySelector('.loading-container');
    loading.classList.remove('visible');
    setTimeout(() => {
        loading.style.display = 'none';
    }, 300);
} 