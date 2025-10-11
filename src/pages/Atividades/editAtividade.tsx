import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../services/api';
import atividadeService, { Atividade, UpdateAtividadeRequest } from '../../services/atividadeService';

interface Turma {
  id: number;
  nome: string;
  ano: number;
}

interface Disciplina {
  id: number;
  nome: string;
  professoresLecionando?: Array<{
    professor: {
      user: {
        name: string;
      }
    }
  }>;
}

interface RouteParams {
  atividadeId: number;
}

export default function EditAtividade() {
  const navigation = useNavigation();
  const route = useRoute();
  const { atividadeId } = route.params as RouteParams;

  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [atividadeData, turmasData] = await Promise.all([
        atividadeService.buscarPorId(atividadeId),
        atividadeService.buscarTurmas()
      ]);
      
      setAtividade(atividadeData);
      setTitulo(atividadeData.titulo);
      setDescricao(atividadeData.descricao);
      setTurmasSelecionadas(atividadeData.turmas?.map((t: any) => t.id) || []);
      
      setTurmas(turmasData);
      
      console.log('Atividade carregada:', atividadeData);
      console.log('Turmas carregadas:', turmasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da atividade');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleTurma = (turmaId: number) => {
    setTurmasSelecionadas(prev => {
      if (prev.includes(turmaId)) {
        return prev.filter(id => id !== turmaId);
      } else {
        return [...prev, turmaId];
      }
    });
  };

  const atualizarAtividade = async () => {
    if (!titulo.trim()) {
      Alert.alert('Erro', 'O título da atividade é obrigatório');
      return;
    }

    if (!descricao.trim()) {
      Alert.alert('Erro', 'A descrição da atividade é obrigatória');
      return;
    }

    try {
      setUpdating(true);
      
      const data: UpdateAtividadeRequest = {
        atividadeId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        turmaIds: turmasSelecionadas.length > 0 ? turmasSelecionadas : undefined
      };

      await atividadeService.atualizar(data);
      
      Alert.alert('Sucesso', 'Atividade atualizada com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a atividade');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando atividade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!atividade) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Atividade não encontrada</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Atividade</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          {/* Disciplina (só exibir) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Disciplina</Text>
            <View style={styles.disciplinaDisplay}>
              <Text style={styles.disciplinaName}>{atividade.disciplina.nome}</Text>
            </View>
          </View>

          {/* Título */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Digite o título da atividade"
              placeholderTextColor="#95a5a6"
            />
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva a atividade"
              placeholderTextColor="#95a5a6"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Turmas */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Turmas</Text>
            <Text style={styles.subtitle}>
              Selecione as turmas que farão esta atividade
            </Text>
            {turmas.map((turma) => (
              <TouchableOpacity
                key={turma.id}
                style={[
                  styles.selectableCard,
                  turmasSelecionadas.includes(turma.id) && styles.selectedCard
                ]}
                onPress={() => toggleTurma(turma.id)}
              >
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardTitle,
                    turmasSelecionadas.includes(turma.id) && styles.selectedText
                  ]}>
                    {turma.nome}
                  </Text>
                  <Text style={styles.anoText}>Ano: {turma.ano}</Text>
                </View>
                {turmasSelecionadas.includes(turma.id) && (
                  <Feather name="check-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão Atualizar */}
          <TouchableOpacity
            style={[styles.updateButton, updating && styles.disabledButton]}
            onPress={atualizarAtividade}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="save" size={20} color="#fff" />
                <Text style={styles.updateButtonText}>Atualizar Atividade</Text>
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
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e4e7',
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  disciplinaDisplay: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e4e7',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  disciplinaName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e4e7',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  selectableCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e4e7',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  selectedText: {
    color: '#4CAF50',
  },
  anoText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});