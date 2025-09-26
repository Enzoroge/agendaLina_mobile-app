// 🎯 SOLUÇÃO ALTERNATIVA SIMPLES (caso você queira uma versão mais direta)

// Se você quiser uma versão mais simples, pode adicionar diretamente no seu arquivo de rotas:

router.put('/professores/:id/disciplinas', async (req, res) => {
    try {
        const { id } = req.params;
        const { disciplinaIds } = req.body;

        const professorId = parseInt(id);
        
        if (!disciplinaIds || !Array.isArray(disciplinaIds)) {
            return res.status(400).json({ error: "disciplinaIds deve ser um array" });
        }

        // Verificar se o professor existe
        const professor = await prismaClient.professor.findUnique({
            where: { id: professorId }
        });

        if (!professor) {
            return res.status(404).json({ error: "Professor não encontrado" });
        }

        // Usar transação para atualizar disciplinas
        await prismaClient.$transaction(async (tx) => {
            // Remover associações antigas
            await tx.professorDisciplina.deleteMany({
                where: { professorId: professorId }
            });

            // Criar novas associações se houver disciplinas
            if (disciplinaIds.length > 0) {
                const dataToCreate = disciplinaIds.map(disciplinaId => ({
                    professorId: professorId,
                    disciplinaId: disciplinaId
                }));

                await tx.professorDisciplina.createMany({
                    data: dataToCreate
                });
            }
        });

        res.json({ 
            success: true, 
            message: "Disciplinas atualizadas com sucesso" 
        });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});