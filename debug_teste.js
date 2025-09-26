// 🧪 Teste rápido para verificar se o endpoint existe
// Execute este comando no terminal para testar:

// Teste se o servidor está rodando:
// curl -X GET http://192.168.0.52:3333/professores

// Teste o endpoint PUT (substitua o ID 1 por um ID válido):
// curl -X PUT http://192.168.0.52:3333/professores/1/disciplinas \
//      -H "Content-Type: application/json" \
//      -d '{"disciplinaIds": [1, 2, 3]}'

// Se retornar 404, o endpoint não existe
// Se retornar 500, existe mas tem erro interno
// Se retornar 200/201, está funcionando

console.log('📋 Passos para debugar:');
console.log('1. Abra o app e tente associar disciplinas a um professor');
console.log('2. Veja os logs no console do React Native');
console.log('3. Verifique se o endpoint PUT /professores/:id/disciplinas existe no backend');
console.log('4. Se não existir, você precisa implementá-lo');
console.log('5. Se existir, verifique os logs do backend');

// Possíveis problemas:
console.log('❌ Possíveis causas do problema:');
console.log('1. Endpoint PUT /professores/:id/disciplinas não existe no backend');
console.log('2. Schema ProfessorDisciplina não foi criado no banco');  
console.log('3. Migration não foi executada');
console.log('4. Backend não está incluindo os relacionamentos corretos');
console.log('5. Problema de CORS ou autenticação');