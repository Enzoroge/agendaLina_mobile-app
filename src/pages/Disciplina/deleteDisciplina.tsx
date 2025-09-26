import React from 'react';
import { Alert } from 'react-native';
import { api } from '../../services/api';

interface Disciplina {
  id: number;
  nome: string;
}

interface DeleteDisciplinaProps {
  disciplina: Disciplina;
  onDelete: () => void;
}

export const deleteDisciplina = ({ disciplina, onDelete }: DeleteDisciplinaProps) => {
  const confirmarExclusao = () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a disciplina "${disciplina.nome}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: executarExclusao,
        },
      ]
    );
  };

  const executarExclusao = async () => {
    try {
      await api.delete(`/disciplina/${disciplina.id}`);
      
      console.log('✅ Disciplina excluída com sucesso! Chamando onDelete...');
      
      // Chama onDelete imediatamente após sucesso
      onDelete();
      
      Alert.alert(
        'Sucesso',
        'Disciplina excluída com sucesso!'
      );
    } catch (error: any) {
      console.log('Erro ao excluir disciplina:', error);
      
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
    return deleteDisciplina({ disciplina, onDelete });
  };
};