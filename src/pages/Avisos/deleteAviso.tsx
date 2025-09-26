import React from 'react';
import { Alert } from 'react-native';
import { api } from '../../services/api';

interface Aviso {
  id: number;
  titulo: string;
  descricao: string;
  craidoEm: string;
}

interface DeleteAvisoProps {
  aviso: Aviso;
  onDelete: () => void;
}

export const deleteAviso = ({ aviso, onDelete }: DeleteAvisoProps) => {
  const confirmarExclusao = () => {
    console.log('🗑️ Confirmando exclusão do aviso:', aviso.titulo);
    
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o aviso "${aviso.titulo}"?\n\nEsta ação não pode ser desfeita.`,
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
    console.log('🔥 Executando exclusão do aviso ID:', aviso.id);
    console.log('🔥 URL de delete:', `/aviso/${aviso.id}`);
    
    try {
      const response = await api.delete(`/aviso/${aviso.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('✅ Resposta da API delete - Status:', response.status);
      console.log('✅ Resposta da API delete - Data:', response.data);
      
      console.log('✅ Aviso excluído com sucesso! Chamando onDelete...');
      
      // Chama onDelete imediatamente após sucesso
      onDelete();
      
      Alert.alert(
        'Sucesso',
        'Aviso excluído com sucesso!'
      );
    } catch (error: any) {
      console.log('❌ Erro ao excluir aviso:', error);
      console.log('Status do erro:', error.response?.status);
      console.log('Dados do erro:', error.response?.data);
      console.log('Mensagem do erro:', error.message);
      
      let errorMessage = 'Não foi possível excluir o aviso';
      
      if (error.response?.status === 400) {
        errorMessage = 'Este aviso não pode ser excluído';
      } else if (error.response?.status === 404) {
        errorMessage = 'Aviso não encontrado';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para excluir este aviso';
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };

  return confirmarExclusao;
};

// Hook personalizado para facilitar o uso
export const useDeleteAviso = () => {
  return (aviso: Aviso, onDelete: () => void) => {
    console.log('🪝 Hook useDeleteAviso chamado para:', aviso.titulo);
    console.log('Callback onDelete tipo:', typeof onDelete);
    
    return deleteAviso({ aviso, onDelete });
  };
};