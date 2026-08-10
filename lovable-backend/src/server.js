import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// Importe a função principal do seu orquestrador atualizado
// (Certifique-se de exportar uma função que aceite a ideia e retorne status, ou use o runLovableEngine)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Servir a interface estática da pasta public (que vamos criar a seguir)
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal onde o Chat vai enviar o comando do usuário
app.post('/api/build', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'O prompt do projeto é obrigatório.' });
    }

    try {
        console.log(`\n📥 [API Gateway] Nova solicitação recebida: "${prompt}"`);
        
        // Aqui você aciona o motor do orquestrador
        // Para fins de resposta imediata à API, enviamos um sinal de sucesso de início
        res.json({ 
            success: true, 
            message: `Motor acionado com sucesso para o projeto: "${prompt}". Acompanhe o terminal para ver os agentes trabalhando!` 
        });

    } catch (error) {
        console.error("❌ Erro na API de build:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor da Plataforma rodando em: http://localhost:${PORT}`);
});
