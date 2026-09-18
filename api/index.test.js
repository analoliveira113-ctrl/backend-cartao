const request = require('supertest');
const app = require('./index');

// Mock do Supabase para simular respostas do banco
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }))
}));

describe('API Meu Cartão RF ID', () => {

  describe('GET /teste', () => {
    test('deve retornar 200 e confirmar que a API está funcionando', async () => {
      const response = await request(app).get('/teste');

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.mensagem).toBe(
        'API do Meu Cartão RF ID rodando perfeitamente na Vercel!'
      );
      expect(response.body.timestamp).toEqual(expect.any(String));
    });

    test('deve funcionar também pelo prefixo /api', async () => {
      const response = await request(app).get('/api/teste');

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
    });
  });

  describe('POST /meu-cartao/cadastrar', () => {
    test('deve cadastrar um cartão com sucesso e retornar 201', async () => {
      const response = await request(app)
        .post('/meu-cartao/cadastrar')
        .send({
          nome: 'Aluno Teste',
          codigoCartao: '12345',
          matricula: '98765'
        });

      expect(response.status).toBe(201);
      expect(response.body.sucesso).toBe(true);
    });
  });

  describe('POST /meu-cartao/consultar', () => {
    test('deve retornar 404 quando o cartão não for encontrado', async () => {
      const response = await request(app)
        .post('/meu-cartao/consultar')
        .send({ codigoCartao: '00000', matricula: '00000' });

      expect(response.status).toBe(404);
      expect(response.body.sucesso).toBe(false);
    });

    test('deve retornar 400 quando faltar dados obrigatórios', async () => {
      const response = await request(app)
        .post('/meu-cartao/consultar')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.sucesso).toBe(false);
    });
  });

  describe('POST /meu-cartao/simular-radar', () => {
    test('deve calcular a distância com sucesso usando o RSSI informado', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({ codigoCartao: '12345', matricula: '98765', sinalRssi: -80 });

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
      expect(response.body.sinalRssi).toBe(-80);
    });

    test('deve usar -60 como RSSI padrão quando sinalRssi não for informado', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({ codigoCartao: '12345', matricula: '98765' });

      expect(response.status).toBe(200);
      expect(response.body.sinalRssi).toBe(-60);
    });

    test('deve converter sinalRssi recebido como texto para número', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({ codigoCartao: '12345', matricula: '98765', sinalRssi: '-75' });

      expect(response.status).toBe(200);
      expect(response.body.sinalRssi).toBe(-75);
    });

    test('deve retornar 400 quando os dados obrigatórios não forem enviados', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.sucesso).toBe(false);
    });

    test('deve retornar 400 quando faltar apenas o código do cartão', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({ matricula: '98765' });

      expect(response.status).toBe(400);
    });

    test('deve retornar 400 quando faltar apenas a matrícula', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({ codigoCartao: '12345' });

      expect(response.status).toBe(400);
    });

    test('deve aplicar a distância mínima de 1 metro para sinais fortes', async () => {
      const response = await request(app)
        .post('/meu-cartao/simular-radar')
        .send({ codigoCartao: '12345', matricula: '98765', sinalRssi: -30 });

      expect(response.status).toBe(200);
      expect(response.body.distanciaEstimadaMetros).toBe(1);
    });

    test('deve funcionar pelo prefixo /api', async () => {
      const response = await request(app)
        .post('/api/meu-cartao/simular-radar')
        .send({ codigoCartao: '12345', matricula: '98765' });

      expect(response.status).toBe(200);
      expect(response.body.sucesso).toBe(true);
    });
  });

  describe('Rotas inexistentes', () => {
    test('deve retornar 404 para uma rota que não existe', async () => {
      const response = await request(app).get('/rota-que-nao-existe');
      expect(response.status).toBe(404);
    });
  });

});