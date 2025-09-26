import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  StyleSheet 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';

interface Disciplina {
  id: number;
  nome: string;
}

interface EditDisciplinaModalProps {
  visible: boolean;
  disciplina: Disciplina | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditDisciplinaModal({ 
  visible, 
  disciplina, 
  onClose, 
  onUpdate 
}: EditDisciplinaModalProps) {
  const [nomeDisciplina, setNomeDisciplina] = useState('');
  const [loading, setLoading] = useState(false);

  // Atualiza o nome quando a disciplina muda
  React.useEffect(() => {
    if (disciplina) {
      setNomeDisciplina(disciplina.nome);
    }
  }, [disciplina]);

  const atualizarDisciplina = async () => {
    if (!nomeDisciplina.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome da disciplina');
      return;
    }

    if (!disciplina) {
      Alert.alert('Erro', 'Disciplina não encontrada');
      return;
    }

    try {
      setLoading(true);
      
      await api.put(`/disciplina/${disciplina.id}`, {
        nome: nomeDisciplina.trim()
      });

      console.log('✅ Disciplina atualizada com sucesso! Chamando onUpdate...');
      
      // Chama onUpdate imediatamente após sucesso
      onUpdate();
      onClose();
      
      Alert.alert(
        'Sucesso', 
        'Disciplina atualizada com sucesso!'
      );

    } catch (error) {
      console.log('Erro ao atualizar disciplina:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a disciplina');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNomeDisciplina('');
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
            <Text style={styles.modalTitle}>Editar Disciplina</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nome da Disciplina</Text>
            <TextInput
              style={styles.textInput}
              value={nomeDisciplina}
              onChangeText={setNomeDisciplina}
              placeholder="Digite o nome da disciplina"
              autoCapitalize="words"
              editable={!loading}
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
                onPress={atualizarDisciplina}
                disabled={loading || !nomeDisciplina.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.updateButtonText}>Atualizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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