const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de diagnóstico - acesse http://localhost:3000/health no navegador
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'MongoDB conectado' : 'Modo memória (sem MongoDB)';
    res.status(200).json({
        status: 'ok',
        message: 'EcoUrbano Online!',
        banco_de_dados: dbStatus,
        timestamp: new Date().toLocaleString('pt-BR')
    });
});

// Conexão ao MongoDB. Use um banco local ou na nuvem (Atlas)
// Para funcionar 100% locamente se não houver MongoDB, 
// instrua o usuário a instalar o MongoDB Community Server.
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecourbano';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao Banco de Dados MongoDB com Sucesso.'))
.catch(err => {
    console.error('Erro de conexão ao MongoDB:', err.message);
    console.log('\n--- AVISO ---');
    console.log('Se você não tem o MongoDB instalado, as ocorrências ficarão apenas em memória temporária.');
});

// Modelagem de Ocorrência Ambiental
const ocorrenciaSchema = new mongoose.Schema({
    tipo: String,
    descricao: String,
    latitude: Number,
    longitude: Number,
    assinatura_biometrica: Boolean,
    data_criacao: { type: Date, default: Date.now }
});

const Ocorrencia = mongoose.model('Ocorrencia', ocorrenciaSchema);

// Fallback array em memória caso o MongoDB não esteja rodando na máquina do usuário
let fallbackOcorrencias = [];

// Rota de Inserção de Ocorrência (Recebe POST do App Móvel)
app.post('/api/v1/ocorrencias', async (req, res) => {
    try {
        const { tipo, descricao, latitude, longitude, assinatura_biometrica_aparelho } = req.body;

        if (!assinatura_biometrica_aparelho) {
            return res.status(403).json({ erro: "Assinatura Biométrica Ausente!" });
        }

        console.log(`[API] Nova Denúncia Recebida: ${tipo} | Lat: ${latitude} / Lng: ${longitude}`);

        try {
            if (mongoose.connection.readyState === 1) {
                const nova = new Ocorrencia({ tipo, descricao, latitude, longitude, assinatura_biometrica: assinatura_biometrica_aparelho });
                await nova.save();
            } else {
                fallbackOcorrencias.push({ tipo, descricao, latitude, longitude, assinatura_biometrica: assinatura_biometrica_aparelho, data_criacao: new Date() });
            }
        } catch(e) {
            fallbackOcorrencias.push({ tipo, descricao, latitude, longitude, assinatura_biometrica: assinatura_biometrica_aparelho, data_criacao: new Date() });
        }

        res.status(201).json({ sucesso: true, mensagem: "Ocorrência Registrada." });
    } catch (err) {
        res.status(500).json({ erro: "Erro interno no Servidor." });
    }
});

// Rota de Sincronização (Busca as ocorrências para o App desenhar os pinos no mapa)
app.get('/api/v1/ocorrencias', async (req, res) => {
    try {
        let dados = [];
        if (mongoose.connection.readyState === 1) {
            dados = await Ocorrencia.find().sort({ data_criacao: -1 }).limit(100);
        } else {
            dados = fallbackOcorrencias;
        }
        res.status(200).json({ sucesso: true, dados: dados });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar dados." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=== ECOURBANO SERVIDOR DISTRIBUÍDO INICIADO ===`);
    console.log(`Rodando em: http://0.0.0.0:${PORT}`);
    console.log(`Aguardando conexões do App Móvel React Native...`);
});
