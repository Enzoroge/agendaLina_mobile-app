import { api } from './api';

export interface Atividade {
  id: number;
  titulo: string;
  descricao: string;
  disciplinaId: number;
  disciplina: {
    id: number;
    nome: string;
    professoresLecionando?: Array<{
      professor: {
        user: {
          id: number;
          name: string;
        }
      }
    }>;
  };
  turmas: Array<{
    id: number;
    nome: string;
    ano: number;
    alunos?: Array<{
      user: {
        id: number;
        name: string;
      }
    }>;
  }>;
  notas?: Array<{
    id: number;
    valor: number;
    bimestre: number;
    aluno: {
      user: {
        id: number;
        name: string;
      }
    };
    professor?: {
      user: {
        id: number;
        name: string;
      }
    };
  }>;
}

export interface CreateAtividadeRequest {
  titulo: string;
  descricao: string;
  disciplinaId: number;
  turmaIds?: number[];
}

export interface UpdateAtividadeRequest {
  atividadeId: number;
  titulo?: string;
  descricao?: string;
  turmaIds?: number[];
}

export interface ListarAtividadesRequest {
  disciplinaId?: number;
  turmaId?: number;
  page?: number;
  limit?: number;
}

class AtividadeService {
  
  // Listar atividades
  async listar(params?: ListarAtividadesRequest) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.disciplinaId) queryParams.append('disciplinaId', params.disciplinaId.toString());
      if (params?.turmaId) queryParams.append('turmaId', params.turmaId.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `/atividades?${queryString}` : '/atividades';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar atividades:', error);
      throw error;
    }
  }

  // Buscar atividade por ID
  async buscarPorId(id: number) {
    try {
      const response = await api.get(`/atividades/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar atividade:', error);
      throw error;
    }
  }

  // Criar nova atividade
  async criar(data: CreateAtividadeRequest) {
    try {
      const response = await api.post('/atividades', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw error;
    }
  }

  // Atualizar atividade
  async atualizar(data: UpdateAtividadeRequest) {
    try {
      const { atividadeId, ...updateData } = data;
      const response = await api.put(`/atividades/${atividadeId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      throw error;
    }
  }

  // Deletar atividade
  async deletar(id: number) {
    try {
      const response = await api.delete(`/atividades/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      throw error;
    }
  }

  // Métodos compatíveis com código legacy - manter para compatibilidade
  async listarAtividades(): Promise<Atividade[]> {
    return this.listar();
  }

  async listarAtividadesPorDisciplina(disciplinaId: number): Promise<Atividade[]> {
    return this.listar({ disciplinaId });
  }

  async listarAtividadesPorTurma(turmaId: number): Promise<Atividade[]> {
    return this.listar({ turmaId });
  }

  async buscarAtividade(id: number): Promise<Atividade | null> {
    try {
      return await this.buscarPorId(id);
    } catch (error) {
      return null;
    }
  }

  async criarAtividade(data: CreateAtividadeRequest): Promise<Atividade> {
    return this.criar(data);
  }

  async atualizarAtividade(id: number, data: Omit<CreateAtividadeRequest, 'disciplinaId'>): Promise<Atividade> {
    return this.atualizar({
      atividadeId: id,
      ...data
    });
  }

  async deletarAtividade(id: number): Promise<void> {
    await this.deletar(id);
  }
}

export default new AtividadeService();