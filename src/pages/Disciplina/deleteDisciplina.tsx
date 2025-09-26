import React from 'react';
import { Alert } from 'react-native';
import { api } from '../../services/api';

interface Disciplina {
  id: number;
  nome: string;
  professorId?: number | null;
}

interface DeleteDisciplinaProps {
  disciplina: Disciplina;
  onDelete: () => void;
}

export const deleteDisciplina = ({ disciplina, onDelete }: DeleteDisciplinaProps) => {
  const confirmarExclusao = () => {
    console.log('🗑️ Confirmando exclusão da disciplina:', disciplina.nome);
    
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a disciplina "${disciplina.nome}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => console.log('❌ Exclusão cancelada'),
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            console.log('✅ Usuário confirmou exclusão');
            executarExclusao();
          },
        },
      ]
    );
  };

  const executarExclusao = async () => {
    console.log('🔥 Executando exclusão da disciplina ID:', disciplina.id);
    console.log('🔥 URL de delete:', `/disciplina/${disciplina.id}`);
    
    try {
      const response = await api.delete(`/disciplina/${disciplina.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('✅ Resposta da API delete - Status:', response.status);
      console.log('✅ Resposta da API delete - Data:', response.data);
      
      console.log('✅ Disciplina excluída com sucesso! Chamando onDelete...');
      
      // Chama onDelete imediatamente após sucesso
      onDelete();
      
      Alert.alert(
        'Sucesso',
        'Disciplina excluída com sucesso!'
      );
    } catch (error: any) {
      console.log('❌ Erro ao excluir disciplina:', error);
      console.log('Status do erro:', error.response?.status);
      console.log('Dados do erro:', error.response?.data);
      console.log('Mensagem do erro:', error.message);
      
      let errorMessage = 'Não foi possível excluir a disciplina';
      
      if (error.response?.status === 400) {
        errorMessage = 'Esta disciplina não pode ser excluída pois está sendo utilizada';
      } else if (error.response?.status === 404) {
        errorMessage = 'Disciplina não encontrada';
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };

  return confirmarExclusao;
};

// Hook personalizado para facilitar o uso
export const useDeleteDisciplina = () => {
  return (disciplina: Disciplina, onDelete: () => void) => {
    console.log('🪝 Hook useDeleteDisciplina chamado para:', disciplina.nome);
    console.log('Callback onDelete tipo:', typeof onDelete);
    
    return deleteDisciplina({ disciplina, onDelete });
  };
};