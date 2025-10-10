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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../services/api';

interface Professor {
  id: number;
  nome: string;
  user?: {
    name: string;
  };
}

interface Aluno {
  id: number;
  nome: string;
  user?: {
    name: string;
  };
}

interface Disciplina {
  id: number;
  nome: string;
}

interface Turma {
  id: number;
  nome: string;
  ano: number;
  professores: any[];
  alunos: any[];
  disciplinas: any[];
}

export default function EditTurma() {
  const navigation = useNavigation();
  const route = useRoute();
  const { turmaId } = route.params as { turmaId: number };
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [ano, setAno] = useState(2024);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [turma, setTurma] = useState<Turma | null>(null);

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
      console.log('🔄 Carregando dados da turma:', turmaId);
      
      // Carregar dados da turma específica
      const turmaRes = await api.get(`/turma/${turmaId}`);
      console.log('✅ Dados da turma:', turmaRes.data);
      
      const turmaData = turmaRes.data;
      setTurma(turmaData);
      setNome(turmaData.nome);
      setAno(turmaData.ano);

      // Carregar dados disponíveis
      const [professoresRes, alunosRes, disciplinasRes] = await Promise.all([
        api.get('/professores'),
        api.get('/alunos'),
        api.get('/disciplinas')
      ]);

      setProfessoresDisponiveis(Array.isArray(professoresRes.data) ? professoresRes.data : []);
      
      const alunosData = alunosRes.data?.alunos || alunosRes.data;
      setAlunosDisponiveis(Array.isArray(alunosData) ? alunosData : []);
      
      setDisciplinasDisponiveis(Array.isArray(disciplinasRes.data) ? disciplinasRes.data : []);

      // Pré-selecionar itens já associados
      const professorIds = turmaData.professores?.map((p: any) => p.professor?.id || p.id).filter(Boolean) || [];
      const alunoIds = turmaData.alunos?.map((a: any) => a.id).filter(Boolean) || [];
      const disciplinaIds = turmaData.disciplinas?.map((d: any) => d.disciplina?.id || d.id).filter(Boolean) || [];

      setProfessoresSelecionados(professorIds);
      setAlunosSelecionados(alunoIds);
      setDisciplinasSelecionadas(disciplinaIds);

      console.log('✅ Pré-seleções:', { professorIds, alunoIds, disciplinaIds });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da turma');
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

  // Atualizar turma
  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        nome: nome.trim(),
        ano,
        professorIds: professoresSelecionados,
        alunoIds: alunosSelecionados,
        disciplinaIds: disciplinasSelecionadas
      };

      console.log('Atualizando turma:', payload);
      
      const response = await api.put(`/turma/${turmaId}`, payload);
      
      console.log('Turma atualizada:', response.data);
      
      Alert.alert('Sucesso', 'Turma atualizada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Erro ao atualizar turma:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao atualizar turma';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Deletar turma
  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/turma/${turmaId}`);
      
      Alert.alert('Sucesso', 'Turma excluída com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Erro ao excluir turma:', error);
      
      // Se houver dependências, mostrar opção de exclusão forçada
      if (error.response?.status === 400 && error.response?.data?.message?.includes('dependências')) {
        Alert.alert(
          'Turma com Dependências',
          `${error.response.data.message}\n\nDeseja excluir mesmo assim? Isso removerá todos os dados relacionados.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir Tudo', style: 'destructive', onPress: forceDelete }
          ]
        );
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao excluir turma';
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const forceDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/turma/${turmaId}/force`);
      
      Alert.alert('Sucesso', 'Turma e todas as dependências foram excluídas!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Erro ao excluir turma forçadamente:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao excluir turma';
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
        <Text style={styles.headerTitle}>Editar Turma</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Feather name="trash-2" size={20} color="#ff4444" />
        </TouchableOpacity>
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
              placeholder="Ex: Turma A"
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
            {professoresDisponiveis.map((professor) => (
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
                  {professor.user?.name || professor.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alunos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Alunos ({alunosSelecionados.length} selecionado{alunosSelecionados.length !== 1 ? 's' : ''})
          </Text>
          <View style={styles.selectionContainer}>
            {alunosDisponiveis.map((aluno) => (
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
                  {aluno.user?.name || aluno.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Disciplinas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Disciplinas ({disciplinasSelecionadas.length} selecionada{disciplinasSelecionadas.length !== 1 ? 's' : ''})
          </Text>
          <View style={styles.selectionContainer}>
            {disciplinasDisponiveis.map((disciplina) => (
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

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="save" size={20} color="#fff" />
                <Text style={styles.updateButtonText}>Salvar Alterações</Text>
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
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
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
  updateButton: {
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
  updateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});