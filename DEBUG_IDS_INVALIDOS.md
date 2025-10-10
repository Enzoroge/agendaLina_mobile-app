# 🐛 Debug: Problema com IDs Inválidos ao Selecionar Disciplinas

## 🚨 Problema Reportado
Quando o usuário seleciona uma disciplina, está recebendo a mensagem: **"Algumas disciplinas selecionadas têm IDs inválidos"**

## 🔍 Análise e Debug Implementado - ATUALIZADO

### **1. Sistema Completo de Logs Implementado**

#### **🔍 Na função abrirModalDisciplinas:**
```typescript
console.log('� Estado antes de abrir modal:', {
  professorSelecionado: professorSelecionado?.id,
  disciplinasDoProf: disciplinasDoProf.length,
  todasDisciplinas: todasDisciplinas.length
});

// Validação detalhada das disciplinas
const idsInvalidos = todasDisciplinas.filter(d => !isValidId(d.id));
if (idsInvalidos.length > 0) {
  console.warn('⚠️ Disciplinas com IDs inválidos encontradas:', idsInvalidos);
}

// Log de disciplinas válidas para o professor
const disciplinasDisponiveis = todasDisciplinas.filter(disciplina => 
  !disciplinasJaAssociadas.includes(disciplina.id)
);
console.log('� Disciplinas disponíveis para associar:', disciplinasDisponiveis.length);
```

#### **📚 Na função fetchTodasDisciplinas:**
```typescript
console.log('🔄 Buscando disciplinas da API...');
console.log('📚 Disciplinas recebidas:', response.data);

// Validação das disciplinas da API
if (Array.isArray(response.data)) {
  const disciplinasComIdsInvalidos = response.data.filter(d => !d || !isValidId(d.id));
  if (disciplinasComIdsInvalidos.length > 0) {
    console.warn('⚠️ Disciplinas com IDs inválidos recebidas da API:', disciplinasComIdsInvalidos);
  }
  
  // Filtrar apenas disciplinas válidas
  const disciplinasValidas = response.data.filter(d => d && isValidId(d.id));
  console.log('✅ Disciplinas válidas:', disciplinasValidas.length, 'de', response.data.length);
  setTodasDisciplinas(disciplinasValidas);
}
```

#### **🔄 Na função toggleDisciplina:**
```typescript
console.log('� Toggle disciplina:', { disciplinaId, tipo: typeof disciplinaId, valor: disciplinaId });

if (!isValidId(disciplinaId)) {
  console.error('❌ ID inválido passado para toggleDisciplina:', disciplinaId);
  Alert.alert('Erro', 'ID da disciplina é inválido.');
  return;
}

console.log('📋 Seleção atualizada:', {
  anterior: prev,
  disciplinaId,
  acao: isSelected ? 'removida' : 'adicionada',
  nova: newSelection
});
```

#### **💾 Na função salvarDisciplinas:**
```typescript
console.log('🔍 DEBUG - Validação de IDs:');
console.log('  📋 disciplinasSelecionadas:', disciplinasSelecionadas);
console.log('  🔢 Tipos dos IDs:', disciplinasSelecionadas.map(id => ({ id, tipo: typeof id, valor: id })));

// Validação robusta com logs detalhados
const disciplinasInvalidas = disciplinasSelecionadas.filter(id => {
  const invalid = !isValidId(id);
  if (invalid) {
    console.log('❌ ID inválido encontrado:', { id, tipo: typeof id, valor: id });
  }
  return invalid;
});
```

### **2. Função Auxiliar de Validação**
```typescript
const isValidId = (id: any): id is number => {
  return id !== null && id !== undefined && typeof id === 'number' && !isNaN(id) && id > 0;
};
```

### **3. Validação Simplificada**
```typescript
// ❌ Antes - Validação complexa que causava problemas de tipos
const disciplinasInvalidas = disciplinasSelecionadas.filter(id => !id || id <= 0);

// ✅ Agora - Validação específica para números
const disciplinasInvalidas = disciplinasSelecionadas.filter(id => {
  const invalid = !isValidId(id);
  if (invalid) {
    console.log('❌ ID inválido encontrado:', { id, tipo: typeof id, valor: id });
  }
  return invalid;
});
```

## 🧪 Como Fazer Debug

### **Passo 1: Abrir Console do Navegador**
1. Pressione F12 no navegador
2. Vá para a aba "Console"
3. Navegue até a página de professores

### **Passo 2: Reproduzir o Problema**
1. Clique no ícone de configurações de um professor
2. Tente selecionar uma disciplina
3. Observe os logs no console

### **Passo 3: Analisar os Logs**
Procure por estas mensagens de debug:
```
🖱️ Clique na disciplina: { disciplina: "Matemática", id: 1, tipo: "number", isDisabled: false }
🔄 Toggle disciplina: { disciplinaId: 1, tipo: "number", valor: 1 }
📋 Seleção atualizada: { anterior: [], disciplinaId: 1, acao: "adicionada", nova: [1] }
```

### **Passo 4: Verificar Validação**
Quando tentar salvar, observe:
```
🔍 DEBUG - Validação de IDs:
  📋 disciplinasSelecionadas: [1]
  🔢 Tipos dos IDs: [{ id: 1, tipo: "number", valor: 1 }]
```

## 🔧 Possíveis Causas e Soluções - ATUALIZADO

### **Causa 1: API retornando IDs inválidos**
**Sintoma:** 
```
⚠️ Disciplinas com IDs inválidos recebidas da API: [...]
✅ Disciplinas válidas: 3 de 5
```
**Solução:** Backend precisa corrigir query para não retornar disciplinas com ID null/0
```sql
-- Exemplo: corrigir query no backend
SELECT * FROM disciplinas WHERE id IS NOT NULL AND id > 0;
```

### **Causa 2: IDs chegando como string**
**Sintoma:** `tipo: "string"` nos logs da API
**Solução:** Converter para número no fetchTodasDisciplinas
```typescript
const disciplinasValidas = response.data
  .map(d => ({
    ...d,
    id: typeof d.id === 'string' ? parseInt(d.id, 10) : d.id
  }))
  .filter(d => d && isValidId(d.id));
```

### **Causa 3: Estado corrompido durante navegação**
**Sintoma:** `disciplinasSelecionadas` contém valores null/undefined
**Solução:** Limpar estado ao abrir modal
```typescript
const abrirModalDisciplinas = (professor) => {
  setDisciplinasSelecionadas([]); // Limpar seleção anterior
  // ... resto da função
};
```

### **Causa 4: Problema de sincronização entre estados**
**Sintoma:** IDs válidos aparecem como inválidos na validação
**Solução:** Aguardar carregamento completo
```typescript
useEffect(() => {
  if (modalDisciplinaVisible && professorSelecionado) {
    fetchTodasDisciplinas();
  }
}, [modalDisciplinaVisible, professorSelecionado]);
```

### **Causa 5: Filtro de disciplinas já associadas incorreto**
**Sintoma:** Disciplinas disponíveis vazias mesmo com dados válidos
**Solução:** Verificar se `disciplinasDoProf` está correto
```typescript
console.log('🔍 Disciplinas do professor:', disciplinasDoProf);
const disciplinasJaAssociadas = disciplinasDoProf.map(d => d.disciplinaId);
console.log('🚫 IDs já associados:', disciplinasJaAssociadas);
```

## 🎯 Ações de Correção Implementadas

### **✅ Validação Preventiva no Toggle**
```typescript
if (!isValidId(disciplinaId)) {
  console.error('❌ ID inválido passado para toggleDisciplina:', disciplinaId);
  Alert.alert('Erro', 'ID da disciplina é inválido.');
  return;
}
```

### **✅ Logs Detalhados para Debug**
- Log de cada clique em disciplina
- Log de cada toggle de seleção
- Log detalhado da validação
- Log dos tipos de dados

### **✅ Validação Robusta**
- Função auxiliar `isValidId()`
- Verificação de tipo, null, undefined e NaN
- Mensagens de erro específicas

## 📊 Resultados Esperados dos Logs

### **Cenário Normal (Funcionando):**
```
🖱️ Clique na disciplina: { disciplina: "Matemática", id: 1, tipo: "number", isDisabled: false }
🔄 Toggle disciplina: { disciplinaId: 1, tipo: "number", valor: 1 }
📋 Seleção atualizada: { anterior: [], disciplinaId: 1, acao: "adicionada", nova: [1] }
🔍 DEBUG - Validação de IDs:
  📋 disciplinasSelecionadas: [1]
  🔢 Tipos dos IDs: [{ id: 1, tipo: "number", valor: 1 }]
✅ Salvamento bem-sucedido
```

### **Cenário com Problema (Para Identificar):**
```
🖱️ Clique na disciplina: { disciplina: "Matemática", id: "1", tipo: "string", isDisabled: false }
❌ ID inválido passado para toggleDisciplina: "1"
```

OU

```
🔍 DEBUG - Validação de IDs:
  📋 disciplinasSelecionadas: [1, null, undefined]
  🔢 Tipos dos IDs: [{ id: 1, tipo: "number", valor: 1 }, { id: null, tipo: "object", valor: null }]
❌ ID inválido encontrado: { id: null, tipo: "object", valor: null }
```

## 🚀 Próximos Passos

1. **Execute o app** e reproduza o problema
2. **Verifique os logs** conforme documentado acima
3. **Identifique a causa** baseado nos logs
4. **Aplique a correção** específica para a causa encontrada
5. **Teste novamente** para confirmar a correção

Os logs detalhados agora devem mostrar exatamente onde e quando o problema está ocorrendo! 🔍