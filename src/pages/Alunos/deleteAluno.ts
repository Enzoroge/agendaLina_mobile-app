import { Alert } from 'react-native';
import { api } from '../../services/api';

export const useDeleteAluno = () => {
  const deleteAluno = async (alunoId: number, onSuccess: () => void) => {
    Alert.alert(
      '🗑️ Confirmar Exclusão',
      `Tem certeza que deseja excluir este aluno?\n\n⚠️ ATENÇÃO: Esta ação irá:\n• Remover todas as notas do aluno\n• Remover vínculos com responsáveis\n• Excluir o registro do aluno\n• Excluir o usuário associado\n\nEsta ação não pode ser desfeita.`,
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
              console.log('🗑️ Deletando aluno com ID:', alunoId);
              
              const response = await api.delete(`/aluno/${alunoId}`);
              
              console.log('✅ Aluno deletado com sucesso');
              
              Alert.alert(
                '✅ Sucesso',
                'Aluno excluído com sucesso!',
                [{ text: 'OK', onPress: onSuccess }]
              );
            } catch (error: any) {
              console.error('❌ Erro ao deletar aluno:', error.response?.data || error.message);
              
              let errorMessage = 'Erro desconhecido';
              let suggestion = '';
              
              if (error.response?.status === 400) {
                errorMessage = 'Não foi possível excluir o aluno';
                suggestion = 'O aluno pode ter notas ou outros vínculos que impedem a exclusão.';
              } else if (error.response?.status === 404) {
                errorMessage = 'Aluno não encontrado';
                suggestion = 'O aluno pode já ter sido excluído.';
              } else if (error.response?.status === 500) {
                errorMessage = 'Erro interno do servidor';
                suggestion = 'Verifique se o aluno tem dependências (notas, atividades, etc.)';
              } else {
                errorMessage = error.response?.data?.message || 
                             error.response?.data?.error || 
                             error.message;
              }
              
              Alert.alert(
                '❌ Erro ao Excluir',
                `${errorMessage}\n\n${suggestion}`,
                [
                  { text: 'OK' },
                  {
                    text: 'Mais Detalhes',
                    onPress: () => {
                      console.log('Detalhes completos do erro:', error);
                      Alert.alert(
                        'Detalhes Técnicos',
                        `Status: ${error.response?.status}\nMensagem: ${JSON.stringify(error.response?.data, null, 2)}`
                      );
                    }
                  }
                ]
              );
            }
          },
        },
      ]
    );
  };

  return deleteAluno;
};