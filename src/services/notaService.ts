// Service para gerenciamento de notas
import { api } from './api';
import { Nota as NotaModel, MediaBimestre, Bimestre, SituacaoBimestre } from '../types/database';
import { GradeCalculationService } from './GradeCalculationService';

export interface Nota {
  id: number;
  valor: number;
  observacao?: string;
  alunoId: number;
  atividadeId: number;
  professorId?: number;
  criadoEm?: string;
  atualizadoEm?: string;
  dataLancamento?: Date;
  atividade: {
    id: number;
    nome: string;
    titulo?: string;
    tipo: string;
    valorMaximo: number;
    peso: number;
    descricao?: string;
    dataEntrega: string;
    bimestre?: string;
    disciplina?: {
      id: number;
      nome: string;
    };
  };
  aluno: {
    id: number;
    nome: string;
    matricula?: string;
  };
}

export interface CreateNotaData {
  valor: number;
  observacao?: string;
  alunoId: number;
  atividadeId: number;
  professorId?: number;
}

export interface UpdateNotaData {
  valor?: number;
  observacao?: string;
}

// Mock data para demonstração
const mockNotas: Nota[] = [
  {
    id: 1,
    valor: 8.5,
    observacao: 'Ótimo desempenho',
    alunoId: 1,
    atividadeId: 1,
    professorId: 1,
    dataLancamento: new Date('2025-04-16'),
    atividade: {
      id: 1,
      nome: 'Prova de Matemática',
      titulo: 'Prova de Matemática - 1º Bimestre',
      tipo: 'PROVA',
      valorMaximo: 10.0,
      peso: 2.0,
      dataEntrega: '2025-04-15',
      bimestre: 'PRIMEIRO',
      disciplina: {
        id: 1,
        nome: 'Matemática'
      }
    },
    aluno: {
      id: 1,
      nome: 'João Silva',
      matricula: '2025001'
    }
  },
  {
    id: 2,
    valor: 6.0,
    observacao: 'Precisa melhorar',
    alunoId: 2,
    atividadeId: 1,
    professorId: 1,
    dataLancamento: new Date('2025-04-16'),
    atividade: {
      id: 1,
      nome: 'Prova de Matemática',
      titulo: 'Prova de Matemática - 1º Bimestre',
      tipo: 'PROVA',
      valorMaximo: 10.0,
      peso: 2.0,
      dataEntrega: '2025-04-15',
      bimestre: 'PRIMEIRO',
      disciplina: {
        id: 1,
        nome: 'Matemática'
      }
    },
    aluno: {
      id: 2,
      nome: 'Maria Santos',
      matricula: '2025002'
    }
  }
];

class NotaService {
  
  // Listar todas as notas
  async listarNotas(): Promise<Nota[]> {
    try {
      // const response = await api.get('/notas');
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockNotas;
    } catch (error) {
      console.error('Erro ao listar notas:', error);
      throw new Error('Não foi possível carregar as notas');
    }
  }

  // Buscar notas por atividade
  async buscarNotasPorAtividade(atividadeId: number): Promise<Nota[]> {
    try {
      // const response = await api.get(`/notas/atividade/${atividadeId}`);
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockNotas.filter(nota => nota.atividadeId === atividadeId);
    } catch (error) {
      console.error('Erro ao buscar notas da atividade:', error);
      throw new Error('Não foi possível carregar as notas da atividade');
    }
  }

  // Buscar notas do aluno
  async buscarNotasAluno(alunoId: number, disciplinaId?: number, bimestreId?: number): Promise<Nota[]> {
    try {
      // let url = `/notas/aluno/${alunoId}`;
      // const params: string[] = [];
      // if (disciplinaId) params.push(`disciplinaId=${disciplinaId}`);
      // if (bimestreId) params.push(`bimestreId=${bimestreId}`);
      // if (params.length > 0) {
      //   url += `?${params.join('&')}`;
      // }
      // const response = await api.get(url);
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 600));
      let notas = mockNotas.filter(nota => nota.alunoId === alunoId);
      
      if (disciplinaId) {
        notas = notas.filter(nota => nota.atividade.disciplina?.id === disciplinaId);
      }
      
      if (bimestreId) {
        const bimestre = this.numberToBimestre(bimestreId);
        notas = notas.filter(nota => nota.atividade.bimestre === bimestre);
      }
      
      return notas;
    } catch (error) {
      console.error('Erro ao buscar notas do aluno:', error);
      throw new Error('Não foi possível carregar as notas do aluno');
    }
  }

  // Buscar nota por ID
  async buscarNotaPorId(id: number): Promise<Nota | null> {
    try {
      // const response = await api.get(`/nota/${id}`);
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockNotas.find(nota => nota.id === id) || null;
    } catch (error) {
      console.error('Erro ao buscar nota:', error);
      throw new Error('Não foi possível carregar a nota');
    }
  }

  // Criar nova nota
  async criarNota(data: CreateNotaData): Promise<Nota> {
    try {
      // const response = await api.post('/nota', data);
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Verificar se já existe nota para este aluno nesta atividade
      const notaExistente = mockNotas.find(n => 
        n.alunoId === data.alunoId && n.atividadeId === data.atividadeId
      );
      
      if (notaExistente) {
        throw new Error('Aluno já possui nota para esta atividade');
      }
      
      const novaNota: Nota = {
        id: Math.max(...mockNotas.map(n => n.id)) + 1,
        valor: data.valor,
        observacao: data.observacao,
        alunoId: data.alunoId,
        atividadeId: data.atividadeId,
        professorId: data.professorId,
        dataLancamento: new Date(),
        atividade: {
          id: data.atividadeId,
          nome: 'Atividade Mock',
          tipo: 'EXERCICIO',
          valorMaximo: 10.0,
          peso: 1.0,
          dataEntrega: new Date().toISOString(),
          bimestre: 'PRIMEIRO',
          disciplina: { id: 1, nome: 'Disciplina Mock' }
        },
        aluno: {
          id: data.alunoId,
          nome: `Aluno ${data.alunoId}`,
          matricula: `202500${data.alunoId}`
        }
      };
      
      mockNotas.push(novaNota);
      return novaNota;
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      throw new Error('Não foi possível criar a nota');
    }
  }

  // Atualizar nota
  async atualizarNota(id: number, data: UpdateNotaData): Promise<Nota | null> {
    try {
      // const response = await api.put(`/nota/${id}`, data);
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 600));
      const index = mockNotas.findIndex(n => n.id === id);
      if (index === -1) return null;
      
      mockNotas[index] = {
        ...mockNotas[index],
        ...data,
        dataLancamento: new Date()
      };
      
      return mockNotas[index];
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      throw new Error('Não foi possível atualizar a nota');
    }
  }

  // Deletar nota
  async deletarNota(id: number): Promise<void> {
    try {
      // await api.delete(`/nota/${id}`);

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 400));
      const index = mockNotas.findIndex(n => n.id === id);
      if (index === -1) {
        throw new Error('Nota não encontrada');
      }
      
      mockNotas.splice(index, 1);
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      throw new Error('Não foi possível deletar a nota');
    }
  }

  // Lançar múltiplas notas (para uma atividade)
  async lancarNotasAtividade(
    atividadeId: number, 
    notas: Array<{alunoId: number; valor: number; observacao?: string}>,
    professorId?: number
  ): Promise<Nota[]> {
    try {
      // const response = await api.post(`/notas/atividade/${atividadeId}/lancar`, { notas });
      // return response.data;

      // Mock para demonstração
      await new Promise(resolve => setTimeout(resolve, 1200));
      const notasCriadas: Nota[] = [];
      
      for (const notaData of notas) {
        try {
          const nota = await this.criarNota({
            valor: notaData.valor,
            observacao: notaData.observacao,
            alunoId: notaData.alunoId,
            atividadeId,
            professorId
          });
          notasCriadas.push(nota);
        } catch (error) {
          console.warn(`Erro ao criar nota para aluno ${notaData.alunoId}:`, error);
        }
      }
      
      return notasCriadas;
    } catch (error) {
      console.error('Erro ao lançar notas:', error);
      throw new Error('Não foi possível lançar as notas');
    }
  }

  // Calcular média do aluno em um bimestre/disciplina
  async calcularMediaAluno(
    alunoId: number, 
    disciplinaId: number, 
    bimestre: Bimestre
  ): Promise<MediaBimestre> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Buscar notas do aluno no bimestre/disciplina
    const bimestreNumber = this.bimestreToNumber(bimestre);
    const notas = await this.buscarNotasAluno(alunoId, disciplinaId, bimestreNumber);
    
    // Converter para formato esperado pelo GradeCalculationService
    const notasParaCalculo = notas.map(nota => ({
      id: nota.id,
      valor: nota.valor,
      peso: nota.atividade.peso,
      valorMaximo: nota.atividade.valorMaximo,
      tipo: nota.atividade.tipo,
      bimestre
    }));
    
    const calculo = GradeCalculationService.calculateBimestreAverage(notasParaCalculo);
    
    return {
      id: Date.now(),
      bimestre,
      disciplina: notas[0]?.atividade.disciplina?.nome || 'Disciplina',
      disciplinaId,
      media: calculo.media,
      faltas: 0, // Mock - implementar sistema de faltas
      situacao: calculo.situacao as SituacaoBimestre,
      observacao: calculo.observacao,
      alunoId
    };
  }

  // Utilitários
  numberToBimestre(num: number): string {
    switch (num) {
      case 1: return 'PRIMEIRO';
      case 2: return 'SEGUNDO';
      case 3: return 'TERCEIRO';
      case 4: return 'QUARTO';
      default: return 'PRIMEIRO';
    }
  }

  bimestreToNumber(bimestre: Bimestre | string): number {
    switch (bimestre) {
      case Bimestre.PRIMEIRO:
      case 'PRIMEIRO':
        return 1;
      case Bimestre.SEGUNDO:
      case 'SEGUNDO':
        return 2;
      case Bimestre.TERCEIRO:
      case 'TERCEIRO':
        return 3;
      case Bimestre.QUARTO:
      case 'QUARTO':
        return 4;
      default:
        return 1;
    }
  }

  // Validar nota
  validarNota(valor: number, valorMaximo: number): boolean {
    return valor >= 0 && valor <= valorMaximo;
  }

  // Converter nota para escala 0-10
  converterNotaPara10(valor: number, valorMaximo: number): number {
    return (valor / valorMaximo) * 10;
  }

  // Calcular porcentagem da nota
  calcularPorcentagem(valor: number, valorMaximo: number): number {
    return (valor / valorMaximo) * 100;
  }
}

export default new NotaService();