import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../services/api';

// Interface baseada no JSON fornecido
interface TurmaRequest {
  nome: string;
  ano: number;
  professorIds: number[];
  alunoIds: number[];
  disciplinaIds: number[];
}

interface Professor {
  id: number;
  nome: string;
}

interface Aluno {
  id: number;
  nome: string;
}

interface Disciplina {
  id: number;
  nome: string;
}

export default function AdicionarTurma() {
  const navigation = useNavigation();
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [ano, setAno] = useState(2024);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estados para dados disponíveis
  const [professoresDisponiveis, setProfessoresDisponiveis] = useState<Professor[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<Aluno[]>([]);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<Disciplina[]>([]);

  // Estados para seleções
  const [professoresSelecionados, setProfessoresSelecionados] = useState<number[]>([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState<number[]>([]);
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar dados iniciais
  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      console.log('🔄 Iniciando carregamento de dados...');
      
      // Carregar professores
      console.log('🔄 Carregando professores...');
      const professoresRes = await api.get('/professores');
      console.log('✅ Professores:', professoresRes.data);
      
      // Carregar alunos (sabemos que /alunos funciona)
      console.log('🔄 Carregando alunos...');
      const alunosRes = await api.get('/alunos');
      console.log('✅ Alunos carregados:', alunosRes.data);
      
      // Carregar disciplinas
      console.log('🔄 Carregando disciplinas...');
      const disciplinasRes = await api.get('/disciplinas');
      console.log('✅ Disciplinas:', disciplinasRes.data);

      // Definir estados - corrigindo estrutura dos alunos
      setProfessoresDisponiveis(Array.isArray(professoresRes.data) ? professoresRes.data : []);
      
      // Alunos podem vir em alunosRes.data.alunos ou alunosRes.data
      const alunosData = alunosRes.data?.alunos || alunosRes.data;
      setAlunosDisponiveis(Array.isArray(alunosData) ? alunosData : []);
      
      setDisciplinasDisponiveis(Array.isArray(disciplinasRes.data) ? disciplinasRes.data : []);
      
      console.log('📊 RESUMO FINAL:', {
        professores: Array.isArray(professoresRes.data) ? professoresRes.data.length : 0,
        alunos: Array.isArray(alunosData) ? alunosData.length : 0,
        disciplinas: Array.isArray(disciplinasRes.data) ? disciplinasRes.data.length : 0,
        estruturaAlunos: {
          dadosBrutos: alunosRes.data,
          alunosExtraidos: alunosData,
          tipoAlunos: Array.isArray(alunosData) ? 'array' : typeof alunosData
        }
      });
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados necessários');
      // Fallback para arrays vazios
      setProfessoresDisponiveis([]);
      setAlunosDisponiveis([]);
      setDisciplinasDisponiveis([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Funções de toggle para seleções
  const toggleProfessor = (id: number) => {
    setProfessoresSelecionados(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleAluno = (id: number) => {
    setAlunosSelecionados(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const toggleDisciplina = (id: number) => {
    setDisciplinasSelecionadas(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  // Validação do formulário
  const validateForm = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Nome da turma é obrigatório');
      return false;
    }
    if (ano < 2020 || ano > 2030) {
      Alert.alert('Erro', 'Ano deve estar entre 2020 e 2030');
      return false;
    }
    return true;
  };

  // Criar turma
  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Payload baseado no JSON fornecido
      const payload: TurmaRequest = {
        nome: nome.trim(),
        ano,
        professorIds: professoresSelecionados,
        alunoIds: alunosSelecionados,
        disciplinaIds: disciplinasSelecionadas
      };

      console.log('Criando turma:', payload);
      
      const response = await api.post('/turma', payload);
      
      console.log('Turma criada:', response.data);
      
      Alert.alert('Sucesso', 'Turma criada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Erro ao criar turma:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao criar turma';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Turma</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Turma</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Turma *</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Fabianne Pereira"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ano *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={ano}
                onValueChange={(value) => setAno(value)}
                style={styles.picker}
              >
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Professores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Professores ({professoresSelecionados.length} selecionado{professoresSelecionados.length !== 1 ? 's' : ''})
          </Text>
          <View style={styles.selectionContainer}>
            {Array.isArray(professoresDisponiveis) && professoresDisponiveis.map((professor) => (
              <TouchableOpacity
                key={professor.id}
                style={[
                  styles.selectionItem,
                  professoresSelecionados.includes(professor.id) && styles.selectionItemSelected
                ]}
                onPress={() => toggleProfessor(professor.id)}
              >
                <Feather
                  name={professoresSelecionados.includes(professor.id) ? "check-square" : "square"}
                  size={20}
                  color={professoresSelecionados.includes(professor.id) ? "#1565C0" : "#999"}
                />
                <Text style={[
                  styles.selectionText,
                  professoresSelecionados.includes(professor.id) && styles.selectionTextSelected
                ]}>
                  {professor.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alunos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Alunos ({alunosSelecionados.length} selecionado{alunosSelecionados.length !== 1 ? 's' : ''})
            {/* Debug Info */}
            <Text style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
              {` - Total: ${alunosDisponiveis.length}`}
            </Text>
          </Text>
          <View style={styles.selectionContainer}>
            {Array.isArray(alunosDisponiveis) && alunosDisponiveis.length > 0 ? (
              alunosDisponiveis.map((aluno) => (
              <TouchableOpacity
                key={aluno.id}
                style={[
                  styles.selectionItem,
                  alunosSelecionados.includes(aluno.id) && styles.selectionItemSelected
                ]}
                onPress={() => toggleAluno(aluno.id)}
              >
                <Feather
                  name={alunosSelecionados.includes(aluno.id) ? "check-square" : "square"}
                  size={20}
                  color={alunosSelecionados.includes(aluno.id) ? "#1565C0" : "#999"}
                />
                <Text style={[
                  styles.selectionText,
                  alunosSelecionados.includes(aluno.id) && styles.selectionTextSelected
                ]}>
                  {aluno.nome}
                </Text>
              </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Feather name="users" size={32} color="#999" />
                <Text style={styles.emptyText}>
                  {loadingData ? 'Carregando alunos...' : 'Nenhum aluno encontrado'}
                </Text>
                <Text style={styles.debugText}>
                  Verifique o console para logs de debug
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Disciplinas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Disciplinas ({disciplinasSelecionadas.length} selecionada{disciplinasSelecionadas.length !== 1 ? 's' : ''})
          </Text>
          <View style={styles.selectionContainer}>
            {Array.isArray(disciplinasDisponiveis) && disciplinasDisponiveis.map((disciplina) => (
              <TouchableOpacity
                key={disciplina.id}
                style={[
                  styles.selectionItem,
                  disciplinasSelecionadas.includes(disciplina.id) && styles.selectionItemSelected
                ]}
                onPress={() => toggleDisciplina(disciplina.id)}
              >
                <Feather
                  name={disciplinasSelecionadas.includes(disciplina.id) ? "check-square" : "square"}
                  size={20}
                  color={disciplinasSelecionadas.includes(disciplina.id) ? "#1565C0" : "#999"}
                />
                <Text style={[
                  styles.selectionText,
                  disciplinasSelecionadas.includes(disciplina.id) && styles.selectionTextSelected
                ]}>
                  {disciplina.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Criar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Criar Turma</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  selectionContainer: {
    gap: 8,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  selectionItemSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#e3f2fd',
  },
  selectionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  selectionTextSelected: {
    color: '#1565C0',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  createButton: {
    backgroundColor: '#1565C0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});