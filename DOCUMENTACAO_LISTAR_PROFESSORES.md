# Serviço de Listagem de Professores

## 📋 Visão Geral

Este documento explica como usar o `ListarProfessorService` atualizado para funcionar com o schema Prisma atual do sistema de agenda escolar.

## 🗄️ Schema do Banco de Dados

O schema atual utiliza os seguintes relacionamentos:

### Professor
```prisma
model Professor {
  id     Int    @id @default(autoincrement())
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique

  turmas              TurmaProfessor[]      // N:N com Turma
  disciplinasLecionadas ProfessorDisciplina[] // N:N com Disciplina
  notas               Notas[]
}
```

### Relacionamentos N:N
- **TurmaProfessor**: Liga professores às turmas
- **ProfessorDisciplina**: Liga professores às disciplinas que lecionam

## 🛠️ Como Usar o Serviço

### No Frontend (React Native)

```typescript
import { ListarProfessorService } from '../services/ListarProfessorService';

const listarProfessorService = new ListarProfessorService();

// Buscar todos os professores
const fetchProfessores = async () => {
  try {
    const professores = await listarProfessorService.execute();
    console.log('Professores carregados:', professores);
    setProfessores(professores);
  } catch (error) {
    console.error('Erro ao carregar professores:', error);
  }
};
```

### No Backend (Node.js com Prisma)

```typescript
// controllers/professor/ListarProfessorController.ts
import { Request, Response } from 'express';
import { ListarProfessorService } from '../../services/professor/ListarProfessorService';

class ListarProfessorController {
    async handle(req: Request, res: Response) {
        const listarProfessorService = new ListarProfessorService();
        
        try {
            const professores = await listarProfessorService.execute();
            return res.json(professores);
        } catch (error) {
            return res.status(500).json({ 
                error: "Erro interno do servidor" 
            });
        }
    }
}

export { ListarProfessorController };
```

## 📝 Estrutura dos Dados Retornados

```typescript
interface Professor {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    telefone?: string;
  };
  turmas: {
    turma: {
      id: number;
      nome: string;
      ano: number;
    };
  }[];
  disciplinasLecionadas: {
    disciplina: {
      id: number;
      nome: string;
    };
  }[];
}
```

## 🎯 Consulta Prisma Utilizada

```typescript
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
      name: "asc"
    }
  }
});
```

## 🔄 Diferenças do Schema Anterior

### Mudanças Principais:
1. **Professor não tem campo `nome`** - usa `user.name`
2. **Relacionamento com disciplinas** - através de `disciplinasLecionadas` (ProfessorDisciplina)
3. **Relacionamento com turmas** - através de `turmas` (TurmaProfessor)
4. **Telefone** - movido para a tabela `User`

### Como Adaptar Código Existente:
```typescript
// ❌ Antes (schema antigo)
professor.nome
professor.disciplinas
professor.ProfessorDisciplina

// ✅ Agora (schema atual)
professor.user.name
professor.disciplinasLecionadas
professor.user.telefone
```

## 🚀 Exemplo de Uso Completo

```typescript
// Buscar e exibir professores
const professores = await listarProfessorService.execute();

professores.forEach(professor => {
  console.log(`👨‍🏫 ${professor.user.name}`);
  console.log(`📞 ${professor.user.telefone || 'Sem telefone'}`);
  console.log(`📚 Disciplinas: ${professor.disciplinasLecionadas.length}`);
  console.log(`🏫 Turmas: ${professor.turmas.length}`);
  
  // Listar disciplinas
  professor.disciplinasLecionadas.forEach(pd => {
    console.log(`  - ${pd.disciplina.nome}`);
  });
  
  // Listar turmas
  professor.turmas.forEach(pt => {
    console.log(`  - ${pt.turma.nome} (${pt.turma.ano})`);
  });
});
```

## 📱 Interface React Native Atualizada

A página de professores foi atualizada para:
- Exibir `user.name` em vez de `nome`
- Mostrar `user.telefone` quando disponível
- Usar `disciplinasLecionadas` para as disciplinas
- Manter compatibilidade com o sistema de gerenciamento de disciplinas

## 🔧 Troubleshooting

### Problema: Professor sem nome
**Solução**: Verificar se o relacionamento com `user` está sendo incluído na consulta.

### Problema: Disciplinas não aparecem
**Solução**: Verificar se `disciplinasLecionadas` está sendo incluído com `disciplina`.

### Problema: Telefone não aparece
**Solução**: Verificar se `user.telefone` está sendo selecionado na consulta.