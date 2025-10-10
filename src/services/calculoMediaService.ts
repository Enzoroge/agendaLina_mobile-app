// Services para cálculo de médias e situação do aluno
import { api } from './api';

// Configurações do sistema de notas
const CONFIGURACAO = {
  MEDIA_MINIMA_APROVACAO: 7.0,
  MEDIA_MINIMA_RECUPERACAO: 5.0,
  PESO_PROVA: 0.7,
  PESO_TRABALHO: 0.3,
  TOTAL_BIMESTRES: 4
};

// Tipos
interface MediaBimestre {
  bimestre: number;
  media: number;
}

interface SituacaoAluno {
  situacao: 'APROVADO' | 'REPROVADO' | 'RECUPERACAO' | 'EM_ANDAMENTO';
  mediaFinal: number;
  pontosNecessarios?: number | null;
  observacoes: string;
}

interface DisciplinaBoletim {
  nome: string;
  codigo: string;
  mediasBimestres: MediaBimestre[];
  mediaFinal: number;
  situacao: string;
  pontosNecessarios?: number | null;
  observacoes?: string;
}

interface Boletim {
  aluno: {
    id: number;
    nome: string;
    cpf: string;
  };
  disciplinas: DisciplinaBoletim[];
}

class CalculoMediaService {
  
  // Calcular média de um bimestre específico
  async calcularMediaBimestre(alunoId: number, disciplinaId: number, bimestreId: number): Promise<number> {
    try {
      const response = await api.post('/calculo/media-bimestre', {
        alunoId,
        disciplinaId,
        bimestreId
      });

      return response.data.media;

    } catch (error) {
      console.error('Erro ao calcular média do bimestre:', error);
      throw new Error('Não foi possível calcular a média do bimestre');
    }
  }

  // Calcular média final e situação do aluno
  async calcularSituacaoFinal(alunoId: number, disciplinaId: number, anoLetivoId: number): Promise<SituacaoAluno> {
    try {
      const response = await api.post('/calculo/situacao-final', {
        alunoId,
        disciplinaId,
        anoLetivoId
      });

      return response.data;

    } catch (error) {
      console.error('Erro ao calcular situação final:', error);
      throw new Error('Não foi possível calcular a situação final do aluno');
    }
  }

  // Recalcular todas as médias de um aluno
  async recalcularTodasMedias(alunoId: number, anoLetivoId: number) {
    try {
      const response = await api.post('/calculo/recalcular-medias', {
        alunoId,
        anoLetivoId
      });

      return response.data.resultados;

    } catch (error) {
      console.error('Erro ao recalcular médias:', error);
      throw new Error('Não foi possível recalcular as médias do aluno');
    }
  }

  // Buscar boletim completo do aluno
  async buscarBoletim(alunoId: number, anoLetivoId: number): Promise<Boletim> {
    try {
      const response = await api.get(`/boletim/${alunoId}/${anoLetivoId}`);

      return response.data;

    } catch (error) {
      console.error('Erro ao buscar boletim:', error);
      throw new Error('Não foi possível buscar o boletim do aluno');
    }
  }

  // Buscar relatório de desempenho da turma
  async buscarRelatorioTurma(turmaId: number, bimestreId?: number) {
    try {
      const params = bimestreId ? `?bimestreId=${bimestreId}` : '';
      const response = await api.get(`/relatorio/turma/${turmaId}${params}`);

      return response.data;

    } catch (error) {
      console.error('Erro ao buscar relatório da turma:', error);
      throw new Error('Não foi possível buscar o relatório da turma');
    }
  }

  // Buscar estatísticas do aluno
  async buscarEstatisticasAluno(alunoId: number, anoLetivoId: number) {
    try {
      const response = await api.get(`/estatisticas/aluno/${alunoId}/${anoLetivoId}`);

      return response.data;

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Não foi possível buscar as estatísticas do aluno');
    }
  }
}

export { CalculoMediaService, CONFIGURACAO };
export type { MediaBimestre, SituacaoAluno, DisciplinaBoletim, Boletim };