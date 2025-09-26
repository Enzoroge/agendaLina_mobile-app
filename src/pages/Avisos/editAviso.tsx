import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';

interface Aviso {
  id: number;
  titulo: string;
  descricao: string;
  craidoEm: string;
}

interface EditAvisoModalProps {
  visible: boolean;
  aviso: Aviso | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditAvisoModal({ 
  visible, 
  aviso, 
  onClose, 
  onUpdate 
}: EditAvisoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  // Atualiza os campos quando o aviso muda
  useEffect(() => {
    if (aviso) {
      setTitulo(aviso.titulo);
      setDescricao(aviso.descricao);
    }
  }, [aviso]);

  const atualizarAviso = async () => {
    if (!titulo.trim()) {
      Alert.alert('Erro', 'Por favor, insira o título do aviso');
      return;
    }

    if (!descricao.trim()) {
      Alert.alert('Erro', 'Por favor, insira a descrição do aviso');
      return;
    }

    if (!aviso) {
      Alert.alert('Erro', 'Aviso não encontrado');
      return;
    }

    // Verificar se houve alterações
    if (titulo.trim() === aviso.titulo && descricao.trim() === aviso.descricao) {
      Alert.alert('Info', 'Nenhuma alteração foi feita');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim()
      };
      
      console.log('📤 Enviando PUT para aviso ID:', aviso.id);
      console.log('📤 Payload:', payload);
      
      const response = await api.put(`/aviso/${aviso.id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('✅ Aviso atualizado com sucesso! Resposta:', response.data);
      
      // Chama onUpdate imediatamente após sucesso
      onUpdate();
      onClose();
      
      Alert.alert(
        'Sucesso', 
        'Aviso atualizado com sucesso!'
      );

    } catch (error: any) {
      console.log('❌ Erro ao atualizar aviso:', error);
      console.log('Status do erro:', error.response?.status);
      console.log('Dados do erro:', error.response?.data);
      console.log('Mensagem do erro:', error.message);
      
      let errorMessage = 'Não foi possível atualizar o aviso';
      
      if (error.response?.status === 400) {
        errorMessage = `Erro de validação: ${error.response?.data?.message || 'Dados inválidos'}`;
      } else if (error.response?.status === 404) {
        errorMessage = 'Aviso não encontrado';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para editar este aviso';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitulo('');
    setDescricao('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✏️ Editar Aviso</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Título *</Text>
            <TextInput
              style={styles.titleInput}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Digite o título do aviso"
              autoCapitalize="sentences"
              editable={!loading}
              multiline
            />

            <Text style={styles.inputLabel}>Descrição *</Text>
            <TextInput
              style={styles.descriptionInput}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Digite a descrição completa do aviso"
              autoCapitalize="sentences"
              editable={!loading}
              multiline
              textAlignVertical="top"
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton]}
                onPress={atualizarAviso}
                disabled={loading || !titulo.trim() || !descricao.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.updateButtonText}>Atualizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 15,
    minHeight: 50,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 25,
    minHeight: 100,
    maxHeight: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  updateButton: {
    backgroundColor: '#007BFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});