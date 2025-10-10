import { Alert } from 'react-native';
import { api } from '../../services/api';

export const useDeleteAlunoAlternative = () => {
  const deleteAluno = async (alunoId: number, onSuccess: () => void) => {
    Alert.alert(
      '🗑️ Confirmar Exclusão',
      `Tem certeza que deseja excluir este aluno?\n\nEsta ação irá:\n• Remover o aluno da turma\n• Remover todas as notas\n• Remover vínculos com responsáveis\n\nEsta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Iniciando exclusão do aluno ID:', alunoId);
              
              // Primeira tentativa: exclusão simples
              const response = await api.delete(`/aluno/${alunoId}`);
              
              console.log('✅ Aluno excluído com sucesso');
              
              Alert.alert(
                '✅ Sucesso',
                'Aluno excluído com sucesso!',
                [{ text: 'OK', onPress: onSuccess }]
              );
              
            } catch (error: any) {
              console.error('❌ Erro na primeira tentativa:', error.response?.data);
              
              // Se foi erro de constraint/foreign key, tentar alternativas
              if (error.response?.status === 400 || 
                  error.response?.status === 409 || 
                  error.response?.data?.code === 'P2003') {
                
                Alert.alert(
                  '⚠️ Dependências Encontradas',
                  'Este aluno possui vínculos que impedem a exclusão direta.\n\nDeseja tentar remover primeiro as dependências?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Sim, Limpar e Excluir', 
                      style: 'destructive',
                      onPress: () => forceDelete(alunoId, onSuccess)
                    }
                  ]
                );
              } else {
                // Outros tipos de erro
                const errorMessage = error.response?.data?.message || 
                                   error.response?.data?.error ||
                                   error.message ||
                                   'Erro desconhecido';
                
                Alert.alert(
                  '❌ Erro ao Excluir',
                  `${errorMessage}`,
                  [{ text: 'OK' }]
                );
              }
            }
          },
        },
      ]
    );
  };

  // Função para forçar exclusão (limpando dependências)
  const forceDelete = async (alunoId: number, onSuccess: () => void) => {
    try {
      console.log('🧹 Tentando limpeza forçada do aluno:', alunoId);
      
      // Você pode implementar uma rota especial no backend para isso
      // Por exemplo: DELETE /aluno/:id/force
      const response = await api.delete(`/aluno/${alunoId}/force`);
      
      console.log('✅ Exclusão forçada bem sucedida');
      
      Alert.alert(
        '✅ Sucesso',
        'Aluno excluído com sucesso!',
        [{ text: 'OK', onPress: onSuccess }]
      );
      
    } catch (error: any) {
      console.error('❌ Erro na exclusão forçada:', error.response?.data);
      
      Alert.alert(
        '❌ Erro Crítico',
        'Não foi possível excluir o aluno mesmo removendo dependências.\n\nContate o administrador do sistema.',
        [{ text: 'OK' }]
      );
    }
  };

  return deleteAluno;
};