import { api } from './api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  telefone?: string;
}

interface Disciplina {
  id: number;
  nome: string;
}

interface Turma {
  id: number;
  nome: string;
  ano: number;
}

interface Professor {
  id: number;
  userId: number;
  user: User;
  turmas: {
    turma: Turma;
  }[];
  disciplinasLecionadas: {
    disciplina: Disciplina;
  }[];
}

class ListarProfessorService {
    async execute(): Promise<Professor[]> {
        try {
            console.log('🔄 Listando professores com disciplinas e turmas...');
            
            const response = await api.get('/professores');
            const professores = response.data;

            console.log('👨‍🏫 Professores encontrados:', professores.length);
            
            if (professores.length > 0) {
                console.log('📚 Exemplo de professor com dados:', {
                    id: professores[0].id,
                    userName: professores[0].user?.name,
                    userTelefone: professores[0].user?.telefone,
                    userRole: professores[0].user?.role,
                    totalTurmas: professores[0].turmas?.length || 0,
                    totalDisciplinas: professores[0].disciplinasLecionadas?.length || 0
                });
            }

            return professores;
        } catch (error: any) {
            console.log('❌ Erro ao listar professores:', error);
            console.log('❌ Resposta do erro:', error.response?.data);
            throw new Error(`Erro ao buscar professores: ${error.message}`);
        }
    }
}

export { ListarProfessorService };