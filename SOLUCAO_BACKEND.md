// 🚀 SOLUÇÃO: Implementação do endpoint no backend

// 1. ===== CONTROLLER =====
// Arquivo: controllers/professorDisciplina/UpdateProfessorDisciplinasController.ts

import {Request, Response} from "express";
import UpdateProfessorDisciplinasService from '../../services/professorDisciplina/UpdateProfessorDisciplinasService';

class UpdateProfessorDisciplinasController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params; // ID do professor
            const { disciplinaIds } = req.body; // Array de IDs das disciplinas
            
            if (!disciplinaIds || !Array.isArray(disciplinaIds)) {
                return res.status(400).json({ 
                    error: "disciplinaIds deve ser um array" 
                });
            }

            const professorId = parseInt(id);
            if (isNaN(professorId)) {
                return res.status(400).json({ 
                    error: "ID do professor inválido" 
                });
            }

            const updateProfessorDisciplinasService = new UpdateProfessorDisciplinasService();
            
            const result = await updateProfessorDisciplinasService.execute({ 
                professorId, 
                disciplinaIds 
            });
            
            return res.json({ 
                success: true, 
                message: "Disciplinas atualizadas com sucesso",
                data: result
            });
            
        } catch (error: any) {
            console.error('Erro no UpdateProfessorDisciplinasController:', error);
            return res.status(500).json({ 
                error: error.message || "Erro interno do servidor" 
            });
        }
    }
}

export { UpdateProfessorDisciplinasController };

// 2. ===== SERVICE =====
// Arquivo: services/professorDisciplina/UpdateProfessorDisciplinasService.ts

import prismaClient from "../../prisma";

interface UpdateProfessorDisciplinasRequest {
    professorId: number;
    disciplinaIds: number[];
}

class UpdateProfessorDisciplinasService {
    async execute({ professorId, disciplinaIds }: UpdateProfessorDisciplinasRequest) {
        // Verificar se o professor existe
        const professor = await prismaClient.professor.findUnique({
            where: { id: professorId }
        });

        if (!professor) {
            throw new Error("Professor não encontrado");
        }

        // Usar transação para garantir consistência
        const result = await prismaClient.$transaction(async (tx) => {
            // 1. Remover todas as associações antigas deste professor
            await tx.professorDisciplina.deleteMany({
                where: { professorId: professorId }
            });

            // 2. Criar novas associações se houver disciplinas
            if (disciplinaIds.length > 0) {
                const dataToCreate = disciplinaIds.map(disciplinaId => ({
                    professorId: professorId,
                    disciplinaId: disciplinaId
                }));

                await tx.professorDisciplina.createMany({
                    data: dataToCreate
                });
            }

            return {
                professorId,
                totalDisciplinas: disciplinaIds.length
            };
        });

        return result;
    }
}

export default UpdateProfessorDisciplinasService;

// 3. ===== ROTA =====
// No seu arquivo de rotas (routes.ts), adicione:

import { UpdateProfessorDisciplinasController } from './controllers/professorDisciplina/UpdateProfessorDisciplinasController';

const updateProfessorDisciplinasController = new UpdateProfessorDisciplinasController();

// PUT /professores/:id/disciplinas
router.put('/professores/:id/disciplinas', updateProfessorDisciplinasController.handle);

// 4. ===== COMO USAR =====
// PUT http://localhost:3333/professores/1/disciplinas
// Content-Type: application/json
// {
//   "disciplinaIds": [1, 2, 3]
// }