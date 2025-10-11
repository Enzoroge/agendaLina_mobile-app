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
  
  async listar(params?: ListarAtividadesRequest) {
    const queryParams = new URLSearchParams();
    if (params?.disciplinaId) queryParams.append('disciplinaId', params.disciplinaId.toString());
    if (params?.turmaId) queryParams.append('turmaId', params.turmaId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const urlPadrao = queryString ? `/atividades?${queryString}` : '/atividades';
    
    try {
      const response = await api.get(urlPadrao);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response.data.atividades)) {
        return response.data.atividades;
      }
      return [];
    } catch (error: any) {
      console.error('Erro ao listar atividades:', error);
      return [];
    }
  }

  async buscarPorId(id: number) {
    try {
      const response = await api.get(`/atividade/${id}`);
      if (response.data.atividade) {
        return response.data.atividade;
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar atividade:', error);
      throw error;
    }
  }

  async criar(data: CreateAtividadeRequest) {
    try {
      const response = await api.post('/atividade', data);
      if (response.data.atividade) {
        return response.data.atividade;
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw error;
    }
  }

  async atualizar(data: UpdateAtividadeRequest) {
    try {
      const { atividadeId, ...updateData } = data;
      const response = await api.put(`/atividade/${atividadeId}`, updateData);
      if (response.data.atividade) {
        return response.data.atividade;
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      throw error;
    }
  }

  async deletar(id: number) {
    try {
      const response = await api.delete(`/atividade/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      throw error;
    }
  }

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

  // Métodos para buscar turmas e disciplinas com fallbacks
  async buscarTurmas() {
    try {
      // Tenta diferentes endpoints para turmas
      const endpoints = ['/turmas', '/turma'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          
          // Trata diferentes formatos de resposta
          if (Array.isArray(response.data)) {
            return response.data;
          }
          if (Array.isArray(response.data.turmas)) {
            return response.data.turmas;
          }
          if (response.data.turma) {
            return Array.isArray(response.data.turma) ? response.data.turma : [response.data.turma];
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.warn(`Erro no endpoint ${endpoint}:`, error.message);
          }
          continue;
        }
      }
      
      console.warn('Nenhum endpoint de turmas encontrado');
      return [];
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      return [];
    }
  }

  async buscarDisciplinas() {
    try {
      // Tenta diferentes endpoints para disciplinas
      const endpoints = ['/disciplina', '/disciplinas'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          
          // Trata diferentes formatos de resposta
          if (Array.isArray(response.data)) {
            return response.data;
          }
          if (Array.isArray(response.data.disciplinas)) {
            return response.data.disciplinas;
          }
          if (response.data.disciplina) {
            return Array.isArray(response.data.disciplina) ? response.data.disciplina : [response.data.disciplina];
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.warn(`Erro no endpoint ${endpoint}:`, error.message);
          }
          continue;
        }
      }
      
      console.warn('Nenhum endpoint de disciplinas encontrado');
      return [];
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      return [];
    }
  }
}

export default new AtividadeService();