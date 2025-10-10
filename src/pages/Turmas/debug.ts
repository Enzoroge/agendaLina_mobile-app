// ARQUIVO TEMPORÁRIO PARA DEBUG - Debug das Turmas
// Este arquivo ajuda a identificar problemas na busca de turmas

export const debugTurmas = {
  // Teste simples da API
  testarAPI: async (api: any) => {
    console.log('🧪 === TESTE SIMPLES DA API ===');
    
    try {
      // Teste 1: Health check
      console.log('🔍 Teste 1: Health check...');
      const health = await api.get('/');
      console.log('✅ Health check OK:', health.status);
    } catch (error: any) {
      console.log('❌ Health check falhou:', error.message);
    }

    try {
      // Teste 2: Listar turmas (GET /turmas)
      console.log('🔍 Teste 2: GET /turmas...');
      const turmas = await api.get('/turmas');
      console.log('✅ GET /turmas:', {
        status: turmas.status,
        data: turmas.data,
        length: turmas.data?.length
      });
      return turmas.data;
    } catch (error: any) {
      console.log('❌ GET /turmas falhou:', error.response?.status, error.message);
    }

    try {
      // Teste 3: Listar turmas (GET /turma)
      console.log('🔍 Teste 3: GET /turma...');
      const turma = await api.get('/turma');
      console.log('✅ GET /turma:', {
        status: turma.status,
        data: turma.data,
        length: turma.data?.length
      });
      return turma.data;
    } catch (error: any) {
      console.log('❌ GET /turma falhou:', error.response?.status, error.message);
    }

    return [];
  },

  // Dados mock para teste
  dadosMock: [
    {
      id: 1,
      nome: "Turma A",
      ano: 2024,
      alunos: [
        { id: 1, nome: "João Silva" },
        { id: 2, nome: "Maria Santos" }
      ],
      professores: [
        { id: 1, nome: "Prof. Carlos", user: { name: "Carlos Alberto" } }
      ],
      disciplinas: [
        { id: 1, nome: "Matemática" },
        { id: 2, nome: "Português" }
      ]
    },
    {
      id: 2,
      nome: "Turma B",
      ano: 2024,
      alunos: [
        { id: 3, nome: "Pedro Costa" }
      ],
      professores: [
        { id: 2, nome: "Prof. Ana", user: { name: "Ana Lucia" } }
      ],
      disciplinas: [
        { id: 3, nome: "História" }
      ]
    }
  ]
};