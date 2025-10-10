import { Bimestre, SituacaoBimestre, SituacaoFinal } from '../types/database';

export interface AtividadeNota {
  id: number;
  valor: number;
  peso: number;
  valorMaximo: number;
  tipo: string;
  bimestre: Bimestre;
}

export interface MediaCalculada {
  media: number;
  situacao: SituacaoBimestre | SituacaoFinal;
  observacao?: string;
  pontosNecessarios?: number;
}

export class GradeCalculationService {
  
  /**
   * Calcula a média de um bimestre específico baseado nas atividades
   */
  static calculateBimestreAverage(notas: AtividadeNota[]): MediaCalculada {
    if (!notas || notas.length === 0) {
      return {
        media: 0,
        situacao: SituacaoBimestre.REPROVADO,
        observacao: 'Nenhuma atividade realizada'
      };
    }

    let somaNotas = 0;
    let somaPesos = 0;

    notas.forEach(nota => {
      // Converte a nota para escala 0-10 se necessário
      const notaNormalizada = (nota.valor / nota.valorMaximo) * 10;
      somaNotas += notaNormalizada * nota.peso;
      somaPesos += nota.peso;
    });

    const media = somaPesos > 0 ? somaNotas / somaPesos : 0;
    const situacao = this.determineBimestreSituation(media);

    return {
      media: Math.round(media * 100) / 100, // 2 casas decimais
      situacao,
      observacao: this.getBimestreObservation(situacao, media)
    };
  }

  /**
   * Calcula a média final anual baseada nos 4 bimestres
   */
  static calculateFinalAverage(
    mediasBimestre: { bimestre: Bimestre; media: number }[],
    totalFaltas: number = 0,
    totalAulas: number = 200
  ): MediaCalculada {
    
    if (!mediasBimestre || mediasBimestre.length === 0) {
      return {
        media: 0,
        situacao: SituacaoFinal.REPROVADO_NOTA,
        observacao: 'Nenhum bimestre avaliado'
      };
    }

    // Calcula média simples dos bimestres
    const somaMedias = mediasBimestre.reduce((soma, item) => soma + item.media, 0);
    const mediaFinal = somaMedias / mediasBimestre.length;

    // Verifica situação por faltas
    const percentualFaltas = (totalFaltas / totalAulas) * 100;
    const reprovarPorFalta = percentualFaltas > 25;

    // Determina situação final
    const situacao = this.determineFinalSituation(mediaFinal, reprovarPorFalta);
    
    let pontosNecessarios: number | undefined;
    if (situacao === SituacaoFinal.RECUPERACAO_FINAL) {
      // Calcula quantos pontos precisa na prova final para atingir 5.0
      pontosNecessarios = Math.max(0, (5.0 * 2) - mediaFinal);
      pontosNecessarios = Math.round(pontosNecessarios * 100) / 100;
    }

    return {
      media: Math.round(mediaFinal * 100) / 100,
      situacao,
      observacao: this.getFinalObservation(situacao, mediaFinal, percentualFaltas),
      pontosNecessarios
    };
  }

  /**
   * Determina a situação do aluno no bimestre
   */
  private static determineBimestreSituation(media: number): SituacaoBimestre {
    if (media >= 7.0) {
      return SituacaoBimestre.APROVADO;
    } else if (media >= 5.0) {
      return SituacaoBimestre.RECUPERACAO;
    } else {
      return SituacaoBimestre.REPROVADO;
    }
  }

  /**
   * Determina a situação final do aluno
   */
  private static determineFinalSituation(
    mediaFinal: number, 
    reprovarPorFalta: boolean
  ): SituacaoFinal {
    
    if (reprovarPorFalta && mediaFinal < 5.0) {
      return SituacaoFinal.REPROVADO_NOTA_FALTA;
    }
    
    if (reprovarPorFalta) {
      return SituacaoFinal.REPROVADO_FALTA;
    }
    
    if (mediaFinal >= 7.0) {
      return SituacaoFinal.APROVADO;
    } else if (mediaFinal >= 5.0) {
      return SituacaoFinal.RECUPERACAO_FINAL;
    } else {
      return SituacaoFinal.REPROVADO_NOTA;
    }
  }

  /**
   * Gera observação para situação do bimestre
   */
  private static getBimestreObservation(
    situacao: SituacaoBimestre, 
    media: number
  ): string {
    switch (situacao) {
      case SituacaoBimestre.APROVADO:
        return media >= 9.0 ? 'Excelente desempenho!' : 'Aprovado no bimestre';
      case SituacaoBimestre.RECUPERACAO:
        const pontosNecessarios = Math.round((7.0 - media) * 100) / 100;
        return `Precisa de ${pontosNecessarios} pontos para aprovação`;
      case SituacaoBimestre.REPROVADO:
        return 'Desempenho insuficiente no bimestre';
      default:
        return '';
    }
  }

  /**
   * Gera observação para situação final
   */
  private static getFinalObservation(
    situacao: SituacaoFinal,
    media: number,
    percentualFaltas: number
  ): string {
    switch (situacao) {
      case SituacaoFinal.APROVADO:
        return media >= 9.0 ? 'Excelente desempenho anual!' : 'Aprovado no ano letivo';
      case SituacaoFinal.RECUPERACAO_FINAL:
        return 'Deve fazer prova de recuperação final';
      case SituacaoFinal.REPROVADO_NOTA:
        return 'Reprovado por insuficiência de notas';
      case SituacaoFinal.REPROVADO_FALTA:
        return `Reprovado por excesso de faltas (${Math.round(percentualFaltas)}%)`;
      case SituacaoFinal.REPROVADO_NOTA_FALTA:
        return `Reprovado por notas e faltas (${Math.round(percentualFaltas)}%)`;
      default:
        return '';
    }
  }

  /**
   * Simula o que aconteceria com diferentes notas na recuperação
   */
  static simulateRecovery(
    mediaAtual: number, 
    notaRecuperacao: number
  ): { mediaFinal: number; aprovado: boolean } {
    // Média final = (média anual + nota recuperação) / 2
    const mediaFinal = (mediaAtual + notaRecuperacao) / 2;
    const aprovado = mediaFinal >= 5.0;
    
    return {
      mediaFinal: Math.round(mediaFinal * 100) / 100,
      aprovado
    };
  }

  /**
   * Calcula estatísticas da turma
   */
  static calculateClassStats(medias: number[]): {
    mediaGeral: number;
    aprovados: number;
    recuperacao: number;
    reprovados: number;
    percentualAprovacao: number;
  } {
    if (!medias || medias.length === 0) {
      return {
        mediaGeral: 0,
        aprovados: 0,
        recuperacao: 0,
        reprovados: 0,
        percentualAprovacao: 0
      };
    }

    const mediaGeral = medias.reduce((soma, media) => soma + media, 0) / medias.length;
    
    const aprovados = medias.filter(media => media >= 7.0).length;
    const recuperacao = medias.filter(media => media >= 5.0 && media < 7.0).length;
    const reprovados = medias.filter(media => media < 5.0).length;
    
    const percentualAprovacao = (aprovados / medias.length) * 100;

    return {
      mediaGeral: Math.round(mediaGeral * 100) / 100,
      aprovados,
      recuperacao,
      reprovados,
      percentualAprovacao: Math.round(percentualAprovacao * 100) / 100
    };
  }
}