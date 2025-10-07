import React, { useEffect, useState, useContext } from "react";
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { api } from "../../services/api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";
import EditAvisoModal from './editAviso';
import { useDeleteAviso } from './deleteAviso';

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
  craidoEm: string;
  criadoEm?: string; // Campo opcional caso o backend corrija o nome
};

export default function Avisos() {
  const { user } = useContext(AuthContext);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisosFiltrados, setAvisosFiltrados] = useState<Aviso[]>([]);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [readAvisos, setReadAvisos] = useState<Set<number>>(new Set());
  const navigation = useNavigation();
  
  // Estados para edição
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avisoSelecionado, setAvisoSelecionado] = useState<Aviso | null>(null);
  
  // Hook para deletar aviso
  const executarDelete = useDeleteAviso();
  
  const isAluno = user.role === 'ALUNO';

  // Função para filtrar avisos por título ou data
  const filtrarAvisos = (avisos: Aviso[], termo: string) => {
    if (!termo.trim()) {
      return avisos;
    }

    const termoLower = termo.toLowerCase().trim();
    
    return avisos.filter(aviso => {
      // Busca no título
      const tituloMatch = aviso.titulo.toLowerCase().includes(termoLower);
      
      // Busca na descrição
      const descricaoMatch = aviso.descricao.toLowerCase().includes(termoLower);
      
      // Busca na data formatada
      const dataFormatada = formatDate(aviso.criadoEm || aviso.craidoEm);
      const dataMatch = dataFormatada.toLowerCase().includes(termoLower);
      
      return tituloMatch || descricaoMatch || dataMatch;
    });
  };

  // Carregar avisos lidos do AsyncStorage
  const loadReadAvisos = async () => {
    try {
      if (!user || !user.id) {
        console.log('⚠️ User ID não disponível ainda, aguardando...');
        return;
      }
      
      const readAvisosData = await AsyncStorage.getItem(`readAvisos_${user.id}`);
      if (readAvisosData) {
        const readIds = JSON.parse(readAvisosData);
        setReadAvisos(new Set(readIds));
        console.log('📖 Avisos lidos carregados para usuário', user.id, ':', readIds);
      } else {
        console.log('📖 Nenhum aviso lido encontrado para usuário', user.id);
        setReadAvisos(new Set()); // Garantir estado limpo
      }
    } catch (error) {
      console.log('Erro ao carregar avisos lidos:', error);
      setReadAvisos(new Set()); // Estado limpo em caso de erro
    }
  };

  // Salvar avisos lidos no AsyncStorage
  const saveReadAvisos = async (readIds: Set<number>) => {
    try {
      if (!user || !user.id) {
        console.log('⚠️ User ID não disponível, não foi possível salvar');
        return;
      }
      
      await AsyncStorage.setItem(`readAvisos_${user.id}`, JSON.stringify(Array.from(readIds)));
      console.log('💾 Avisos lidos salvos para usuário', user.id, ':', Array.from(readIds));
    } catch (error) {
      console.log('Erro ao salvar avisos lidos:', error);
    }
  };

  // Marcar aviso como lido
  const markAvisoAsRead = async (avisoId: number) => {
    const newReadAvisos = new Set(readAvisos);
    newReadAvisos.add(avisoId);
    setReadAvisos(newReadAvisos);
    await saveReadAvisos(newReadAvisos);
    console.log(`✅ Aviso ${avisoId} marcado como lido`);
  };

  // Função para abrir modal de edição
  const abrirEdicao = (aviso: Aviso) => {
    setAvisoSelecionado(aviso);
    setEditModalVisible(true);
  };

  // Função para fechar modal de edição
  const fecharEdicao = () => {
    setEditModalVisible(false);
    setAvisoSelecionado(null);
  };

  // Função para lidar com exclusão
  const handleDelete = (aviso: Aviso) => {
    console.log('🗑️ Iniciando exclusão do aviso:', aviso);
    console.log('Hook executarDelete:', typeof executarDelete);
    
    try {
      const deleteFunction = executarDelete(aviso, fetchAvisos);
      console.log('Função de delete criada:', typeof deleteFunction);
      deleteFunction();
    } catch (error) {
      console.log('Erro ao executar delete:', error);
    }
  };

  async function fetchAvisos() {
    try {
      // Adiciona timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await api.get(`/avisos?t=${timestamp}`);
      
      console.log('📢 Avisos carregados:', response.data.length);
      
      // Debug: verificar estrutura do primeiro aviso
      if (response.data.length > 0) {
        const primeiroAviso = response.data[0];
        console.log('🔍 Estrutura do primeiro aviso:', {
          id: primeiroAviso.id,
          titulo: primeiroAviso.titulo,
          camposDeData: Object.keys(primeiroAviso).filter(key => 
            key.toLowerCase().includes('cria') || 
            key.toLowerCase().includes('data') || 
            key.toLowerCase().includes('em')
          ),
          craidoEm: primeiroAviso.craidoEm,
          criadoEm: primeiroAviso.criadoEm,
          dataCompleta: primeiroAviso
        });
      }
      
      // Ordena os avisos do mais recente para o mais antigo
      const avisosOrdenados = response.data.sort((a: Aviso, b: Aviso) => {
        // Tenta usar criadoEm primeiro, depois craidoEm como fallback
        const dataA = a.criadoEm || a.craidoEm;
        const dataB = b.criadoEm || b.craidoEm;
        return new Date(dataB).getTime() - new Date(dataA).getTime();
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
      const loadData = async () => {
        // Garantir que o usuário esteja carregado antes de carregar dados
        if (user && user.id) {
          console.log('👤 Carregando dados para usuário:', user.id);
          await loadReadAvisos();
          await fetchAvisos();
        } else {
          console.log('⚠️ Usuário não carregado ainda, tentando novamente...');
          // Tentar novamente após um pequeno delay
          setTimeout(async () => {
            if (user && user.id) {
              console.log('👤 Segundo teste - carregando dados para usuário:', user.id);
              await loadReadAvisos();
              await fetchAvisos();
            }
          }, 100);
        }
      };
      loadData();
    }, [user, user?.id]) // Dependência do user e user.id
  );

  // Effect adicional para recarregar quando o usuário mudar (login/logout)
  useEffect(() => {
    if (user && user.id) {
      console.log('🔄 Usuário mudou, recarregando dados para:', user.id);
      const reloadData = async () => {
        // Limpar estado anterior
        setReadAvisos(new Set());
        // Carregar novos dados
        await loadReadAvisos();
        await fetchAvisos();
      };
      reloadData();
    }
  }, [user?.id]); // Só executa quando o user.id muda

  // Effect para filtrar avisos quando o termo de pesquisa mudar
  useEffect(() => {
    const avisosFiltrados = filtrarAvisos(avisos, termoPesquisa);
    setAvisosFiltrados(avisosFiltrados);
    console.log('🔍 Filtro aplicado:', { 
      termo: termoPesquisa, 
      totalAvisos: avisos.length, 
      avisosFiltrados: avisosFiltrados.length 
    });
  }, [termoPesquisa, avisos]);

  const formatDate = (dateString: string) => {
    try {
      // Verifica se a string da data é válida
      if (!dateString || dateString === null || dateString === undefined) {
        console.log('⚠️ Data inválida ou nula:', dateString);
        return "Data não disponível";
      }

      const date = new Date(dateString);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.log('⚠️ Data inválida após conversão:', dateString, '→', date);
        return "Data inválida";
      }

      // Sempre retorna a data formatada em português brasileiro
      // Formato: dd/mm/aaaa
      return date.toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      console.log('❌ Erro ao formatar data:', dateString, error);
      return "Data inválida";
    }
  };

  const toggleExpandCard = (cardId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        // Se está contraindo (fechando), não faz nada
        newSet.delete(cardId);
      } else {
        // Se está expandindo (abrindo), apenas expande - não marca como lido
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Função para marcar como lido ao tocar no card
  const handleCardPress = (avisoId: number) => {
    // Marca como lido quando o usuário toca no card (mostra interesse)
    if (!readAvisos.has(avisoId)) {
      markAvisoAsRead(avisoId);
      console.log(`� Aviso marcado como lido: ${avisoId}`);
    }
  };

  const shouldShowReadMore = (text: string) => {
    return text && text.length > 100;
  };

  // Calcular avisos não lidos (considerando filtro)
  const getUnreadCount = () => {
    return avisosFiltrados.filter(aviso => !readAvisos.has(aviso.id)).length;
  };

  // Calcular avisos lidos (considerando filtro)
  const getReadCount = () => {
    return avisosFiltrados.filter(aviso => readAvisos.has(aviso.id)).length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📢 Avisos</Text>
        <Text style={styles.headerSubtitle}>
          {termoPesquisa ? 
            `${avisosFiltrados.length} de ${avisos.length} avisos encontrados` :
            `${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'} disponíveis`
          }
        </Text>
        
        {/* Campo de Pesquisa */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color="#e0e0e0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título ou data..."
            placeholderTextColor="#a0a0a0"
            value={termoPesquisa}
            onChangeText={setTermoPesquisa}
            returnKeyType="search"
          />
          {termoPesquisa.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setTermoPesquisa('')}
            >
              <Feather name="x" size={16} color="#e0e0e0" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Contador de avisos não lidos */}
        <View style={styles.counterContainer}>
          <View style={styles.counterItem}>
            <View style={[styles.counterDot, styles.unreadDot]} />
            <Text style={styles.counterText}>
              {getUnreadCount()} não {getUnreadCount() === 1 ? 'lido' : 'lidos'}
            </Text>
          </View>
          
          <View style={styles.counterItem}>
            <View style={[styles.counterDot, styles.readDot]} />
            <Text style={styles.counterText}>
              {getReadCount()} {getReadCount() === 1 ? 'lido' : 'lidos'}
            </Text>
          </View>
        </View>
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
        data={avisosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isExpanded = expandedCards.has(item.id);
          const showReadMore = shouldShowReadMore(item.descricao);
          const isRead = readAvisos.has(item.id);
          
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleCardPress(item.id)}
            >
              <View style={[
                styles.card, 
                isRead && styles.readCard
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={styles.cardTitleContainer}>
                      <Text style={[
                        styles.cardTitle,
                        isRead && styles.readText
                      ]}>
                        {isRead && '✓ '}{item.titulo}
                      </Text>
                    </View>
                    <Text style={[
                      styles.cardDate,
                      isRead && styles.readText
                    ]}>
                      {formatDate(item.criadoEm || item.craidoEm)}
                    </Text>
                  </View>
                  
                  {/* Botões de ação - apenas para não-alunos */}
                  {!isAluno && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => abrirEdicao(item)}
                      >
                        <Feather name="edit-3" size={16} color="#007BFF" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item)}
                      >
                        <Feather name="trash-2" size={16} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <Text 
                  style={[
                    styles.cardDescription, 
                    !showReadMore && { marginBottom: 0 },
                    isRead && styles.readText
                  ]} 
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {item.descricao}
                </Text>
                
                {/* Botão Ler mais/menos */}
                <View style={styles.cardFooter}>
                  {showReadMore && (
                    <TouchableOpacity 
                      style={[styles.readMoreButton, isRead && styles.readReadMoreButton]}
                      onPress={(e) => {
                        e.stopPropagation(); // Impede que o toque no card seja acionado
                        toggleExpandCard(item.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.readMoreText, isRead && styles.readText]}>
                        {isExpanded ? '📖 Ler menos' : '👁️ Ler mais'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
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
            <Text style={styles.emptyIcon}>{termoPesquisa ? "�" : "�📭"}</Text>
            <Text style={styles.emptyTitle}>
              {termoPesquisa ? "Nenhum aviso encontrado" : "Nenhum aviso disponível"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {termoPesquisa 
                ? `Nenhum aviso corresponde à busca "${termoPesquisa}"`
                : (isAluno 
                    ? "Os avisos aparecerão aqui quando publicados" 
                    : "Que tal criar o primeiro aviso?"
                  )
              }
            </Text>
          </View>
        )}
      />

      {/* Modal de Edição */}
      <EditAvisoModal
        visible={editModalVisible}
        aviso={avisoSelecionado}
        onClose={fecharEdicao}
        onUpdate={fetchAvisos}
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
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 20,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadDot: {
    backgroundColor: '#FF6B6B',
  },
  readDot: {
    backgroundColor: '#4CAF50',
  },
  counterText: {
    fontSize: 14,
    color: '#e0e0e0',
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
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
  // Estilos para campo de pesquisa
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    height: 40,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  // Estilos para avisos lidos (esmaecidos)
  readCard: {
    opacity: 0.6,
    backgroundColor: "#f8f8f8",
  },
  readText: {
    color: "#888",
  },
  readReadMoreButton: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  },
});
