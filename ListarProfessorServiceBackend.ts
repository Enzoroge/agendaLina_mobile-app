// Este é um exemplo de como implementar o serviço no backend
// com base no seu schema Prisma atual

// Simular a interface do PrismaClient para não dar erro de importação
interface PrismaClient {
    professor: {
        findMany: (args: any) => Promise<any[]>;
    };
}

// Declarar o prisma client (seria importado no backend real)
declare const prisma: PrismaClient;

class ListarProfessorService {
    async execute() {
        console.log('🔄 Listando professores com disciplinas e turmas...');
        
        try {
            const professores = await prisma.professor.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            telefone: true
                        }
                    },
                    // Incluir disciplinas lecionadas através da tabela ProfessorDisciplina
                    disciplinasLecionadas: {
                        include: {
                            disciplina: {
                                select: {
                                    id: true,
                                    nome: true
                                }
                            }
                        }
                    },
                    // Incluir turmas através da tabela TurmaProfessor
                    turmas: {
                        include: {
                            turma: {
                                select: {
                                    id: true,
                                    nome: true,
                                    ano: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    user: {
                        name: "asc" as const
                    }
                }
            });

            console.log('👨‍🏫 Professores encontrados:', professores.length);
            
            if (professores.length > 0) {
                const primeiroProf = professores[0];
                console.log('📚 Exemplo de professor:', {
                    id: primeiroProf.id,
                    userName: primeiroProf.user.name,
                    userTelefone: primeiroProf.user.telefone,
                    totalDisciplinas: primeiroProf.disciplinasLecionadas.length,
                    totalTurmas: primeiroProf.turmas.length,
                    disciplinas: primeiroProf.disciplinasLecionadas.map((d: any) => d.disciplina.nome),
                    turmas: primeiroProf.turmas.map((t: any) => `${t.turma.nome} (${t.turma.ano})`)
                });
            }

            return professores;
        } catch (error: any) {
            console.log('❌ Erro ao listar professores:', error);
            throw new Error(`Erro ao buscar professores: ${error.message}`);
        }
    }
}

export { ListarProfessorService };