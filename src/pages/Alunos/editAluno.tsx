import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../services/api';

type Aluno = {
  id: number;
  userId: number;
  nome: string;
  dataNascimento: string | null;
  turmaId: number | null;
  responsavelId: number | null;
  situacao: string;
  responsavel?: {
    nome: string;
    telefone: string;
  } | null;
  responsaveis?: {
    nome: string;
    telefone: string;
  }[] | null;
  notas: {
    valor: number;
  }[];
  user: {
    role: string;
  };
  turma: {
    nome: string;
  } | null;
};

type Turma = {
  id: number;
  nome: string;
};

interface EditAlunoModalProps {
  visible: boolean;
  aluno: Aluno | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditAlunoModal({ visible, aluno, onClose, onUpdate }: EditAlunoModalProps) {
  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(false);

  // Buscar turmas disponíveis
  const fetchTurmas = async () => {
    try {
      setLoadingTurmas(true);
      const response = await api.get('/turmas');
      const turmasData = response.data.turmas || response.data || [];
      
      if (Array.isArray(turmasData)) {
        setTurmas(turmasData);
      } else {
        setTurmas([]);
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as turmas');
      setTurmas([]);
    } finally {
      setLoadingTurmas(false);
    }
  };

  // Carregar dados do aluno quando o modal abrir
  useEffect(() => {
    if (visible && aluno) {
      setNome(aluno.nome);
      setTurmaId(aluno.turmaId);
      fetchTurmas();
    }
  }, [visible, aluno]);

  // Função para atualizar o aluno
  const handleUpdate = async () => {
    if (!aluno) return;

    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do aluno');
      return;
    }

    if (!turmaId) {
      Alert.alert('Erro', 'Por favor, selecione uma turma');
      return;
    }

    try {
      setLoading(true);
      
      console.log('✏️ Tentando atualizar aluno:', {
        id: aluno.id,
        nome: nome.trim(),
        turmaId: turmaId,
      });
      console.log('✏️ URL da requisição:', `/aluno/${aluno.id}`);
      
      const response = await api.put(`/aluno/${aluno.id}`, {
        nome: nome.trim(),
        turmaId: turmaId,
      });
      
      console.log('✅ Resposta da atualização - Status:', response.status);
      console.log('✅ Resposta da atualização - Data:', response.data);

      Alert.alert(
        '✅ Sucesso',
        'Aluno atualizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              onUpdate();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erro detalhado ao atualizar aluno:', error);
      console.error('❌ Status do erro:', error.response?.status);
      console.error('❌ Dados do erro:', error.response?.data);
      console.error('❌ URL que falhou:', error.config?.url);
      
      Alert.alert(
        '❌ Erro',
        `Não foi possível atualizar o aluno. \nStatus: ${error.response?.status}\nDetalhes: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar e fechar o modal
  const handleCancel = () => {
    setNome('');
    setTurmaId(null);
    onClose();
  };

  if (!aluno) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✏️ Editar Aluno</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCancel}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.section}>
              <Text style={styles.inputLabel}>Nome do Aluno *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Digite o nome do aluno"
                placeholderTextColor="#999"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>Turma *</Text>
              {loadingTurmas ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando turmas...</Text>
                </View>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={turmaId}
                    onValueChange={(itemValue) => setTurmaId(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Selecione uma turma" value={null} />
                    {turmas.map((turma) => (
                      <Picker.Item
                        key={turma.id}
                        label={turma.nome}
                        value={turma.id}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>ℹ️ Informações do Sistema</Text>
              <Text style={styles.infoText}>• ID do Aluno: {aluno.id}</Text>
              <Text style={styles.infoText}>• Situação Atual: {aluno.situacao}</Text>
              <Text style={styles.infoText}>• Turma Atual: {aluno.turma?.nome || 'Não definida'}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Text>
            </TouchableOpacity>
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
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
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
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  loadingContainer: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});