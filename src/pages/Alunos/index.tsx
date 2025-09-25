import React, { useEffect, useState, useContext } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import RoleProtection from '../../components/RoleProtection';

type Aluno = {
  id: number;
  userId: number;
  nome: string;
  dataNascimento: string | null;
  turmaId: number | null;
  responsavelId: number | null;
  situacao: string;
  responsavel: {
    nome: string;
    telefone: string;
  } | null;
  notas: {
    valor: number;
  }[];
  user: {
    role: string;
  };
  turma: {
    nome: string;
  } | null;
};


export default function Alunos() {
  const { user } = useContext(AuthContext);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Buscar alunos
  const fetchAlunos = async () => {
    try {
      const response = await api.get('/alunos');
      console.log('Resposta da API:', response.data);
      
      // A API retorna: { message: "...", alunos: [...] }
      const alunosData = response.data.alunos || response.data || [];
      
      if (Array.isArray(alunosData)) {
        setAlunos(alunosData);
      } else {
        console.log('Dados não são um array válido');
        setAlunos([]);
      }
    } catch (error) {
      console.log('Erro ao buscar alunos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os alunos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlunos();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAlunos();
  }, []);

  // Função para obter a cor da situação
  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'APROVADO': return '#4CAF50';
      case 'REPROVADO': return '#F44336';
      case 'RECUPERACAO': return '#FF9800';
      default: return '#757575';
    }
  };

  // Função para obter o texto da situação
  const getSituacaoText = (situacao: string) => {
    switch (situacao) {
      case 'APROVADO': return 'Aprovado';
      case 'REPROVADO': return 'Reprovado';
      case 'RECUPERACAO': return 'Recuperação';
      default: return situacao;
    }
  };

  return (
    <RoleProtection 
      allowedRoles={['PROFESSOR', 'ADMIN', 'SECRETARIA']}
      fallbackMessage="Esta seção é apenas para professores e administradores.
Alunos podem acessar apenas os avisos."
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👨‍🎓 Alunos</Text>
          <Text style={styles.headerSubtitle}>
            {alunos.length} {alunos.length === 1 ? 'aluno' : 'alunos'} cadastrados
          </Text>
        </View>

        {/* Lista de Alunos */}
        <FlatList
          data={alunos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.alunoIcon}>
                  <Text style={styles.alunoIconText}>👨‍🎓</Text>
                </View>
                <View style={styles.alunoInfo}>
                  <Text style={styles.alunoName}>{item.nome}</Text>
                  <Text style={styles.alunoId}>ID: {item.id}</Text>
                </View>
                {/* Badge da Situação */}
                <View style={[styles.situacaoBadge, { backgroundColor: getSituacaoColor(item.situacao) }]}>
                  <Text style={styles.situacaoText}>{getSituacaoText(item.situacao)}</Text>
                </View>
              </View>

              {/* Turma */}
              {item.turma && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏫 Turma:</Text>
                  <View style={styles.tagContainer}>
                    <View style={[styles.tag, styles.turmaTag]}>
                      <Text style={styles.tagText}>{item.turma.nome}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Responsável */}
              {item.responsavel && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Responsável:</Text>
                  <View style={styles.responsavelContainer}>
                    <Text style={styles.responsavelNome}>{item.responsavel.nome}</Text>
                    {item.responsavel.telefone && (
                      <Text style={styles.responsavelTelefone}>📞 {item.responsavel.telefone}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Notas */}
              {item.notas && item.notas.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📊 Notas:</Text>
                  <View style={styles.tagContainer}>
                    {item.notas.map((nota, index) => (
                      <View key={index} style={[styles.tag, styles.notaTag]}>
                        <Text style={styles.tagText}>{nota.valor}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Caso não tenha turma, responsável ou notas */}
              {!item.turma && !item.responsavel && (!item.notas || item.notas.length === 0) && (
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
              <Text style={styles.emptyIcon}>👨‍🎓</Text>
              <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Os alunos aparecerão aqui após o cadastro
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
    borderLeftColor: "#4CAF50",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  alunoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e8f5e8",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  alunoIconText: {
    fontSize: 24,
  },
  alunoInfo: {
    flex: 1,
  },
  alunoName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 4,
  },
  alunoId: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  situacaoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  situacaoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
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
  notaTag: {
    backgroundColor: "#9C27B0",
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  responsavelContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  responsavelNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  responsavelTelefone: {
    fontSize: 14,
    color: "#666",
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