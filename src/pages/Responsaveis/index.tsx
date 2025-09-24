import React, { useEffect, useState, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, RefreshControl, TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import RoleProtection from '../../components/RoleProtection';
import { useNavigation } from '@react-navigation/native';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Aluno = {
  id: number;
  nome: string;
  user: User;
};

type Responsavel = {
  id: number;
  userId: number;
  nome: string;
  telefone: string;
  email: string;
  alunos: Aluno[];
  user?: User;
};

export default function Responsaveis() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Buscar responsáveis
  const fetchResponsaveis = async () => {
    try {
      const response = await api.get('/responsaveis');
      setResponsaveis(response.data);
    } catch (error) {
      console.log('Erro ao buscar responsáveis:', error);
      Alert.alert('Erro', 'Não foi possível carregar os responsáveis');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResponsaveis();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchResponsaveis();
  }, []);

  return (
    <RoleProtection 
      allowedRoles={['ADMIN', 'SECRETARIA', 'PROFESSOR']}
      fallbackMessage="Esta seção é apenas para administradores, secretaria e professores.
Alunos podem acessar apenas os avisos."
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👨‍👩‍👧‍👦 Responsáveis</Text>
          <Text style={styles.headerSubtitle}>
            {responsaveis.length} {responsaveis.length === 1 ? 'responsável' : 'responsáveis'} cadastrados
          </Text>
        </View>

        {/* Botão Criar Responsável */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => (navigation as any).navigate("CriarResponsavel")}
          >
            <Feather name="user-plus" size={18} color="#fff" style={styles.createButtonIcon} />
            <Text style={styles.createButtonText}>Criar Novo Responsável</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Responsáveis */}
        <FlatList
          data={responsaveis}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.responsavelIcon}>
                  <Text style={styles.responsavelIconText}>👤</Text>
                </View>
                <View style={styles.responsavelInfo}>
                  <Text style={styles.responsavelName}>{item.nome}</Text>
                  <Text style={styles.responsavelId}>ID: {item.id}</Text>
                </View>
              </View>

              {/* Informações de Contato */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📱 Contato:</Text>
                <View style={styles.contactContainer}>
                  <View style={styles.contactItem}>
                    <Feather name="phone" size={16} color="#4CAF50" />
                    <Text style={styles.contactText}>{item.telefone}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Feather name="mail" size={16} color="#2196F3" />
                    <Text style={styles.contactText}>{item.email}</Text>
                  </View>
                </View>
              </View>

              {/* Alunos sob responsabilidade */}
              {item.alunos && item.alunos.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👨‍🎓 Alunos ({item.alunos.length}):</Text>
                  <View style={styles.tagContainer}>
                    {item.alunos.map((aluno) => (
                      <View key={aluno.id} style={styles.tag}>
                        <Text style={styles.tagText}>{aluno.nome}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Caso não tenha alunos */}
              {(!item.alunos || item.alunos.length === 0) && (
                <View style={styles.emptySection}>
                  <Text style={styles.emptyText}>👥 Nenhum aluno sob responsabilidade</Text>
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
              <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.emptyTitle}>Nenhum responsável encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Os responsáveis aparecerão aqui após o cadastro
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
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
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
    borderLeftColor: "#9C27B0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  responsavelIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f3e5f5",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  responsavelIconText: {
    fontSize: 24,
  },
  responsavelInfo: {
    flex: 1,
  },
  responsavelName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#191970",
    marginBottom: 4,
  },
  responsavelId: {
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
  contactContainer: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 14,
    color: "#444",
    marginLeft: 10,
    flex: 1,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#9C27B0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
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