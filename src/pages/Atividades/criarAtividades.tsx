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
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import atividadeService, { CreateAtividadeRequest } from '../../services/atividadeService';

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

export default function CriarAtividades() {
  const navigation = useNavigation();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplinaId, setDisciplinaId] = useState<number | null>(null);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Usa os novos métodos do serviço com fallbacks
      const [turmasData, disciplinasData] = await Promise.all([
        atividadeService.buscarTurmas(),
        atividadeService.buscarDisciplinas()
      ]);
      
      setTurmas(turmasData);
      setDisciplinas(disciplinasData);
      
      console.log('Turmas carregadas:', turmasData);
      console.log('Disciplinas carregadas:', disciplinasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados necessários');
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

  const criarAtividade = async () => {
    if (!titulo.trim()) {
      Alert.alert('Erro', 'O título da atividade é obrigatório');
      return;
    }

    if (!descricao.trim()) {
      Alert.alert('Erro', 'A descrição da atividade é obrigatória');
      return;
    }

    if (!disciplinaId) {
      Alert.alert('Erro', 'Selecione uma disciplina');
      return;
    }

    try {
      setCreating(true);
      
      const data: CreateAtividadeRequest = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        disciplinaId,
        turmaIds: turmasSelecionadas.length > 0 ? turmasSelecionadas : undefined
      };

      await atividadeService.criar(data);
      
      Alert.alert('Sucesso', 'Atividade criada com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      Alert.alert('Erro', 'Não foi possível criar a atividade');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
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
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Atividade</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
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

          {/* Disciplina */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Disciplina *</Text>
            {disciplinas.map((disciplina) => (
              <TouchableOpacity
                key={disciplina.id}
                style={[
                  styles.selectableCard,
                  disciplinaId === disciplina.id && styles.selectedCard
                ]}
                onPress={() => setDisciplinaId(disciplina.id)}
              >
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardTitle,
                    disciplinaId === disciplina.id && styles.selectedText
                  ]}>
                    {disciplina.nome}
                  </Text>
                  {disciplina.professoresLecionando && disciplina.professoresLecionando.length > 0 && (
                    <Text style={styles.professorText}>
                      Professor: {disciplina.professoresLecionando[0].professor.user.name}
                    </Text>
                  )}
                </View>
                {disciplinaId === disciplina.id && (
                  <Feather name="check-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Turmas (Opcional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Turmas (Opcional)</Text>
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

          {/* Botão Criar */}
          <TouchableOpacity
            style={[styles.createButton, creating && styles.disabledButton]}
            onPress={criarAtividade}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="check" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Criar Atividade</Text>
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
  backButton: {
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
  professorText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  anoText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  createButton: {
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
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});