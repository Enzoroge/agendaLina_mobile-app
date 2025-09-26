import { Alert } from 'react-native';
import { api } from '../../services/api';

export const useDeleteAluno = () => {
  const deleteAluno = async (alunoId: number, onSuccess: () => void) => {
    Alert.alert(
      '🗑️ Confirmar Exclusão',
      `Tem certeza que deseja excluir este aluno?\n\nEsta ação não pode ser desfeita.`,
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
              await api.delete(`/aluno/${alunoId}`);
              
              Alert.alert(
                '✅ Sucesso',
                'Aluno excluído com sucesso!',
                [{ text: 'OK', onPress: onSuccess }]
              );
            } catch (error) {
              console.error('Erro ao excluir aluno:', error);
              Alert.alert(
                '❌ Erro',
                'Não foi possível excluir o aluno. Tente novamente.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return deleteAluno;
};