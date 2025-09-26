import React, { useEffect, useState, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, RefreshControl, Modal, TouchableOpacity, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import RoleProtection from '../../components/RoleProtection';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Professor = {
  id: number;
  userId: number;
  nome: string;
  disciplinas: Disciplina[]; // relacionamento direto 1:N ainda existe
  turmas: { turma: Turma }[]; // vem do relacionamento N:N TurmaProfessor
  ProfessorDisciplina: {
    disciplina: Disciplina;
  }[]; // relacionamento N:N através da tabela de junção
};

type Turma = {
  id: number;
  nome: string;
};

type Disciplina = {
  id: number;
  nome: string;
  professorId?: number | null; // relacionamento direto 1:N ainda existe  
  professor?: {
    id: number;
    nome: string;
  } | null;
  ProfessorDisciplina: {
    professor: Professor;
  }[]; // relacionamento N:N através da tabela de junção
};

export default function Professores() {
  const { user } = useContext(AuthContext);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para o modal de disciplinas
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [todasDisciplinas, setTodasDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar todas as disciplinas disponíveis
  const fetchTodasDisciplinas = async () => {
    try {
      console.log('🔄 Buscando disciplinas da API...');
      const response = await api.get('/disciplinas'); 
      console.log('📚 Disciplinas recebidas:', response.data);
      setTodasDisciplinas(response.data);
    } catch (error: any) {
      console.log('❌ Erro ao buscar disciplinas:', error);
      console.log('❌ Resposta do erro:', error.response?.data);
      Alert.alert('Erro', 'Não foi possível carregar as disciplinas');
    }
  };

  // Abrir modal para gerenciar disciplinas do professor
  const abrirModalDisciplinas = async (professor: Professor) => {
    console.log('🔓 Abrindo modal para o professor:', professor);
    console.log('📚 Disciplinas atuais do professor:', professor.disciplinas);
    console.log('🔗 ProfessorDisciplina do professor:', professor.ProfessorDisciplina);
    
    setSelectedProfessor(professor);
    
    // Combinar disciplinas do relacionamento direto e da tabela de junção
    const disciplinasDoRelacionamentoDireto = professor.disciplinas?.map(d => d.id) || [];
    const disciplinasDaJuncao = professor.ProfessorDisciplina?.map(pd => pd.disciplina.id) || [];
    
    // Criar um Set para evitar duplicatas
    const todasDisciplinasIds = new Set([...disciplinasDoRelacionamentoDireto, ...disciplinasDaJuncao]);
    const disciplinasJaSelecionadas = Array.from(todasDisciplinasIds);
    
    console.log('✅ Disciplinas diretas IDs:', disciplinasDoRelacionamentoDireto);
    console.log('🔗 Disciplinas da junção IDs:', disciplinasDaJuncao);
    console.log('📋 Disciplinas combinadas pré-selecionadas:', disciplinasJaSelecionadas);
    
    setDisciplinasSelecionadas(disciplinasJaSelecionadas);
    
    console.log('🔄 Buscando todas as disciplinas disponíveis...');
    await fetchTodasDisciplinas();
    setModalVisible(true);
  };

  // Toggle seleção de disciplina
  const toggleDisciplina = (disciplinaId: number) => {
    setDisciplinasSelecionadas(prev => 
      prev.includes(disciplinaId)
        ? prev.filter(id => id !== disciplinaId)
        : [...prev, disciplinaId]
    );
  };

  // Salvar associações de disciplinas
  const salvarDisciplinas = async () => {
    if (!selectedProfessor) return;

    console.log('🔄 Iniciando salvamento das disciplinas...');
    console.log('📝 Professor selecionado:', selectedProfessor);
    console.log('📚 Disciplinas selecionadas:', disciplinasSelecionadas);

    setLoading(true);
    try {
      // Usar a rota POST que existe no backend: /associar-professor-disciplina
      const requestData = {
        professorId: selectedProfessor.id,
        disciplinaId: disciplinasSelecionadas
      };
      
      console.log('📤 Dados sendo enviados para /associar-professor-disciplina:', requestData);
      
      const response = await api.post('/associar-professor-disciplina', requestData);
      
      console.log('✅ Resposta da API:', response.data);
      console.log('✅ Status da resposta:', response.status);
      
      Alert.alert('Sucesso', 'Disciplinas atualizadas com sucesso!');
      setModalVisible(false);
      await fetchProfessores(); // Atualizar lista de professores
    } catch (error: any) {
      console.log('❌ === ERRO DETALHADO AO SALVAR DISCIPLINAS ===');
      console.log('❌ Erro completo:', error);
      console.log('❌ URL tentada:', error.config?.url);
      console.log('❌ Método usado:', error.config?.method);
      console.log('❌ Dados enviados:', error.config?.data);
      console.log('❌ Status do erro:', error.response?.status);
      console.log('❌ Resposta do erro:', error.response?.data);
      console.log('❌ Mensagem do erro:', error.message);
      console.log('❌ ================================================');
      
      // Mostrar detalhes do erro para debug
      let errorMessage = 'Erro desconhecido';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique se a rota existe no backend.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || error.response?.data?.message || 'Dados inválidos';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', `Não foi possível salvar as disciplinas.\n\nDetalhes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Buscar professores
  const fetchProfessores = async () => {
    try {
      console.log('🔄 Buscando professores da API...');
      const response = await api.get('/professores');
      console.log('👨‍🏫 Professores recebidos:', response.data);
      
      // Log detalhado do primeiro professor para debug
      if (response.data && response.data.length > 0) {
        const primeiroProf = response.data[0];
        console.log('🔍 PRIMEIRO PROFESSOR DETALHADO:');
        console.log('  📋 ID:', primeiroProf.id);
        console.log('  👤 Nome:', primeiroProf.nome);
        console.log('  📚 Disciplinas diretas:', JSON.stringify(primeiroProf.disciplinas, null, 2));
        console.log('  🔗 ProfessorDisciplina:', JSON.stringify(primeiroProf.ProfessorDisciplina, null, 2));
        console.log('  👥 Turmas:', JSON.stringify(primeiroProf.turmas, null, 2));
      }
      
      setProfessores(response.data);
    } catch (error: any) {
      console.log('❌ Erro ao buscar professores:', error);
      console.log('❌ Resposta do erro:', error.response?.data);
      Alert.alert('Erro', 'Não foi possível carregar os professores');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfessores();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfessores();
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
        <Text style={styles.headerTitle}>👨‍🏫 Professores</Text>
        <Text style={styles.headerSubtitle}>
          {professores.length} {professores.length === 1 ? 'professor' : 'professores'} cadastrados
        </Text>
      </View>

      {/* Lista de Professores */}
      <FlatList
        data={professores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.professorIcon}>
                <Text style={styles.professorIconText}>👨‍🏫</Text>
              </View>
              <View style={styles.professorInfo}>
                <Text style={styles.professorName}>{item.nome}</Text>
                <Text style={styles.professorId}>ID: {item.id}</Text>
              </View>
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => abrirModalDisciplinas(item)}
              >
                <Feather name="settings" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Disciplinas - usar dados da tabela de junção ProfessorDisciplina */}
            {(() => {
              // Combinar disciplinas do relacionamento direto e da tabela de junção
              const disciplinasDoRelacionamentoDireto = item.disciplinas || [];
              const disciplinasDaJuncao = item.ProfessorDisciplina?.map(pd => pd.disciplina) || [];
              
              // Criar um array com todas as disciplinas, removendo duplicatas pelo ID
              const mapDisciplinas = new Map();
              
              // Adicionar disciplinas diretas
              disciplinasDoRelacionamentoDireto.forEach(disciplina => {
                mapDisciplinas.set(disciplina.id, disciplina);
              });
              
              // Adicionar disciplinas da junção
              disciplinasDaJuncao.forEach(disciplina => {
                if (disciplina && disciplina.id && disciplina.nome) {
                  mapDisciplinas.set(disciplina.id, disciplina);
                }
              });
              
              const todasDisciplinas = Array.from(mapDisciplinas.values());

              console.log('🔍 Professor:', item.nome, '(ID:', item.id, ')');
              console.log('📚 Disciplinas diretas:', disciplinasDoRelacionamentoDireto);
              console.log('🔗 Disciplinas da junção:', disciplinasDaJuncao);
              console.log('📋 Todas as disciplinas combinadas:', todasDisciplinas);

              return todasDisciplinas.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    📚 Disciplinas ({todasDisciplinas.length}):
                  </Text>
                  <View style={styles.tagContainer}>
                    {todasDisciplinas.map((d) => (
                      <View key={`disciplina-${d.id}`} style={styles.tag}>
                        <Text style={styles.tagText}>{d.nome}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* Turmas */}
            {item.turmas && item.turmas.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 Turmas:</Text>
                <View style={styles.tagContainer}>
                  {item.turmas.map((t) => (
                    <View key={t.turma.id} style={[styles.tag, styles.turmaTag]}>
                      <Text style={styles.tagText}>{t.turma.nome}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Caso não tenha disciplinas ou turmas */}
            {(() => {
              const disciplinasDoRelacionamentoDireto = item.disciplinas || [];
              const disciplinasDaJuncao = item.ProfessorDisciplina?.map(pd => pd.disciplina) || [];
              const todasDisciplinas = [...disciplinasDoRelacionamentoDireto];
              disciplinasDaJuncao.forEach(disc => {
                if (!todasDisciplinas.find(d => d.id === disc.id)) {
                  todasDisciplinas.push(disc);
                }
              });

              const temDisciplinas = todasDisciplinas.length > 0;
              const temTurmas = item.turmas && item.turmas.length > 0;

              return !temDisciplinas && !temTurmas && (
                <View style={styles.emptySection}>
                  <Text style={styles.emptyText}>📋 Nenhuma disciplina ou turma atribuída</Text>
                </View>
              );
            })()}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👨‍🏫</Text>
            <Text style={styles.emptyTitle}>Nenhum professor encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Os professores aparecerão aqui após o cadastro
            </Text>
          </View>
        )}
      />

      {/* Modal para gerenciar disciplinas */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Gerenciar Disciplinas
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedProfessor?.nome}
            </Text>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Selecione as disciplinas:</Text>
            
            {todasDisciplinas.map((disciplina) => {
              // Com o schema híbrido N:N, múltiplos professores podem ter a mesma disciplina
              // Vamos mostrar se outros professores também têm esta disciplina
              const temOutrosProfessores = !!(disciplina.professorId && disciplina.professorId !== selectedProfessor?.id);
              const isSelected = disciplinasSelecionadas.includes(disciplina.id);
              
              return (
                <TouchableOpacity
                  key={disciplina.id}
                  style={[
                    styles.disciplinaItem,
                    temOutrosProfessores && styles.disciplinaComOutrosProfessores
                  ]}
                  onPress={() => toggleDisciplina(disciplina.id)}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && (
                        <Feather name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.disciplinaNome}>
                        {disciplina.nome}
                      </Text>
                      {temOutrosProfessores && disciplina.professor && (
                        <Text style={styles.outrosProfessores}>
                          Também atribuída a: {disciplina.professor.nome}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={salvarDisciplinas}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderLeftColor: "#2196F3",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  professorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  professorIconText: {
    fontSize: 24,
  },
  professorInfo: {
    flex: 1,
  },
  professorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#191970",
    marginBottom: 4,
  },
  professorId: {
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
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  turmaTag: {
    backgroundColor: "#FF9800",
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
  // Estilos para o botão de gerenciar
  manageButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  // Estilos do modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#191970',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  disciplinaItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  disciplinaAtribuida: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disciplinaComOutrosProfessores: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0', // Roxo para indicar compartilhamento
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  disciplinaNome: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  disciplinaNomeDisabled: {
    color: '#999',
  },
  professorAtribuido: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  outrosProfessores: {
    fontSize: 12,
    color: '#9C27B0',
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
