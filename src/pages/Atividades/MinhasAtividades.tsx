import React, { useEffect, useState, useContext } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import atividadeService, { Atividade } from '../../services/atividadeService';
import { api } from '../../services/api';

export default function MinhasAtividades() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [alunoInfo, setAlunoInfo] = useState<any>(null);

  console.log('🎓 MinhasAtividades - Usuário:', user?.id, user?.role);
  console.log('🔍 DEBUG - User COMPLETO:', JSON.stringify(user, null, 2));
  console.log('🔍 DEBUG - User.aluno:', (user as any)?.aluno);
  console.log('🔍 DEBUG - Todas as propriedades do user:', Object.keys(user || {}));

  // Buscar informações do aluno logado
  const fetchAlunoInfo = async () => {
    console.log('=================================');
    console.log('🎓 INICIANDO BUSCA DO ALUNO');
    console.log('=================================');
    console.log('🔍 ID do usuário:', user?.id, 'Role:', user?.role);
    
    try {
      // PRIMEIRO: Verificar se já temos dados no contexto do usuário
      const userAluno = (user as any)?.aluno;
      console.log('🔍 Verificando contexto do usuário - user.aluno:', userAluno);
      
      if (userAluno && (userAluno.turmaId || userAluno.id)) {
        console.log('✅ Informações do aluno encontradas no contexto:', userAluno);
        setAlunoInfo(userAluno);
        return userAluno;
      } else {
        console.log('❌ Contexto do usuário não contém dados de aluno válidos');
      }
      
      // SEGUNDO: Tentar buscar diretamente pelo ID do usuário
      let alunoData: any = null;
      
      try {
        console.log(`🔍 Tentando buscar aluno via /alunos/${user?.id}...`);
        const response = await api.get(`/alunos/${user?.id}`);
        alunoData = response.data;
        console.log('✅ Informações do aluno encontradas via API direta:', alunoData);
      } catch (error: any) {
        console.log('⚠️ Erro ao buscar aluno pelo ID do usuário:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        console.log('🔄 Tentando listar todos os alunos...');
        
        // TERCEIRO: Fallback - buscar na lista de alunos
        try {
          console.log('🚀 EXECUTANDO: Busca na lista geral de alunos...');
          const alunosResponse = await api.get('/alunos');
          
          // Verificar estrutura da resposta
          console.log('📊 RESPOSTA /alunos:', typeof alunosResponse.data, JSON.stringify(alunosResponse.data, null, 2));
          
          let alunos = alunosResponse.data;
          
          // Se a resposta tem uma propriedade 'alunos', usar ela
          if (alunos && typeof alunos === 'object' && alunos.alunos) {
            alunos = alunos.alunos;
          }
          
          console.log('📊 SUCESSO: Total de alunos encontrados:', alunos?.length);
          
          if (Array.isArray(alunos) && alunos.length > 0) {
            console.log('🔍 ESTRUTURA: Primeiros 3 alunos:', JSON.stringify(alunos.slice(0, 3), null, 2));
          }
          
          if (Array.isArray(alunos)) {
            // Tentar múltiplas formas de encontrar o aluno
            alunoData = alunos.find((aluno: any) => {
              const matchUserId = aluno.userId === parseInt(user?.id || '0');
              const matchUserIdString = String(aluno.userId) === String(user?.id);
              const matchId = aluno.id === parseInt(user?.id || '0');
              const matchIdString = String(aluno.id) === String(user?.id);
              
              console.log(`🔍 Verificando aluno ${aluno.id}:`, {
                alunoUserId: aluno.userId,
                alunoId: aluno.id,
                userID: user?.id,
                matchUserId,
                matchUserIdString,
                matchId,
                matchIdString
              });
              
              return matchUserId || matchUserIdString || matchId || matchIdString;
            });
            console.log('📋 Aluno encontrado na lista geral:', alunoData);
          }
        } catch (listError) {
          console.error('❌ Erro ao buscar lista de alunos:', listError);
        }
      }
      
      // QUARTO: Se ainda não temos turmaId, buscar nas turmas
      if (!alunoData || !alunoData.turmaId) {
        console.log('🔍 Tentando encontrar turma do aluno através das turmas...');
        console.log('🎯 Procurando por userId:', user?.id, 'ou alunoData.id:', alunoData?.id);
        
        try {
          console.log('🚀 EXECUTANDO: Busca de turmas...');
          const turmasResponse = await api.get('/turmas');
          
          // Verificar estrutura da resposta
          console.log('📊 RESPOSTA /turmas:', typeof turmasResponse.data);
          
          let turmas = turmasResponse.data;
          
          // Se a resposta tem uma propriedade 'turmas', usar ela
          if (turmas && typeof turmas === 'object' && turmas.turmas) {
            turmas = turmas.turmas;
            console.log('📊 SUCESSO: Extraído array de turmas, total:', turmas?.length);
          }
          
          if (Array.isArray(turmas)) {
            for (const turma of turmas) {
              console.log(`🔍 Verificando turma ${turma.id} (${turma.nome}):`);
              console.log(`   📋 Tem alunos:`, !!turma.alunos);
              console.log(`   👥 Quantidade de alunos:`, turma.alunos?.length || 0);
              
              if (turma.alunos && Array.isArray(turma.alunos)) {
                console.log(`   📝 Primeiros 2 alunos da turma:`, JSON.stringify(turma.alunos.slice(0, 2), null, 2));
                
                const alunoNaTurma = turma.alunos.find((aluno: any) => {
                  const matchUserId = aluno.userId === parseInt(user?.id || '0');
                  const matchUserIdString = String(aluno.userId) === String(user?.id);
                  const matchId = aluno.id === alunoData?.id;
                  const matchAlunoUserId = aluno.id === parseInt(user?.id || '0');
                  
                  console.log(`     🔍 Verificando aluno ${aluno.id} na turma:`, {
                    alunoUserId: aluno.userId,
                    alunoId: aluno.id,
                    userID: user?.id,
                    alunoDataId: alunoData?.id,
                    matchUserId,
                    matchUserIdString,
                    matchId,
                    matchAlunoUserId
                  });
                  
                  return matchUserId || matchUserIdString || matchId || matchAlunoUserId;
                });
                
                if (alunoNaTurma) {
                  console.log(`✅ ENCONTRADO! Aluno na turma ${turma.id} (${turma.nome}):`, alunoNaTurma);
                  alunoData = {
                    ...alunoData,
                    ...alunoNaTurma,
                    turmaId: turma.id,
                    turmaNome: turma.nome
                  };
                  break;
                }
              } else {
                console.log(`   ⚠️ Turma ${turma.nome} não tem alunos ou estrutura inválida`);
              }
            }
          }
        } catch (turmaError) {
          console.error('❌ Erro ao buscar turmas:', turmaError);
        }
      }
      
      // QUINTO: Última tentativa - endpoints alternativos
      if (!alunoData || !alunoData.turmaId) {
        console.log('🔍 Última tentativa: testando endpoints alternativos...');
        
        const endpointsParaTestar = [
          `/users/${user?.id}`,
          `/user/${user?.id}`,
          `/users/${user?.id}/profile`,
          `/me`,
          `/profile`
        ];
        
        for (const endpoint of endpointsParaTestar) {
          try {
            console.log(`🔍 Testando endpoint: ${endpoint}`);
            const response = await api.get(endpoint);
            console.log(`✅ Resposta de ${endpoint}:`, JSON.stringify(response.data, null, 2));
            
            // Verificar se tem informações úteis
            if (response.data && (response.data.aluno || response.data.turmaId || response.data.turma)) {
              console.log(`✅ Endpoint ${endpoint} retornou dados úteis!`);
              const dadosUteis = response.data.aluno || response.data;
              alunoData = { ...alunoData, ...dadosUteis };
              break;
            }
          } catch (endpointError) {
            console.log(`⚠️ Endpoint ${endpoint} não disponível`);
          }
        }
      }
      
      console.log('=================================');
      console.log('🏁 FINALIZANDO BUSCA DO ALUNO');
      console.log('📊 Resultado final:', alunoData);
      console.log('=================================');
      
      setAlunoInfo(alunoData);
      return alunoData;
      
    } catch (error) {
      console.log('=================================');
      console.error('❌ ERRO GERAL na busca do aluno:', error);
      console.log('=================================');
      return null;
    }
  };

  const fetchMinhasAtividades = async () => {
    try {
      setLoading(true);
      console.log('📚 Buscando atividades para o aluno...');
      console.log('🎯 Iniciando busca detalhada das informações do aluno...');
      
      // Buscar informações do aluno primeiro
      const aluno = await fetchAlunoInfo();
      console.log('🔍 Resultado da busca de informações do aluno:', aluno);
      
      // Buscar todas as atividades
      const todasAtividades = await atividadeService.listar();
      console.log('📋 Total de atividades no sistema:', todasAtividades?.length || 0);
      
      if (Array.isArray(todasAtividades)) {
        console.log('🔍 Filtrando atividades para o aluno...');
        console.log('👨‍🎓 Aluno info:', aluno);
        
        // Filtrar atividades que o aluno pode ver
        const atividadesDoAluno = todasAtividades.filter((atividade: Atividade) => {
          // Se não tem turmas específicas, é para todos os alunos
          if (!atividade.turmas || atividade.turmas.length === 0) {
            console.log(`📝 Atividade "${atividade.titulo}" é para todos os alunos`);
            return true;
          }
          
          // Extrair turmaId do aluno (várias fontes possíveis)
          let alunoTurmaId = null;
          
          if (aluno) {
            // Tentar diferentes propriedades onde pode estar a turmaId
            alunoTurmaId = aluno.turmaId || aluno.turma?.id || aluno.turma || 
                          (aluno as any).Turma?.id || (aluno as any).turma_id;
          }
          
          // Se ainda não temos turmaId, verificar no contexto do usuário
          if (!alunoTurmaId) {
            const userAluno = (user as any)?.aluno;
            if (userAluno) {
              alunoTurmaId = userAluno.turmaId || userAluno.turma?.id || userAluno.turma;
            }
          }
          
          if (alunoTurmaId) {
            // Verificar se o aluno está em alguma das turmas da atividade
            const pertenceATurma = atividade.turmas.some((turma: any) => {
              const turmaIdAtividade = turma.id || turma.turmaId || turma;
              return turmaIdAtividade === alunoTurmaId || 
                     turmaIdAtividade === parseInt(String(alunoTurmaId)) ||
                     String(turmaIdAtividade) === String(alunoTurmaId);
            });
            
            if (pertenceATurma) {
              console.log(`✅ Atividade "${atividade.titulo}" pertence à turma do aluno (${alunoTurmaId})`);
            } else {
              console.log(`❌ Atividade "${atividade.titulo}" NÃO pertence à turma do aluno (${alunoTurmaId})`);
              console.log(`   📋 Turmas da atividade:`, atividade.turmas.map((t: any) => t.id || t.turmaId || t));
            }
            
            return pertenceATurma;
          }
          
          // ESTRATÉGIA FINAL: Se não conseguimos determinar a turma, aplicar lógica mais conservadora
          console.log(`⚠️ Não foi possível determinar turma do aluno para atividade "${atividade.titulo}"`);
          console.log(`   🔍 Dados disponíveis do aluno:`, JSON.stringify(aluno, null, 2));
          console.log(`   🔍 Dados do contexto do usuário:`, JSON.stringify((user as any)?.aluno, null, 2));
          
          // Se a atividade tem turmas específicas mas não conseguimos determinar a turma do aluno,
          // vamos ser mais conservadores e não mostrar (para evitar violação de privacidade)
          // EXCETO se for uma atividade "geral" (sem turma ou com muitas turmas)
          if (atividade.turmas.length >= 3) {
            console.log(`   ✅ Atividade "${atividade.titulo}" tem ${atividade.turmas.length} turmas (provavelmente geral)`);
            return true;
          } else {
            console.log(`   ❌ Atividade "${atividade.titulo}" tem poucas turmas (${atividade.turmas.length}) - ocultando por segurança`);
            return false;
          }
        });
        
        console.log('✅ Atividades filtradas para o aluno:', atividadesDoAluno.length);
        console.log('📊 Resumo da filtragem:', {
          totalAtividades: todasAtividades.length,
          atividadesFiltradas: atividadesDoAluno.length,
          temInfoAluno: !!aluno,
          temTurmaId: !!(aluno?.turmaId || (user as any)?.aluno?.turmaId)
        });
        
        // Se não temos informação da turma e temos poucas atividades, avisar o usuário
        if (!aluno?.turmaId && !(user as any)?.aluno?.turmaId && atividadesDoAluno.length < todasAtividades.length) {
          console.log('⚠️ Filtragem pode estar incompleta - falta informação da turma do aluno');
        }
        
        setAtividades(atividadesDoAluno);
      } else {
        console.log('⚠️ Dados não são um array válido:', todasAtividades);
        setAtividades([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar atividades:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas atividades');
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMinhasAtividades();
    setRefreshing(false);
  };

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return 'Data não disponível';
    }
  };

  // Função de teste direto dos endpoints
  const testarEndpointsDireto = async () => {
    console.log('🧪 TESTE DIRETO DOS ENDPOINTS');
    
    // Teste 1: /alunos
    try {
      console.log('🧪 Testando /alunos...');
      const alunosRes = await api.get('/alunos');
      
      let alunos = alunosRes.data;
      if (alunos && typeof alunos === 'object' && alunos.alunos) {
        alunos = alunos.alunos;
      }
      
      console.log('✅ /alunos funcionou! Total:', alunos?.length);
      
      if (Array.isArray(alunos)) {
        console.log('📋 Primeiros 2 alunos:', JSON.stringify(alunos.slice(0, 2), null, 2));
        
        // Procurar usuário 26
        const aluno26 = alunos.find((a: any) => a.userId === 26 || a.id === 26);
        console.log('🎯 Usuário 26 encontrado:', aluno26);
      } else {
        console.log('⚠️ /alunos não retornou array válido:', typeof alunos);
      }
    } catch (error) {
      console.log('❌ Erro em /alunos:', error);
    }
    
    // Teste 2: /turmas
    try {
      console.log('🧪 Testando /turmas...');
      const turmasRes = await api.get('/turmas');
      
      let turmas = turmasRes.data;
      if (turmas && typeof turmas === 'object' && turmas.turmas) {
        turmas = turmas.turmas;
      }
      
      console.log('✅ /turmas funcionou! Total:', turmas?.length);
      
      if (Array.isArray(turmas)) {
        // Procurar usuário 26 nas turmas
        for (const turma of turmas) {
          console.log(`🔍 Verificando turma ${turma.id} (${turma.nome}):`);
          console.log(`   👥 Alunos na turma: ${turma.alunos?.length || 0}`);
          
          if (turma.alunos && turma.alunos.length > 0) {
            const aluno26 = turma.alunos.find((a: any) => a.userId === 26 || a.id === 26);
            if (aluno26) {
              console.log(`🎯 ENCONTRADO! Usuário 26 na turma ${turma.id} (${turma.nome}):`, aluno26);
            }
          }
        }
      } else {
        console.log('⚠️ /turmas não retornou array válido:', typeof turmas);
      }
    } catch (error) {
      console.log('❌ Erro em /turmas:', error);
    }
  };

  useEffect(() => {
    // Executar teste direto primeiro
    testarEndpointsDireto();
    
    // Depois executar a função normal
    fetchMinhasAtividades();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando suas atividades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Minhas Atividades</Text>
        <Text style={styles.headerSubtitle}>
          {atividades.length} {atividades.length === 1 ? 'atividade encontrada' : 'atividades encontradas'}
        </Text>
        
        {/* Status do aluno */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Feather name="user" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>Aluno: {user?.name}</Text>
          </View>
          {alunoInfo && (alunoInfo.turmaId || alunoInfo.turmaNome) && (
            <View style={styles.statusItem}>
              <Feather name="users" size={16} color="#2196F3" />
              <Text style={styles.statusText}>
                Turma: {alunoInfo.turmaNome || alunoInfo.turmaId}
                {alunoInfo.turmaNome && alunoInfo.turmaId && ` (${alunoInfo.turmaId})`}
              </Text>
            </View>
          )}
          {!alunoInfo?.turmaId && !(user as any)?.aluno?.turmaId && (
            <View style={[styles.statusItem, styles.warningItem]}>
              <Feather name="alert-triangle" size={16} color="#FF9800" />
              <Text style={styles.warningText}>Turma não identificada</Text>
            </View>
          )}
        </View>

        {/* Botão Voltar para Dashboard */}
        <TouchableOpacity 
          style={styles.backToDashboardButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="home" size={16} color="#fff" />
          <Text style={styles.backToDashboardText}>Voltar ao Dashboard</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={atividades}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.atividadeCard}>
            {/* Header do Card */}
            <View style={styles.cardHeader}>
              <View style={styles.atividadeIcon}>
                <Text style={styles.atividadeIconText}>📝</Text>
              </View>
              <View style={styles.atividadeInfo}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                <View style={styles.metaInfo}>
                  <Feather name="clock" size={12} color="#666" />
                  <Text style={styles.dataText}>
                    Atividade ID: {item.id}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Descrição */}
            <Text style={styles.descricao} numberOfLines={4}>
              {item.descricao}
            </Text>

            {/* Disciplina */}
            {item.disciplina && (
              <View style={styles.metaContainer}>
                <View style={styles.disciplinaTag}>
                  <Feather name="book-open" size={14} color="#4CAF50" />
                  <Text style={styles.disciplinaText}>{item.disciplina.nome}</Text>
                </View>
              </View>
            )}

            {/* Turmas */}
            {item.turmas && item.turmas.length > 0 && (
              <View style={styles.metaContainer}>
                <View style={styles.turmasContainer}>
                  <Feather name="users" size={14} color="#2196F3" />
                  <Text style={styles.turmasLabel}>Turmas:</Text>
                  <View style={styles.turmasRow}>
                    {item.turmas.slice(0, 2).map((turma) => (
                      <View key={turma.id} style={styles.turmaTag}>
                        <Text style={styles.turmaText}>{turma.nome}</Text>
                      </View>
                    ))}
                    {item.turmas.length > 2 && (
                      <Text style={styles.moreTurmasText}>
                        +{item.turmas.length - 2} mais
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Status/Badge */}
            <View style={styles.cardFooter}>
              <View style={styles.statusBadge}>
                <Feather name="eye" size={12} color="#2196F3" />
                <Text style={styles.statusBadgeText}>Disponível para visualização</Text>
              </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Nenhuma atividade encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Quando os professores criarem atividades para sua turma,{'\n'}
              elas aparecerão aqui.
            </Text>
            <View style={styles.emptyTip}>
              <Feather name="info" size={16} color="#4CAF50" />
              <Text style={styles.emptyTipText}>
                Dica: Puxe para baixo para atualizar a lista
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    backgroundColor: '#191970',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e6ff',
    marginBottom: 15,
  },
  statusContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingVertical: 15,
    paddingBottom: 30,
  },
  atividadeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  atividadeIcon: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  atividadeIconText: {
    fontSize: 20,
  },
  atividadeInfo: {
    flex: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  descricao: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
    marginBottom: 15,
  },
  metaContainer: {
    marginBottom: 10,
  },
  disciplinaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  disciplinaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 6,
  },
  turmasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  turmasLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
    marginLeft: 6,
    marginRight: 8,
  },
  turmasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  turmaTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  turmaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2196F3',
  },
  moreTurmasText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  cardFooter: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyTipText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  backToDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backToDashboardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningItem: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderColor: 'rgba(255, 152, 0, 0.3)',
    borderWidth: 1,
  },
  warningText: {
    color: '#FF9800',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
});