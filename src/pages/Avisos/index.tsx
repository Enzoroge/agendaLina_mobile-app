import React, { useEffect, useState, useContext } from "react";
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert
} from "react-native";
import { api } from "../../services/api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
  craidoEm: string;
};

export default function Avisos() {
  const { user } = useContext(AuthContext);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const navigation = useNavigation();
  
  const isAluno = user.role === 'ALUNO';

  async function fetchAvisos() {
    try {
      const response = await api.get("/avisos");
      // Ordena os avisos do mais recente para o mais antigo
      const avisosOrdenados = response.data.sort((a: Aviso, b: Aviso) => {
        return new Date(b.craidoEm).getTime() - new Date(a.craidoEm).getTime();
      });
      setAvisos(avisosOrdenados);
    } catch (error) {
      console.log("Erro ao buscar avisos", error);
      Alert.alert("Erro", "Não foi possível carregar os avisos");
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvisos();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAvisos();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hoje";
    if (diffDays === 2) return "Ontem";
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const toggleExpandCard = (cardId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const shouldShowReadMore = (text: string) => {
    return text && text.length > 100;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📢 Avisos</Text>
        <Text style={styles.headerSubtitle}>
          {avisos.length} {avisos.length === 1 ? 'aviso' : 'avisos'} disponíveis
        </Text>
      </View>

      {/* Create Button - apenas para não-alunos */}
      {!isAluno && (
        <View style={styles.createButtonContainer}>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => (navigation as any).navigate("CriarAviso")}
          >
            <Text style={styles.createButtonText}>➕ Criar Novo Aviso</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Avisos */}
      <FlatList
        data={avisos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isExpanded = expandedCards.has(item.id);
          const showReadMore = shouldShowReadMore(item.descricao);
          
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{item.titulo}</Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(item.craidoEm)}</Text>
              </View>
              
              <Text 
                style={[styles.cardDescription, !showReadMore && { marginBottom: 0 }]} 
                numberOfLines={isExpanded ? undefined : 3}
              >
                {item.descricao}
              </Text>
              
              {/* Botão Ler mais/menos */}
              <View style={styles.cardFooter}>
                {showReadMore && (
                  <TouchableOpacity 
                    style={styles.readMoreButton}
                    onPress={() => toggleExpandCard(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.readMoreText}>
                      {isExpanded ? '📖 Ler menos' : '👁️ Ler mais'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          isAluno && styles.listContainerWithoutButton
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Nenhum aviso encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {isAluno 
                ? "Os avisos aparecerão aqui quando publicados" 
                : "Que tal criar o primeiro aviso?"
              }
            </Text>
          </View>
        )}
      />
    </View>
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
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContainerWithoutButton: {
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 18,
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
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#191970",
  },
  cardDate: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  cardDescription: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 15,
  },
  cardFooter: {
    marginTop: 5,
    alignItems: 'flex-start',
  },
  readMoreButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  readMoreText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
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
