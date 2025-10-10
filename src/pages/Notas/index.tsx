import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { api } from "../../services/api";

interface Aluno {
  id: number;
  nome: string;
}

interface Nota {
  alunoId: number;
  valor: string; // armazenamos como string para facilitar no input
  descricao: string;
}

interface Turma {
    id: number;
    nome: string;
    serie: string;
    ano: number;
    alunos: Aluno[];
}

interface Atividade {
    id: number;
    titulo: string;
    descricao: string;
    disciplina: {
        nome: string;
    };
}

export default function LancamentoNotas() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<number | null>(null);
  const [selectedAtividade, setSelectedAtividade] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar alunos quando uma turma é selecionada
  useEffect(() => {
    if (selectedTurma) {
      loadAlunosDaTurma(selectedTurma);
    }
  }, [selectedTurma]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Carregando dados iniciais...');
      
      // Carregar dados de forma individual para melhor controle de erros
      let turmasData: Turma[] = [];
      let atividadesData: Atividade[] = [];
      
      // Carregar turmas
      try {
        console.log('📡 Carregando turmas...');
        const turmasResponse = await api.get('/turmas');
        turmasData = turmasResponse.data.turmas || turmasResponse.data || [];
        console.log(`✅ ${turmasData.length} turmas carregadas`);
        setTurmas(turmasData);
      } catch (error: any) {
        console.error('❌ Erro ao carregar turmas:', error);
        const turmasError = error.response?.status === 404 ? 'Endpoint /turmas não encontrado' : 'Erro ao carregar turmas';
        Alert.alert('Aviso', `${turmasError}. Algumas funcionalidades podem não funcionar.`);
      }
      
      // Carregar atividades
      try {
        console.log('📡 Carregando atividades...');
        const atividadesResponse = await api.get('/atividades');
        atividadesData = atividadesResponse.data.atividades || atividadesResponse.data || [];
        console.log(`✅ ${atividadesData.length} atividades carregadas`);
        setAtividades(atividadesData);
      } catch (error: any) {
        console.error('❌ Erro ao carregar atividades:', error);
        const atividadesError = error.response?.status === 404 ? 'Endpoint /atividades não encontrado' : 'Erro ao carregar atividades';
        Alert.alert('Aviso', `${atividadesError}. Algumas funcionalidades podem não funcionar.`);
      }
      
      // Verificar se pelo menos um dos dados foi carregado
      if (turmasData.length === 0 && atividadesData.length === 0) {
        Alert.alert(
          'Problema de Conectividade', 
          'Não foi possível carregar nenhum dado do servidor. Verifique sua conexão e tente novamente.',
          [
            { text: 'Tentar Novamente', onPress: () => loadInitialData() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      Alert.alert(
        'Erro de Conexão', 
        'Falha na comunicação com o servidor. Verifique sua conexão com a internet.',
        [
          { text: 'Tentar Novamente', onPress: () => loadInitialData() },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAlunosDaTurma = async (turmaId: number) => {
    try {
      console.log(`🔍 Carregando alunos da turma ${turmaId}...`);
      
      let alunosData: Aluno[] = [];
      
      // Estratégia 1: Tentar endpoint específico da turma
      try {
        console.log('📡 Tentativa 1: /turmas/{id}/alunos');
        const response = await api.get(`/turmas/${turmaId}/alunos`);
        alunosData = response.data.alunos || response.data || [];
        console.log(`✅ Sucesso - ${alunosData.length} alunos encontrados`);
      } catch (error) {
        console.log('❌ Endpoint /turmas/{id}/alunos não encontrado');
        
        // Estratégia 2: Buscar todos os alunos e filtrar por turma
        try {
          console.log('📡 Tentativa 2: /alunos (filtrar por turma)');
          const response = await api.get('/alunos');
          const todosAlunos = response.data.alunos || response.data || [];
          
          // Filtrar alunos pela turma selecionada
          alunosData = todosAlunos.filter((aluno: any) => 
            aluno.turmaId === turmaId || 
            aluno.turma?.id === turmaId ||
            (Array.isArray(aluno.turmas) && aluno.turmas.some((t: any) => t.id === turmaId))
          );
          
          console.log(`✅ Filtrado - ${alunosData.length} alunos da turma ${turmaId}`);
        } catch (secondError) {
          console.log('❌ Endpoint /alunos também falhou');
          
          // Estratégia 3: Buscar turmas com alunos incluídos
          try {
            console.log('📡 Tentativa 3: /turmas (com alunos incluídos)');
            const response = await api.get('/turmas');
            const todasTurmas = response.data.turmas || response.data || [];
            
            const turmaSelecionada = todasTurmas.find((t: any) => t.id === turmaId);
            if (turmaSelecionada && turmaSelecionada.alunos) {
              alunosData = turmaSelecionada.alunos;
              console.log(`✅ Encontrado via turmas - ${alunosData.length} alunos`);
            } else {
              console.log('❌ Turma não encontrada ou sem alunos');
            }
          } catch (thirdError) {
            console.log('❌ Todas as estratégias falharam');
            throw thirdError;
          }
        }
      }
      
      console.log('👥 Alunos carregados:', alunosData);
      setAlunos(alunosData);
      
      // Inicializar notas vazias para os alunos
      setNotas(alunosData.map((aluno: Aluno) => ({ 
        alunoId: aluno.id, 
        valor: "", 
        descricao: "" 
      })));
      
      if (alunosData.length === 0) {
        Alert.alert(
          'Informação', 
          'Esta turma não possui alunos cadastrados ou há um problema na busca dos dados.'
        );
      }
      
    } catch (error: any) {
      console.error('❌ Erro final ao carregar alunos:', error);
      
      // Mostrar erro mais específico para o usuário
      const errorMessage = error.response?.status === 404 
        ? 'Endpoint para buscar alunos não encontrado no servidor. Verifique a implementação do backend.'
        : error.response?.data?.message || 'Falha ao carregar alunos da turma.';
        
      Alert.alert('Erro ao Carregar Alunos', errorMessage);
      setAlunos([]); // Limpar lista em caso de erro
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    if (selectedTurma) {
      await loadAlunosDaTurma(selectedTurma);
    }
    setRefreshing(false);
  };


  // Atualiza valor da nota de um aluno
  const handleChangeNota = (alunoId: number, valor: string) => {
    setNotas(prev =>
      prev.map(n => (n.alunoId === alunoId ? { ...n, valor } : n))
    );
  };

  // Validar e salvar notas
  const handleSalvarNotas = async () => {
    if (!selectedAtividade) {
      Alert.alert('Atenção', 'Selecione uma atividade antes de salvar as notas.');
      return;
    }

    if (!selectedTurma) {
      Alert.alert('Atenção', 'Selecione uma turma antes de salvar as notas.');
      return;
    }

    // Validar se há pelo menos uma nota preenchida
    const notasPreenchidas = notas.filter(n => n.valor.trim() !== '');
    if (notasPreenchidas.length === 0) {
      Alert.alert('Atenção', 'Preencha pelo menos uma nota antes de salvar.');
      return;
    }

    // Validar valores das notas (0-10)
    const notasInvalidas = notasPreenchidas.filter(n => {
      const valor = parseFloat(n.valor);
      return isNaN(valor) || valor < 0 || valor > 10;
    });

    if (notasInvalidas.length > 0) {
      Alert.alert('Atenção', 'As notas devem ser números entre 0 e 10.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        atividadeId: selectedAtividade,
        turmaId: selectedTurma,
        notas: notasPreenchidas.map(n => ({
          alunoId: n.alunoId,
          valor: parseFloat(n.valor),
          descricao: n.descricao || 'Nota lançada'
        }))
      };

      console.log('Salvando notas:', payload);
      const response = await api.post('/notas', payload);

      Alert.alert('Sucesso!', 'Notas salvas com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            // Limpar notas após salvar
            setNotas(prev => prev.map(n => ({ ...n, valor: '', descricao: '' })));
          }
        }
      ]);
      
      console.log('Notas salvas:', response.data);
    } catch (error: any) {
      console.error('Erro ao salvar notas:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar notas';
      Alert.alert('Erro', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#191970" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lançamento de Notas</Text>
        <Text style={styles.headerSubtitle}>Selecione a turma e atividade</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Seleção de Turma */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📚 Turma</Text>
          {turmas.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {turmas.map((turma) => (
                <TouchableOpacity
                  key={turma.id}
                  style={[
                    styles.selectionCard,
                    selectedTurma === turma.id && styles.selectionCardActive
                  ]}
                  onPress={() => setSelectedTurma(turma.id)}
                >
                  <Text style={[
                    styles.selectionCardTitle,
                    selectedTurma === turma.id && styles.selectionCardTitleActive
                  ]}>
                    {turma.nome}
                  </Text>
                  <Text style={[
                    styles.selectionCardSubtitle,
                    selectedTurma === turma.id && styles.selectionCardSubtitleActive
                  ]}>
                    {turma.serie} • {turma.ano}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyDataContainer}>
              <Feather name="alert-circle" size={24} color="#ff6b6b" />
              <Text style={styles.emptyDataText}>
                Nenhuma turma encontrada. Verifique se o endpoint '/turmas' está funcionando.
              </Text>
            </View>
          )}
        </View>

        {/* Seleção de Atividade */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📝 Atividade</Text>
          {atividades.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {atividades.map((atividade) => (
                <TouchableOpacity
                  key={atividade.id}
                  style={[
                    styles.selectionCard,
                    selectedAtividade === atividade.id && styles.selectionCardActive
                  ]}
                  onPress={() => setSelectedAtividade(atividade.id)}
                >
                  <Text style={[
                    styles.selectionCardTitle,
                    selectedAtividade === atividade.id && styles.selectionCardTitleActive
                  ]}>
                    {atividade.titulo}
                  </Text>
                  <Text style={[
                    styles.selectionCardSubtitle,
                    selectedAtividade === atividade.id && styles.selectionCardSubtitleActive
                  ]}>
                    {atividade.disciplina?.nome || 'Disciplina'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyDataContainer}>
              <Feather name="alert-circle" size={24} color="#ff6b6b" />
              <Text style={styles.emptyDataText}>
                Nenhuma atividade encontrada. Verifique se o endpoint '/atividades' está funcionando.
              </Text>
            </View>
          )}
        </View>

        {/* Lista de Alunos */}
        {selectedTurma && selectedAtividade ? (
          <View style={styles.sectionContainer}>
            <View style={styles.alunosHeader}>
              <Text style={styles.sectionTitle}>👥 Alunos ({alunos.length})</Text>
              <Text style={styles.notasInfo}>Notas de 0 a 10</Text>
            </View>
            
            {alunos.length > 0 ? (
              <View style={styles.alunosList}>
                {alunos.map((aluno, index) => {
                  const nota = notas.find(n => n.alunoId === aluno.id);
                  return (
                    <View key={aluno.id} style={styles.alunoCard}>
                      <View style={styles.alunoInfo}>
                        <View style={styles.alunoAvatar}>
                          <Text style={styles.alunoAvatarText}>
                            {aluno.nome.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.alunoNome}>{aluno.nome}</Text>
                      </View>
                      <View style={styles.notaInput}>
                        <TextInput
                          style={[
                            styles.input,
                            nota?.valor && parseFloat(nota.valor) >= 0 && parseFloat(nota.valor) <= 10 
                              ? styles.inputValid 
                              : nota?.valor ? styles.inputInvalid : null
                          ]}
                          keyboardType="numeric"
                          placeholder="0.0"
                          value={nota?.valor || ""}
                          onChangeText={(text) => handleChangeNota(aluno.id, text)}
                          maxLength={4}
                        />
                        {nota?.valor && (
                          <View style={[
                            styles.notaStatus,
                            parseFloat(nota.valor) >= 6 ? styles.notaAprovado : styles.notaReprovado
                          ]}>
                            <Feather 
                              name={parseFloat(nota.valor) >= 6 ? "check-circle" : "x-circle"} 
                              size={12} 
                              color="#fff" 
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="users" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Nenhum aluno encontrado nesta turma</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.selectionPrompt}>
            <Feather name="arrow-up" size={48} color="#ccc" />
            <Text style={styles.selectionPromptText}>
              Selecione uma turma e uma atividade para começar
            </Text>
          </View>
        )}

        {/* Botão Debug - Apenas em desenvolvimento */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                'Debug - Status dos Dados',
                `Turmas: ${turmas.length} encontradas\nAtividades: ${atividades.length} encontradas\nAlunos: ${alunos.length} encontrados\n\nTurma selecionada: ${selectedTurma || 'Nenhuma'}\nAtividade selecionada: ${selectedAtividade || 'Nenhuma'}\n\nVerifique os logs do console para mais detalhes.`
              );
            }}
          >
            <Feather name="info" size={16} color="#2196f3" />
            <Text style={styles.debugButtonText}>Debug Info</Text>
          </TouchableOpacity>
        )}

        {/* Botão Salvar */}
        {selectedTurma && selectedAtividade && alunos.length > 0 && (
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSalvarNotas}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Feather name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Salvar Notas</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectionCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  selectionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectionCardTitleActive: {
    color: '#2d5a2d',
  },
  selectionCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectionCardSubtitleActive: {
    color: '#4CAF50',
  },
  alunosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  notasInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  alunosList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alunoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alunoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alunoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#191970',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alunoAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  notaInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#fff',
  },
  inputValid: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  inputInvalid: {
    borderColor: '#f44336',
    backgroundColor: '#fff8f8',
  },
  notaStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notaAprovado: {
    backgroundColor: '#4CAF50',
  },
  notaReprovado: {
    backgroundColor: '#f44336',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccb',
  },
  emptyDataText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#d32f2f',
  },
  selectionPrompt: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  selectionPromptText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#e3f2fd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  debugButtonText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
