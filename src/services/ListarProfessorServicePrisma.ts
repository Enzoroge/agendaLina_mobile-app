// Nota: Este serviço funciona diretamente com o Prisma Client
// Para uso no backend/servidor Node.js

interface PrismaClientInterface {
    professor: {
        findMany: (args: any) => Promise<any[]>;
    };
}

// Simulação da estrutura do prismaClient para TypeScript
declare const prismaClient: PrismaClientInterface;

class ListarProfessorServicePrisma {
    async execute() {
        console.log('🔄 Listando professores com disciplinas...');
        
        try {
            const professores = await prismaClient.professor.findMany({
                include: {
                    user: {
                        select: {
                            name: true,
                            role: true,
                            // Incluindo o telefone do usuário se existir no schema
                            // telefone: true // Descomente se o campo existir na tabela User
                        }
                    },
                    // Incluindo disciplinas através da tabela de junção TurmaDisciplina
                    disciplinas: {
                        select: {
                            disciplina: {
                                select: {
                                    id: true,
                                    nome: true,
                                    codigo: true
                                }
                            }
                        }
                    },
                    // Incluindo turmas através da tabela de junção TurmaProfessor
                    turmas: {
                        select: {
                            turma: {
                                select: {
                                    id: true,
                                    nome: true,
                                    ano: true,
                                    serie: true,
                                    turno: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    user: {
                        name: "asc"
                    }
                }
            });

            console.log('👨‍🏫 Professores encontrados:', professores.length);
            
            if (professores.length > 0) {
                console.log('📚 Exemplo de professor com disciplinas:', {
                    id: professores[0].id,
                    nome: professores[0].nome,
                    user: professores[0].user,
                    totalDisciplinas: professores[0].disciplinas?.length || 0,
                    totalTurmas: professores[0].turmas?.length || 0,
                    primeiraDisciplina: professores[0].disciplinas?.[0]?.disciplina,
                    primeiraTurma: professores[0].turmas?.[0]?.turma
                });
            }

            return professores;
        } catch (error: any) {
            console.log('❌ Erro ao listar professores:', error);
            throw new Error(`Erro ao buscar professores: ${error.message}`);
        }
    }
}

export { ListarProfessorServicePrisma };