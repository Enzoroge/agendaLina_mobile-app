import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import atividadeService, { Atividade } from '../../services/atividadeService';

export default function Atividades() {
  const navigation = useNavigation();
  const [atividades, setAtividades] = useState<Atividade[]>([]) // Tipagem explícita
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchAtividades = async () => {
    try {
      setLoading(true)
      console.log('Buscando atividades...')
      
      const atividadesData = await atividadeService.listar()
      console.log('Atividades carregadas:', atividadesData)
      
      // Verificar se a resposta tem a estrutura esperada
      if (Array.isArray(atividadesData)) {
        setAtividades(atividadesData)
        console.log(`${atividadesData.length} atividades carregadas`)
      } else {
        console.log('Dados não são um array válido:', atividadesData)
        setAtividades([])
      }
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
      Alert.alert('Erro', 'Não foi possível carregar as atividades')
      setAtividades([]) // Fallback para array vazio
    } finally {
      setLoading(false)
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAtividades();
    setRefreshing(false);
  };

  const handleCreateAtividade = () => {
    navigation.navigate('CriarAtividades' as never);
  };

  const handleEditAtividade = (id: number) => {
    (navigation as any).navigate('EditAtividade', { atividadeId: id });
  };

  const handleDeleteAtividade = (id: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja deletar esta atividade?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await atividadeService.deletar(id);
              Alert.alert('Sucesso', 'Atividade deletada com sucesso');
              fetchAtividades(); // Recarregar a lista
            } catch (error) {
              console.error('Erro ao deletar atividade:', error);
              Alert.alert('Erro', 'Não foi possível deletar a atividade');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchAtividades();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando atividades...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 Atividades</Text>
        <Text style={styles.headerSubtitle}>
          {atividades.length} {atividades.length === 1 ? 'atividade' : 'atividades'} encontradas
        </Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateAtividade}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nova Atividade</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={atividades}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.atividadeLeft}>
                <View style={styles.atividadeIcon}>
                  <Text style={styles.atividadeIconText}>📝</Text>
                </View>
                <View style={styles.atividadeInfo}>
                  <Text style={styles.titulo}>{item.titulo}</Text>
                  <Text style={styles.atividadeId}>ID: {item.id}</Text>
                </View>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditAtividade(item.id)}
                >
                  <Feather name="edit-3" size={16} color="#3498db" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteAtividade(item.id)}
                >
                  <Feather name="trash-2" size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.descricao} numberOfLines={3}>
              {item.descricao}
            </Text>

            {/* Disciplina */}
            {item.disciplina && (
              <View style={styles.disciplinaContainer}>
                <Text style={styles.disciplinaLabel}>📚 Disciplina:</Text>
                <View style={styles.disciplinaTag}>
                  <Text style={styles.disciplinaText}>{item.disciplina.nome}</Text>
                </View>
              </View>
            )}

            {/* Turmas */}
            {item.turmas && item.turmas.length > 0 && (
              <View style={styles.turmasContainer}>
                <Text style={styles.turmasLabel}>🎓 Turmas:</Text>
                <View style={styles.turmasRow}>
                  {item.turmas.slice(0, 3).map((turma) => (
                    <View key={turma.id} style={styles.turmaTag}>
                      <Text style={styles.turmaText}>{turma.nome}</Text>
                    </View>
                  ))}
                  {item.turmas.length > 3 && (
                    <View style={styles.moreTurmasTag}>
                      <Text style={styles.moreTurmasText}>+{item.turmas.length - 3}</Text>
                    </View>
                  )}
                </View>
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
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Nenhuma atividade encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão "+" para criar uma nova atividade
            </Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={handleCreateAtividade}
            >
              <Feather name="plus" size={20} color="#4CAF50" />
              <Text style={styles.createFirstButtonText}>Criar primeira atividade</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e4e7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  itemContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e4e7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  atividadeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  atividadeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  atividadeIconText: {
    fontSize: 18,
  },
  atividadeInfo: {
    flex: 1,
  },
  atividadeId: {
    fontSize: 12,
    color: '#95a5a6',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  descricao: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 15,
    lineHeight: 22,
  },
  disciplinaContainer: {
    marginTop: 10,
  },
  disciplinaLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  disciplinaTag: {
    backgroundColor: '#e8f4f8',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  disciplinaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  createFirstButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    marginLeft: 8,
  },
  turmasContainer: {
    marginTop: 10,
  },
  turmasLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  turmasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  turmaTag: {
    backgroundColor: '#e8f4f8',
    borderWidth: 1,
    borderColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  turmaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
  },
  moreTurmasTag: {
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  moreTurmasText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
  },
});