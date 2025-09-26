import React, { useEffect, useState, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, RefreshControl, TouchableOpacity, Modal, TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import RoleProtection from '../../components/RoleProtection';
import EditDisciplinaModal from './editDisciplina';
import { useDeleteDisciplina } from './deleteDisciplina';

type Disciplina = {
  id: number;
  nome: string;
  professorId?: number | null;
  professor: Professor[] | Professor | string | null;
  turma: string[];
  atividades: string[];
};

type Professor = {
  id: number;
  nome: string;
};  
   

export default function Disciplina() {
  const { user } = useContext(AuthContext);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para edição
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
  
  // Hook para deletar disciplina
  const executarDelete = useDeleteDisciplina();

  // Função helper para extrair nome do professor
  const getProfessorNome = (professor: Professor[] | Professor | string | null): string | null => {
    if (!professor) return null;
    
    if (typeof professor === 'string') return professor;
    
    if (Array.isArray(professor) && professor.length > 0) {
      return professor[0]?.nome || null;
    }
    
    if (typeof professor === 'object' && 'nome' in professor) {
      return professor.nome || null;
    }
    
    return null;
  };

  // Buscar disciplinas
  const fetchDisciplinas = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/disciplinas?t=${timestamp}`);
      
      if (Array.isArray(response.data)) {
        setDisciplinas(response.data);
      } else if (response.data && response.data.disciplinas) {
        setDisciplinas(response.data.disciplinas);
      } else {
        setDisciplinas([]);
      }
    } catch (error: any) {
      console.log('Erro ao buscar disciplinas:', error);
      if (error.message === 'Network Error') {
        Alert.alert('Erro de Conexão', 'Verifique sua internet e tente novamente');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as disciplinas');
      }
      setDisciplinas([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDisciplinas();
    setRefreshing(false);
  };

  // Adicionar nova disciplina
  const adicionarDisciplina = async () => {
    if (!novaDisciplina.trim()) {
      Alert.alert('Erro', 'Por favor, digite o nome da disciplina');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/disciplina', {
        nome: novaDisciplina.trim()
      });
      
      Alert.alert(
        'Sucesso!', 
        'Disciplina adicionada com sucesso',
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setNovaDisciplina('');
              fetchDisciplinas();
            }
          }
        ]
      );
    } catch (error: any) {
      console.log('Erro ao adicionar disciplina:', error);
      
      let errorMessage = 'Erro ao adicionar disciplina. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'Esta disciplina já existe.';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelarModal = () => {
    setModalVisible(false);
    setNovaDisciplina('');
  };

  // Função para abrir modal de edição
  const abrirEdicao = (disciplina: Disciplina) => {
    setDisciplinaSelecionada(disciplina);
    setEditModalVisible(true);
  };

  // Função para fechar modal de edição
  const fecharEdicao = () => {
    setEditModalVisible(false);
    setDisciplinaSelecionada(null);
  };

  // Função para lidar com exclusão
  const handleDelete = (disciplina: Disciplina) => {
    try {
      const deleteFunction = executarDelete(disciplina, fetchDisciplinas);
      deleteFunction();
    } catch (error) {
      console.log('Erro ao executar delete:', error);
    }
  };

  useEffect(() => {
    fetchDisciplinas();
  }, []);

  return (
    <RoleProtection 
      allowedRoles={['PROFESSOR', 'ADMIN', 'SECRETARIA']}
      fallbackMessage="Esta seção é apenas para professores e administradores.
Alunos podem acessar apenas os avisos."
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📚 Disciplinas</Text>
          <Text style={styles.headerSubtitle}>
            {disciplinas.length} {disciplinas.length === 1 ? 'disciplina' : 'disciplinas'} cadastradas
          </Text>
          
          {/* Botão Adicionar Disciplina */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Nova Disciplina</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Adicionar Disciplina */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={cancelarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📚 Nova Disciplina</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={cancelarModal}
                >
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Nome da Disciplina *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Matemática, Português, História..."
                  placeholderTextColor="#999"
                  value={novaDisciplina}
                  onChangeText={setNovaDisciplina}
                  autoCapitalize="words"
                  autoFocus={true}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={cancelarModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={adicionarDisciplina}
                    disabled={loading}
                  >
                    <Text style={styles.confirmButtonText}>
                      {loading ? 'Adicionando...' : 'Adicionar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Edição */}
        <EditDisciplinaModal
          visible={editModalVisible}
          disciplina={disciplinaSelecionada}
          onClose={fecharEdicao}
          onUpdate={fetchDisciplinas}
        />

        {/* Lista de Disciplinas */}
        <FlatList
          data={disciplinas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.disciplinaLeft}>
                  <View style={styles.disciplinaIcon}>
                    <Text style={styles.disciplinaIconText}>📖</Text>
                  </View>
                  <View style={styles.disciplinaInfo}>
                    <Text style={styles.disciplinaNome}>{item.nome}</Text>
                    <Text style={styles.disciplinaId}>ID: {item.id}</Text>
                  </View>
                </View>
                
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => abrirEdicao(item)}
                  >
                    <Feather name="edit-3" size={18} color="#007BFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                  >
                    <Feather name="trash-2" size={18} color="#DC3545" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Professor */}
              {getProfessorNome(item.professor) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👨‍🏫 Professor:</Text>
                  <Text style={styles.professorNome}>{getProfessorNome(item.professor)}</Text>
                </View>
              )}

              {/* Turmas */}
              {item.turma && item.turma.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏫 Turmas:</Text>
                  <View style={styles.tagContainer}>
                    {item.turma.map((turma, index) => (
                      <View key={index} style={[styles.tag, styles.turmaTag]}>
                        <Text style={styles.tagText}>{turma}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Atividades */}
              {item.atividades && item.atividades.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📝 Atividades:</Text>
                  <View style={styles.tagContainer}>
                    {item.atividades.map((atividade, index) => (
                      <View key={index} style={[styles.tag, styles.atividadeTag]}>
                        <Text style={styles.tagText}>{atividade}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Caso não tenha informações adicionais */}
              {!getProfessorNome(item.professor) && 
               (!item.turma || item.turma.length === 0) && 
               (!item.atividades || item.atividades.length === 0) && (
                <View style={styles.emptySection}>
                  <Text style={styles.emptyText}>📋 Informações adicionais não disponíveis</Text>
                </View>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>Nenhuma disciplina encontrada</Text>
              <Text style={styles.emptySubtitle}>
                As disciplinas aparecerão aqui após o cadastro
              </Text>
            </View>
          )}
        />
      </View>
    </RoleProtection>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#191970",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Estilos do Modal
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
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#191970",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  disciplinaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  disciplinaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f3e5f5",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  disciplinaIconText: {
    fontSize: 24,
  },
  disciplinaInfo: {
    flex: 1,
  },
  disciplinaNome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7b1fa2",
    marginBottom: 4,
  },
  disciplinaId: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  professorNome: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  turmaTag: {
    backgroundColor: "#FF9800",
  },
  atividadeTag: {
    backgroundColor: "#4CAF50",
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptySection: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderStyle: "dashed",
  },
  emptyText: {
    color: "#6c757d",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});