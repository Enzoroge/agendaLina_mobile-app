// Services para cálculo de médias e situação do aluno
import prismaClient from '../prisma';

// Configurações do sistema de notas
const CONFIGURACAO = {
  MEDIA_MINIMA_APROVACAO: 7.0,
  MEDIA_MINIMA_RECUPERACAO: 5.0,
  PESO_PROVA: 0.7,
  PESO_TRABALHO: 0.3,
  TOTAL_BIMESTRES: 4
};

class CalculoMediaService {
  
  // Calcular média de um bimestre específico
  async calcularMediaBimestre(alunoId: number, disciplinaId: number, bimestreId: number) {
    try {
      // Buscar todas as atividades e notas do bimestre
      const atividades = await prismaClient.atividade.findMany({
        where: {
          bimestreId,
          disciplinaId,
        },
        include: {
          notas: {
            where: { alunoId }
          }
        }
      });

      if (atividades.length === 0) {
        return 0;
      }

      let somaPonderada = 0;
      let somaPesos = 0;
      let temNota = false;

      // Calcular média ponderada
      for (const atividade of atividades) {
        if (atividade.notas.length > 0) {
          const nota = atividade.notas[0];
          // Converter nota para escala 0-10
          const notaNormalizada = (nota.valor / atividade.valorMaximo) * 10;
          
          somaPonderada += notaNormalizada * atividade.peso;
          somaPesos += atividade.peso;
          temNota = true;
        }
      }

      const media = temNota && somaPesos > 0 ? somaPonderada / somaPesos : 0;

      // Salvar média no banco
      await prismaClient.mediaBimestre.upsert({
        where: {
          alunoId_bimestreId_disciplinaId: {
            alunoId,
            bimestreId,
            disciplinaId
          }
        },
        create: {
          alunoId,
          bimestreId,
          disciplinaId,
          valor: Math.round(media * 100) / 100 // 2 casas decimais
        },
        update: {
          valor: Math.round(media * 100) / 100,
          calculadaEm: new Date()
        }
      });

      return Math.round(media * 100) / 100;

    } catch (error) {
      console.error('Erro ao calcular média do bimestre:', error);
      throw new Error('Não foi possível calcular a média do bimestre');
    }
  }

  // Calcular média final e situação do aluno
  async calcularSituacaoFinal(alunoId: number, disciplinaId: number, anoLetivoId: number) {
    try {
      // Buscar médias dos 4 bimestres
      const bimestres = await prismaClient.bimestre.findMany({
        where: { anoLetivoId },
        orderBy: { numero: 'asc' },
        include: {
          medias: {
            where: {
              alunoId,
              disciplinaId
            }
          }
        }
      });

      if (bimestres.length === 0) {
        throw new Error('Nenhum bimestre encontrado para o ano letivo');
      }

      // Calcular média final
      let somaMedias = 0;
      let bimestresComNota = 0;

      for (const bimestre of bimestres) {
        if (bimestre.medias.length > 0) {
          somaMedias += bimestre.medias[0].valor;
          bimestresComNota++;
        }
      }

      const mediaFinal = bimestresComNota > 0 ? somaMedias / bimestresComNota : 0;

      // Determinar situação
      let situacao: 'APROVADO' | 'REPROVADO' | 'RECUPERACAO' | 'EM_ANDAMENTO';
      let pontosNecessarios: number | null = null;
      let observacoes = '';

      if (bimestresComNota < CONFIGURACAO.TOTAL_BIMESTRES) {
        situacao = 'EM_ANDAMENTO';
        observacoes = `Aguardando notas de ${CONFIGURACAO.TOTAL_BIMESTRES - bimestresComNota} bimestre(s)`;
      } else if (mediaFinal >= CONFIGURACAO.MEDIA_MINIMA_APROVACAO) {
        situacao = 'APROVADO';
        observacoes = 'Aprovado por média';
      } else if (mediaFinal >= CONFIGURACAO.MEDIA_MINIMA_RECUPERACAO) {
        situacao = 'RECUPERACAO';
        pontosNecessarios = CONFIGURACAO.MEDIA_MINIMA_APROVACAO - mediaFinal;
        observacoes = `Precisa de ${pontosNecessarios.toFixed(1)} pontos na recuperação`;
      } else {
        situacao = 'REPROVADO';
        observacoes = 'Reprovado por média insuficiente';
      }

      // Salvar situação no banco
      await prismaClient.situacaoAluno.upsert({
        where: {
          alunoId_disciplinaId_anoLetivoId: {
            alunoId,
            disciplinaId,
            anoLetivoId
          }
        },
        create: {
          alunoId,
          disciplinaId,
          anoLetivoId,
          situacao,
          mediaFinal: Math.round(mediaFinal * 100) / 100,
          pontosNecessarios,
          observacoes
        },
        update: {
          situacao,
          mediaFinal: Math.round(mediaFinal * 100) / 100,
          pontosNecessarios,
          observacoes,
          calculadoEm: new Date()
        }
      });

      return {
        situacao,
        mediaFinal: Math.round(mediaFinal * 100) / 100,
        pontosNecessarios,
        observacoes
      };

    } catch (error) {
      console.error('Erro ao calcular situação final:', error);
      throw new Error('Não foi possível calcular a situação final do aluno');
    }
  }

  // Recalcular todas as médias de um aluno
  async recalcularTodasMedias(alunoId: number, anoLetivoId: number) {
    try {
      // Buscar todas as disciplinas do aluno
      const disciplinas = await prismaClient.turmaDisciplina.findMany({
        where: {
          turma: {
            alunos: {
              some: { alunoId }
            }
          }
        },
        include: {
          disciplina: true
        }
      });

      // Buscar bimestres do ano letivo
      const bimestres = await prismaClient.bimestre.findMany({
        where: { anoLetivoId },
        orderBy: { numero: 'asc' }
      });

      const resultados = [];

      // Para cada disciplina
      for (const turmaDisciplina of disciplinas) {
        const disciplinaId = turmaDisciplina.disciplinaId;
        
        // Calcular média de cada bimestre
        for (const bimestre of bimestres) {
          await this.calcularMediaBimestre(alunoId, disciplinaId, bimestre.id);
        }

        // Calcular situação final
        const situacaoFinal = await this.calcularSituacaoFinal(alunoId, disciplinaId, anoLetivoId);
        
        resultados.push({
          disciplina: turmaDisciplina.disciplina.nome,
          ...situacaoFinal
        });
      }

      return resultados;

    } catch (error) {
      console.error('Erro ao recalcular médias:', error);
      throw new Error('Não foi possível recalcular as médias do aluno');
    }
  }

  // Buscar boletim completo do aluno
  async buscarBoletim(alunoId: number, anoLetivoId: number) {
    try {
      const aluno = await prismaClient.aluno.findUnique({
        where: { id: alunoId },
        include: {
          user: true,
          turmas: {
            where: {
              turma: { anoLetivoId }
            },
            include: {
              turma: {
                include: {
                  disciplinas: {
                    include: {
                      disciplina: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!aluno) {
        throw new Error('Aluno não encontrado');
      }

      const bimestres = await prismaClient.bimestre.findMany({
        where: { anoLetivoId },
        orderBy: { numero: 'asc' }
      });

      const boletim = {
        aluno: {
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf
        },
        disciplinas: []
      };

      // Para cada disciplina da turma do aluno
      if (aluno.turmas.length > 0) {
        const turma = aluno.turmas[0].turma;
        
        for (const turmaDisciplina of turma.disciplinas) {
          const disciplina = turmaDisciplina.disciplina;

          // Buscar médias dos bimestres
          const mediasBimestres = await Promise.all(
            bimestres.map(async (bimestre) => {
              const media = await prismaClient.mediaBimestre.findUnique({
                where: {
                  alunoId_bimestreId_disciplinaId: {
                    alunoId,
                    bimestreId: bimestre.id,
                    disciplinaId: disciplina.id
                  }
                }
              });
              return {
                bimestre: bimestre.numero,
                media: media?.valor || 0
              };
            })
          );

          // Buscar situação final
          const situacao = await prismaClient.situacaoAluno.findUnique({
            where: {
              alunoId_disciplinaId_anoLetivoId: {
                alunoId,
                disciplinaId: disciplina.id,
                anoLetivoId
              }
            }
          });

          boletim.disciplinas.push({
            nome: disciplina.nome,
            codigo: disciplina.codigo,
            mediasBimestres,
            mediaFinal: situacao?.mediaFinal || 0,
            situacao: situacao?.situacao || 'EM_ANDAMENTO',
            pontosNecessarios: situacao?.pontosNecessarios,
            observacoes: situacao?.observacoes
          });
        }
      }

      return boletim;

    } catch (error) {
      console.error('Erro ao buscar boletim:', error);
      throw new Error('Não foi possível buscar o boletim do aluno');
    }
  }
}

export { CalculoMediaService, CONFIGURACAO };