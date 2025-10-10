import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../services/api';

interface Professor {
  id: number;
  nome?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface Aluno {
  id: number;
  nome?: string;
  user?: {
    name: string;
    email: string;
  };
  dataNascimento?: string;
}

interface Disciplina {
  id: number;
  nome: string;
}

interface Atividade {
  id: number;
  titulo: string;
  disciplina?: {
    nome: string;
  };
}

interface Boletim {
  id: number;
  aluno?: {
    user?: {
      name: string;
    };
  };
}

interface TurmaDetalhada {
  id: number;
  nome: string;
  ano: number;
  professores: any[];
  alunos: any[];
  disciplinas: any[];
  atividades?: Atividade[];
  boletins?: Boletim[];
  _count?: {
    alunos: number;
    professores: number;
    disciplinas: number;
    atividades: number;
    boletins: number;
  };
}

interface DependencyCheck {
  turma: {
    id: number;
    nome: string;
    ano: number;
  };
  podeExcluir: boolean;
  dependencias: {
    alunos: number;
    professores: number;
    disciplinas: number;
    atividades: number;
    boletins: number;
  };
  mensagem: string;
}

export default function DetalhesTurma() {
  const navigation = useNavigation();
  const route = useRoute();
  const { turmaId } = route.params as { turmaId: number };
  
  const [turma, setTurma] = useState<TurmaDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [dependencyCheck, setDependencyCheck] = useState<DependencyCheck | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTurmaDetails();
  }, []);

  const loadTurmaDetails = async () => {
    setLoading(true);
    try {
      console.log('🔄 Carregando detalhes da turma:', turmaId);
      
      const response = await api.get(`/turma/${turmaId}`);
      console.log('✅ Detalhes da turma:', response.data);
      
      setTurma(response.data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar detalhes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da turma');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkDependencies = async () => {
    try {
      console.log('🔍 Verificando dependências...');
      
      // Como não temos endpoint específico para dependências, vamos verificar pelos dados da turma
      if (turma) {
        const hasProfessores = turma.professores && turma.professores.length > 0;
        const hasAlunos = turma.alunos && turma.alunos.length > 0;
        const hasDisciplinas = turma.disciplinas && turma.disciplinas.length > 0;
        const hasAtividades = turma.atividades && turma.atividades.length > 0;
        const hasBoletins = turma.boletins && turma.boletins.length > 0;
        
        const dependencias = {
          turma: {
            id: turma.id,
            nome: turma.nome,
            ano: turma.ano
          },
          podeExcluir: !hasProfessores && !hasAlunos && !hasDisciplinas && !hasAtividades && !hasBoletins,
          dependencias: {
            professores: turma.professores?.length || 0,
            alunos: turma.alunos?.length || 0,
            disciplinas: turma.disciplinas?.length || 0,
            atividades: turma.atividades?.length || 0,
            boletins: turma.boletins?.length || 0
          },
          mensagem: hasProfessores || hasAlunos || hasDisciplinas || hasAtividades || hasBoletins 
            ? 'Esta turma possui dependências e precisa ser excluída com força.'
            : 'Esta turma pode ser excluída normalmente.'
        };
        
        console.log('✅ Dependências verificadas:', dependencias);
        setDependencyCheck(dependencias);
        setDeleteModalVisible(true);
      } else {
        throw new Error('Dados da turma não disponíveis');
      }
    } catch (error: any) {
      console.error('❌ Erro ao verificar dependências:', error);
      Alert.alert('Erro', 'Não foi possível verificar as dependências da turma');
    }
  };

  const handleDelete = async (force = false) => {
    setDeleting(true);
    try {
      const endpoint = force ? `/turma/${turmaId}/force` : `/turma/${turmaId}`;
      
      console.log(`🗑️ Deletando turma (force: ${force}):`, endpoint);
      
      const response = await api.delete(endpoint);
      console.log('✅ Turma deletada:', response.data);
      
      const message = force 
        ? 'Turma e todas as dependências foram excluídas com sucesso!'
        : 'Turma excluída com sucesso!';
      
      Alert.alert('Sucesso', message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('❌ Erro ao deletar turma:', error);
      
      if (error.response?.status === 400 && !force) {
        // Mostrar dependências e opção de exclusão forçada
        Alert.alert(
          'Turma com Dependências',
          error.response.data.message || 'A turma possui dependências que impedem a exclusão.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver Detalhes', onPress: checkDependencies },
            { text: 'Excluir Mesmo Assim', style: 'destructive', onPress: () => handleDelete(true) }
          ]
        );
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao excluir turma';
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta turma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Verificar Dependências', onPress: checkDependencies },
        { text: 'Excluir', style: 'destructive', onPress: () => handleDelete(false) }
      ]
    );
  };

  const navigateToEdit = () => {
    (navigation as any).navigate('EditTurma', { turmaId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!turma) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Turma não encontrada</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalMembros = (turma.alunos?.length || 0) + (turma.professores?.length || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Turma</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={navigateToEdit} style={styles.editButton}>
            <Feather name="edit-2" size={20} color="#1565C0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton}>
            <Feather name="trash-2" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações Principais */}
        <View style={styles.mainCard}>
          <View style={styles.turmaHeader}>
            <View style={styles.turmaIcon}>
              <Text style={styles.turmaIconText}>{turma.ano}°</Text>
            </View>
            <View style={styles.turmaInfo}>
              <Text style={styles.turmaNome}>{turma.nome}</Text>
              <Text style={styles.turmaAno}>Ano letivo: {turma.ano}</Text>
            </View>
          </View>

          {/* Estatísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Feather name="users" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{totalMembros}</Text>
              <Text style={styles.statLabel}>Membros</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="book" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{turma.disciplinas?.length || 0}</Text>
              <Text style={styles.statLabel}>Disciplinas</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="file-text" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{turma.atividades?.length || 0}</Text>
              <Text style={styles.statLabel}>Atividades</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="award" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>{turma.boletins?.length || 0}</Text>
              <Text style={styles.statLabel}>Boletins</Text>
            </View>
          </View>
        </View>

        {/* Professores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user-check" size={20} color="#1565C0" />
            <Text style={styles.sectionTitle}>Professores ({turma.professores?.length || 0})</Text>
          </View>
          {turma.professores && turma.professores.length > 0 ? (
            turma.professores.map((prof, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemIcon}>
                  <Feather name="user" size={18} color="#1565C0" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemName}>
                    {prof.professor?.user?.name || prof.user?.name || prof.nome || 'Nome não encontrado'}
                  </Text>
                  {prof.professor?.user?.email && (
                    <Text style={styles.listItemEmail}>{prof.professor.user.email}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum professor cadastrado</Text>
          )}
        </View>

        {/* Alunos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Alunos ({turma.alunos?.length || 0})</Text>
          </View>
          {turma.alunos && turma.alunos.length > 0 ? (
            turma.alunos.map((aluno, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemIcon}>
                  <Feather name="user" size={18} color="#4CAF50" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemName}>
                    {aluno.user?.name || aluno.nome || 'Nome não encontrado'}
                  </Text>
                  {aluno.user?.email && (
                    <Text style={styles.listItemEmail}>{aluno.user.email}</Text>
                  )}
                  {aluno.dataNascimento && (
                    <Text style={styles.listItemDate}>
                      Nascimento: {new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum aluno cadastrado</Text>
          )}
        </View>

        {/* Disciplinas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book" size={20} color="#FF9800" />
            <Text style={styles.sectionTitle}>Disciplinas ({turma.disciplinas?.length || 0})</Text>
          </View>
          {turma.disciplinas && turma.disciplinas.length > 0 ? (
            turma.disciplinas.map((disc, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemIcon}>
                  <Feather name="book-open" size={18} color="#FF9800" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemName}>
                    {disc.disciplina?.nome || disc.nome || 'Nome não encontrado'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma disciplina cadastrada</Text>
          )}
        </View>

        {/* Atividades (se houver) */}
        {turma.atividades && turma.atividades.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Atividades Recentes ({turma.atividades.length})</Text>
            </View>
            {turma.atividades.slice(0, 5).map((atividade, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemIcon}>
                  <Feather name="file" size={18} color="#2196F3" />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemName}>{atividade.titulo}</Text>
                  {atividade.disciplina && (
                    <Text style={styles.listItemSubtitle}>{atividade.disciplina.nome}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dependências da Turma</Text>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {dependencyCheck && (
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>{dependencyCheck.mensagem}</Text>
                
                <View style={styles.dependenciesList}>
                  <Text style={styles.dependenciesTitle}>Dependências encontradas:</Text>
                  <Text style={styles.dependencyItem}>• {dependencyCheck.dependencias.alunos} aluno(s)</Text>
                  <Text style={styles.dependencyItem}>• {dependencyCheck.dependencias.professores} professor(es)</Text>
                  <Text style={styles.dependencyItem}>• {dependencyCheck.dependencias.disciplinas} disciplina(s)</Text>
                  <Text style={styles.dependencyItem}>• {dependencyCheck.dependencias.atividades} atividade(s)</Text>
                  <Text style={styles.dependencyItem}>• {dependencyCheck.dependencias.boletins} boletim(ns)</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButtonCancel} 
                    onPress={() => setDeleteModalVisible(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  {!dependencyCheck.podeExcluir && (
                    <TouchableOpacity 
                      style={styles.modalButtonDanger} 
                      onPress={() => handleDelete(true)}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.modalButtonTextDanger}>Excluir Tudo</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  turmaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  turmaIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  turmaIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  turmaInfo: {
    flex: 1,
  },
  turmaNome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  turmaAno: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  listItemEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  listItemDate: {
    fontSize: 12,
    color: '#999',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  dependenciesList: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  dependenciesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dependencyItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDanger: {
    flex: 1,
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonTextDanger: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});