const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ======================================================
// CORS
// ======================================================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// ======================================================
// CONFIGURAÇÃO DO SUPABASE
// ======================================================
const SUPABASE_URL = 'https://iaswcbzdnmarfhhafkdb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EmxeR2B2op4YsGrMNcKJ5Q_2IYfh9Gt';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 API INICIADA NO VERCEL');

// ======================================================
// ROTA DE TESTE
// ======================================================
app.get('/api/teste', (req, res) => {
  res.json({ 
    sucesso: true, 
    mensagem: '✅ API funcionando na Vercel!',
    hora: new Date().toISOString()
  });
});

// ======================================================
// LOCAIS
// ======================================================
const locais = {
  "Centro - Sorocaba/SP": { lat: -23.5015, lng: -47.4581 },
  "Biblioteca - SENAI": { lat: -23.5020, lng: -47.4595 },
  "Refeitório - SESI": { lat: -23.5010, lng: -47.4570 },
  "Laboratório de Informática": { lat: -23.5025, lng: -47.4588 },
  "Sala 301 - Bloco B": { lat: -23.5030, lng: -47.4590 },
  "Área de Convivência": { lat: -23.5005, lng: -47.4575 },
  "Secretaria Acadêmica": { lat: -23.5018, lng: -47.4585 },
  "Estacionamento": { lat: -23.5000, lng: -47.4560 },
  "Ginásio de Esportes": { lat: -23.5028, lng: -47.4565 },
  "Auditório Principal": { lat: -23.5012, lng: -47.4580 }
};

function getLocalAleatorio() {
  const nomes = Object.keys(locais);
  const nome = nomes[Math.floor(Math.random() * nomes.length)];
  return { nome, coordenadas: locais[nome] };
}

// ======================================================
// CADASTRAR
// ======================================================
app.post('/api/meu-cartao/cadastrar', async (req, res) => {
  console.log('📝 CADASTRO:', req.body);
  const { nome, matricula, codigoCartao } = req.body;

  if (!nome || !codigoCartao || !matricula) {
    return res.status(400).json({ 
      sucesso: false,
      erro: "Preencha todos os campos." 
    });
  }

  try {
    const { data: existente } = await supabase
      .from('cartoes')
      .select('codigo_cartao')
      .eq('codigo_cartao', codigoCartao)
      .maybeSingle();

    if (existente) {
      return res.status(400).json({
        sucesso: false,
        erro: "Este código de cartão já está cadastrado!"
      });
    }

    const local = getLocalAleatorio();
    const horario = new Date().toLocaleString('pt-BR');

    const { data, error } = await supabase
      .from('cartoes')
      .insert({
        nome_aluno: nome,
        matricula: matricula,
        codigo_cartao: codigoCartao,
        status: 'PERDIDO',
        local_perdido: local.nome,
        latitude: local.coordenadas.lat,
        longitude: local.coordenadas.lng,
        horario_perda: horario,
        distancia_radar_sinal: -60
      })
      .select();

    if (error) {
      console.error('❌ ERRO:', error);
      return res.status(500).json({
        sucesso: false,
        erro: "Erro no banco: " + error.message
      });
    }

    res.json({
      sucesso: true,
      mensagem: `✅ Cartão de ${nome} cadastrado!`,
      dadosCadastrados: {
        id: data[0].id,
        nomeAluno: data[0].nome_aluno,
        matricula: data[0].matricula,
        idCartao: data[0].codigo_cartao,
        localPerdido: data[0].local_perdido,
        status: data[0].status
      }
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro interno: " + error.message
    });
  }
});

// ======================================================
// CONSULTAR
// ======================================================
app.post('/api/meu-cartao/consultar', async (req, res) => {
  console.log('🔍 CONSULTA:', req.body);
  const { codigoCartao, matricula } = req.body;

  if (!codigoCartao || !matricula) {
    return res.status(400).json({
      sucesso: false,
      erro: "Código e matrícula são obrigatórios."
    });
  }

  try {
    const { data, error } = await supabase
      .from('cartoes')
      .select('*')
      .eq('codigo_cartao', codigoCartao)
      .eq('matricula', matricula)
      .maybeSingle();

    if (error) {
      console.error('❌ ERRO:', error);
      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao consultar: " + error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        sucesso: false,
        erro: "❌ Cartão não encontrado."
      });
    }

    res.json({
      sucesso: true,
      aluno: data.nome_aluno,
      matricula: data.matricula,
      cartaoCodigo: data.codigo_cartao,
      statusAtual: data.status,
      localizacao: {
        ondeFoiVisto: data.local_perdido,
        latitude: data.latitude,
        longitude: data.longitude,
        registradoAs: data.horario_perda
      }
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro interno: " + error.message
    });
  }
});

// ======================================================
// RADAR
// ======================================================
app.post('/api/meu-cartao/simular-radar', async (req, res) => {
  console.log('📡 RADAR:', req.body);
  const { sinalRssi, codigoCartao, matricula } = req.body;

  if (!codigoCartao || !matricula) {
    return res.status(400).json({
      sucesso: false,
      erro: "Código e matrícula são obrigatórios."
    });
  }

  try {
    const { data, error } = await supabase
      .from('cartoes')
      .select('*')
      .eq('codigo_cartao', codigoCartao)
      .eq('matricula', matricula)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({
        sucesso: false,
        erro: "❌ Cartão não encontrado."
      });
    }

    const sinal = sinalRssi !== undefined ? parseInt(sinalRssi) : -60;

    await supabase
      .from('cartoes')
      .update({ distancia_radar_sinal: sinal })
      .eq('id', data.id);

    let raio = 0, mensagemRadar = "", dica = "";
    if (sinal >= -50) {
      mensagemRadar = "🔥 MUITO PERTO!";
      dica = `O cartão está a menos de 2 metros!`;
      raio = 2;
    } else if (sinal >= -75) {
      mensagemRadar = "🧯 CHEGANDO PERTO";
      dica = `Você está a cerca de 5 metros.`;
      raio = 5;
    } else {
      mensagemRadar = "🧊 LONGE";
      dica = `Sinal muito fraco. Mova-se.`;
      raio = 15;
    }

    res.json({
      sucesso: true,
      aluno: data.nome_aluno,
      sinalMedidoDb: sinal,
      statusRadar: mensagemRadar,
      orientacao: dica,
      localizacao: {
        ondeFoiVisto: data.local_perdido,
        latitude: data.latitude,
        longitude: data.longitude
      },
      raio: raio
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
    res.status(500).json({
      sucesso: false,
      erro: "Erro interno: " + error.message
    });
  }
});

// ======================================================
// LISTAR TODOS
// ======================================================
app.get('/api/meu-cartao/listar-todos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cartoes')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao listar: " + error.message
      });
    }

    res.json({
      sucesso: true,
      total: data.length,
      cartoes: data
    });

  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro interno: " + error.message
    });
  }
});

// ======================================================
// EXPORTA PARA VERCEL
// ======================================================
module.exports = app;