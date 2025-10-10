// Tipos/Enums para substituir o @prisma/client temporariamente

export enum Role {
  ADMIN = 'ADMIN',
  SECRETARIA = 'SECRETARIA',
  PROFESSOR = 'PROFESSOR',
  ALUNO = 'ALUNO',
  RESPONSAVEL = 'RESPONSAVEL'
}

export enum Turno {
  MANHA = 'MANHA',
  TARDE = 'TARDE',
  NOITE = 'NOITE',
  INTEGRAL = 'INTEGRAL'
}

export enum Parentesco {
  PAI = 'PAI',
  MAE = 'MAE',
  RESPONSAVEL_LEGAL = 'RESPONSAVEL_LEGAL',
  TUTOR = 'TUTOR',
  AVO = 'AVO',
  TIO = 'TIO',
  IRMAO = 'IRMAO',
  OUTRO = 'OUTRO'
}

export enum TipoAtividade {
  PROVA = 'PROVA',
  TRABALHO = 'TRABALHO',
  EXERCICIO = 'EXERCICIO',
  PARTICIPACAO = 'PARTICIPACAO',
  PROJETO = 'PROJETO',
  SEMINARIO = 'SEMINARIO',
  RECUPERACAO = 'RECUPERACAO'
}

export enum Bimestre {
  PRIMEIRO = 'PRIMEIRO',
  SEGUNDO = 'SEGUNDO',
  TERCEIRO = 'TERCEIRO',
  QUARTO = 'QUARTO'
}

export enum SituacaoBimestre {
  APROVADO = 'APROVADO',        // Média >= 7.0
  RECUPERACAO = 'RECUPERACAO',  // Média >= 5.0 e < 7.0
  REPROVADO = 'REPROVADO'       // Média < 5.0
}

export enum SituacaoFinal {
  APROVADO = 'APROVADO',                      // Média anual >= 7.0
  RECUPERACAO_FINAL = 'RECUPERACAO_FINAL',    // Média anual >= 5.0 e < 7.0
  REPROVADO_NOTA = 'REPROVADO_NOTA',          // Média anual < 5.0
  REPROVADO_FALTA = 'REPROVADO_FALTA',        // Muitas faltas (>25% das aulas)
  REPROVADO_NOTA_FALTA = 'REPROVADO_NOTA_FALTA' // Reprovado por nota e falta
}

export enum Urgencia {
  BAIXA = 'BAIXA',
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

// Interfaces dos modelos
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  mustChangePassword: boolean;
  ativo: boolean;
  professor?: Professor;
  aluno?: Aluno;
  responsavel?: Responsavel;
  avisosCriados?: Avisos[];
}

export interface Turma {
  id: number;
  nome: string;
  ano: number;
  serie: string;
  turno: Turno;
  ativa: boolean;
  professores?: TurmaProfessor[];
  alunos?: Aluno[];
  disciplinas?: TurmaDisciplina[];
}

export interface Professor {
  id: number;
  userId: number;
  nome: string;
  telefone?: string;
  especialidade?: string;
  ativo: boolean;
  user?: User;
  turmas?: TurmaProfessor[];
  disciplinas?: TurmaDisciplina[];
  atividades?: Atividade[];
  notas?: Nota[];
}

export interface TurmaProfessor {
  turmaId: number;
  professorId: number;
  turma?: Turma;
  professor?: Professor;
}

export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  cargaHoraria: number;
  ativa: boolean;
  turmas?: TurmaDisciplina[];
  atividades?: Atividade[];
}

export interface TurmaDisciplina {
  turmaId: number;
  disciplinaId: number;
  professorId: number;
  turma?: Turma;
  disciplina?: Disciplina;
  professor?: Professor;
}

export interface Aluno {
  id: number;
  userId: number;
  nome: string;
  dataNascimento?: Date;
  matricula: string;
  turmaId?: number;
  ativo: boolean;
  user?: User;
  turma?: Turma;
  notas?: Nota[];
  medias?: MediaBimestre[];
  mediaFinal?: MediaFinal[];
  responsaveis?: AlunoResponsavel[];
}

export interface Responsavel {
  id: number;
  userId: number;
  nome: string;
  telefone: string;
  email: string;
  parentesco: Parentesco;
  ativo: boolean;
  user?: User;
  alunos?: AlunoResponsavel[];
}

export interface AlunoResponsavel {
  alunoId: number;
  responsavelId: number;
  aluno?: Aluno;
  responsavel?: Responsavel;
}

export interface Atividade {
  id: number;
  titulo: string;
  descricao: string;
  tipo: TipoAtividade;
  peso: number;
  valorMaximo: number;
  dataVencimento?: Date;
  bimestre: Bimestre;
  disciplinaId: number;
  professorId: number;
  disciplina?: Disciplina;
  professor?: Professor;
  notas?: Nota[];
}

export interface Nota {
  id: number;
  valor: number;
  observacao?: string;
  dataLancamento: Date;
  alunoId: number;
  atividadeId: number;
  professorId: number;
  aluno?: Aluno;
  atividade?: Atividade;
  professor?: Professor;
}

export interface MediaBimestre {
  id: number;
  bimestre: Bimestre;
  disciplina: string;
  disciplinaId: number;
  media: number;
  faltas: number;
  situacao: SituacaoBimestre;
  observacao?: string;
  alunoId: number;
  aluno?: Aluno;
}

export interface MediaFinal {
  id: number;
  disciplina: string;
  disciplinaId: number;
  mediaAnual: number;
  totalFaltas: number;
  situacaoFinal: SituacaoFinal;
  pontosRecuperacao?: number;
  observacao?: string;
  alunoId: number;
  aluno?: Aluno;
}

export interface Avisos {
  id: number;
  titulo: string;
  descricao: string;
  urgencia: Urgencia;
  criadoEm: Date;
  atualizadoEm: Date;
  ativo: boolean;
  criadoPorId: number;
  criadoPor?: User;
}