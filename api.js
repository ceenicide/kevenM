import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCoM6gUnamSIPzj4V1XocZ8Ze70b-uRVLc";
const genAI = new GoogleGenerativeAI(API_KEY);

// Converte arquivo para formato aceito pelo Gemini
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type
        },
    };
}

// Prompts adaptados para funcionar com qualquer imagem
const prompt1 = `1. Liste os tópicos que a questão aborda, com um termo de pesquisa para o Youtube.
2. Liste um termo de pesquisa específico para um exercício resolvido similar.

Formatação:
- Use marcadores para listar os tópicos.
- Para cada termo de pesquisa, crie um link direto para a busca no YouTube.
- Utilize markdown para estruturar e formatar o texto.

Exemplo de estrutura:

## Tópicos Abordados
- Tópico 1
- Tópico 2

## Como encontrar exercícios resolvidos similares
- Exercício resolvido de...
- Exercício similar de...`;

const prompt2 = `Você vai ensinar uma aula completa sobre tudo o que precisa saber para resolver esse tipo de questão por conta própria.
Toda a teoria por trás da questão, mas ainda sem entrar na explicação da questão.
A aula deve ser dada usando o método Feynman, e deve ser o mais completa possível.

Ao final, adicione uma seção chamada "CheatSheet": Liste todas as fórmulas e conceitos necessários.

Formatação:
- Use Markdown para estruturar o conteúdo.
- Destaque conceitos-chave, fórmulas e passos importantes.
- Use títulos, subtítulos, listas e fórmulas quando necessário.`;

// Função principal que se comunica com a API do Gemini
export async function enviarParaGemini(file) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imagePart = await fileToGenerativePart(file);

        // Configuração do modelo
        const generationConfig = {
            temperature: 0.9,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
        };

        // Primeira solicitação - Links e tópicos
        const result1 = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt1 }, imagePart] }],
            generationConfig,
        });
        const response1 = await result1.response;

        // Segunda solicitação - Aula completa
        const result2 = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt2 }, imagePart] }],
            generationConfig,
        });
        const response2 = await result2.response;

        // Retorna objeto com ambas as respostas
        return {
            links: response1.text(),
            aula: response2.text()
        };
    } catch (error) {
        console.error('Erro na API do Gemini:', error);
        throw new Error('Falha ao processar a imagem: ' + error.message);
    }
} 