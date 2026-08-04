const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configuração de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn("⚠️ Variáveis do Supabase não configuradas!");
}

const router = express.Router();

// ROTA DE TESTE
router.get('/teste', (req, res) => {
  res.json({ 
    sucesso: true, 
    mensagem: 'API do Meu Cartão RFID funcionando!',
    timestamp: new Date().toISOString()
  });
});

// CADASTRAR
router.post('/meu-cartao/cadastrar', async (req, res) => {
  try {
    const { nome, codigoCartao, matricula } = req.body;
    if (!nome || !codigoCartao || !matricula) {
      return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios ausentes.' });
    }
    if (!supabase) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro: Conexão com banco não configurada.' });
    }
    const { data, error } = await supabase
      .from('cartoes')
      .insert([{ 
        nome_aluno: nome, 
        codigo_cartao: codigoCartao, 
        matricula: matricula,
        status: 'Ativo' 
      }])
      .select();

    if (error) throw error;
    return res.status(201).json({ sucesso: true, mensagem: 'Cartão cadastrado com sucesso!', data });
  } catch (error) {
    return res.status(500).json({ sucesso: false, mensagem: error.message });
  }
});

// CONSULTAR
router.post('/meu-cartao/consultar', async (req, res) => {
  try {
    const { codigoCartao, matricula } = req.body;
    if (!codigoCartao || !matricula) {
      return res.status(400).json({ sucesso: false, mensagem: 'Código e matrícula são obrigatórios.' });
    }
    if (!supabase) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro: Conexão com banco não configurada.' });
    }
    const { data, error } = await supabase
      .from('cartoes')
      .select('*')
      .eq('codigo_cartao', codigoCartao)
      .eq('matricula', matricula)
      .single();

    if (error || !data) {
      return res.status(404).json({ sucesso: false, mensagem: 'Cartão ou matrícula não encontrados.' });
    }
    return res.json({ sucesso: true, cartao: data });
  } catch (error) {
    return res.status(500).json({ sucesso: false, mensagem: error.message });
  }
});

// SIMULAR RADAR
router.post('/meu-cartao/simular-radar', async (req, res) => {
  try {
    const { codigoCartao, matricula, sinalRssi } = req.body;
    if (!codigoCartao || !matricula) {
      return res.status(400).json({ sucesso: false, mensagem: 'Dados insuficientes.' });
    }
    const rssi = parseInt(sinalRssi) || -60;
    const distanciaMetros = Math.max(1, Math.round(Math.pow(10, (-59 - rssi) / (10 * 2))));

    return res.json({
      sucesso: true,
      distanciaEstimadaMetros: distanciaMetros,
      sinalRssi: rssi,
      mensagem: `Sinal detectado. Distância estimada: ${distanciaMetros}m`
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, mensagem: error.message });
  }
});

// Vincula o roteador tanto na raiz quanto no prefixo /api
app.use('/api', router);
app.use('/', router);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
}
