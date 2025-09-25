import React, { useEffect, useState, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import RoleProtection from '../../components/RoleProtection';

type Disciplina = {
  id: number;
  nome: string;
  professor: string;
  turma: string[];
  atividades: string[];
};

export default function Disciplina() {
  const { user } = useContext(AuthContext);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Buscar disciplinas
  const fetchDisciplinas = async () => {
    try {
      const response = await api.get('/disciplinas');
      console.log('Resposta da API disciplinas:', response.data);
      
      // Verificar se response.data é um array válido
      if (Array.isArray(response.data)) {
        setDisciplinas(response.data);
      } else {
        console.log('Dados não são um array válido');
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
        </View>

        {/* Lista de Disciplinas */}
        <FlatList
          data={disciplinas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.disciplinaIcon}>
                  <Text style={styles.disciplinaIconText}>📖</Text>
                </View>
                <View style={styles.disciplinaInfo}>
                  <Text style={styles.disciplinaNome}>{item.nome}</Text>
                  <Text style={styles.disciplinaId}>ID: {item.id}</Text>
                </View>
              </View>

              {/* Professor */}
              {item.professor && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👨‍🏫 Professor:</Text>
                  <Text style={styles.professorNome}>{item.professor}</Text>
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

              {/* Caso não tenha professor, turmas ou atividades */}
              {!item.professor && (!item.turma || item.turma.length === 0) && (!item.atividades || item.atividades.length === 0) && (
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