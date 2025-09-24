import React, { useEffect, useState, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, RefreshControl
} from 'react-native';
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
  disciplinas: Disciplina[];
  turmas: { turma: Turma }[]; // vem do relacionamento N:N
};


type Turma = {
  id: number;
  nome: string;
};

type Disciplina = {
  id: number;
  nome: string;
};

export default function Professores() {
  const { user } = useContext(AuthContext);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Buscar professores
  const fetchProfessores = async () => {
    try {
      const response = await api.get('/professores');
      setProfessores(response.data);
    } catch (error) {
      console.log('Erro ao buscar professores:', error);
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
            </View>

            {/* Disciplinas */}
            {item.disciplinas && item.disciplinas.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📚 Disciplinas:</Text>
                <View style={styles.tagContainer}>
                  {item.disciplinas.map((d) => (
                    <View key={d.id} style={styles.tag}>
                      <Text style={styles.tagText}>{d.nome}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

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
            {(!item.disciplinas || item.disciplinas.length === 0) && 
             (!item.turmas || item.turmas.length === 0) && (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>📋 Nenhuma disciplina ou turma atribuída</Text>
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
            <Text style={styles.emptyIcon}>👨‍🏫</Text>
            <Text style={styles.emptyTitle}>Nenhum professor encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Os professores aparecerão aqui após o cadastro
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
});
