import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ScrollView } from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";

const { width } = Dimensions.get("window");

type Aviso = {
  id: string;
  titulo: string;
  descricao: string;
  criadoEm: string;
};

type Turma = {
  id: number;
  nome: string;
  ano: number;
};

// Cache simples para evitar chamadas repetidas
const endpointCache = {
  lastChecked: null as Date | null,
  professorEndpointAvailable: null as boolean | null,
  turmasEndpointAvailable: null as boolean | null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const isCacheValid = () => {
  return endpointCache.lastChecked && 
         (Date.now() - endpointCache.lastChecked.getTime()) < CACHE_DURATION;
};

export default function Dashboard() {
  const { signOut, user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmasLoading, setTurmasLoading] = useState(false);
  const [turmasError, setTurmasError] = useState<string | null>(null);
  const isAluno = user.role === 'ALUNO';
  const isProfessor = user.role === 'PROFESSOR';
  
  useFocusEffect(
    React.useCallback(() => {
      async function fetchMinhasTurmas() {
        // Evitar múltiplas chamadas simultâneas
        if (turmasLoading) {
          console.log('⏳ Já carregando turmas, pulando nova chamada');
          return;
        }
        
        setTurmasLoading(true);
        setTurmasError(null);
        
        console.log('=== DEBUG DASHBOARD TURMAS ===');
        console.log('Tipo de usuário:', user.role);
        console.log('ID do usuário:', user.id);
        console.log('isAluno:', isAluno);
        console.log('isProfessor:', isProfessor);
        
        try {
          let response;
          
          if (isAluno) {
            // Para aluno: backend não tem endpoint /alunos/{id}, usar alternativa
            console.log('⚠️ Aluno: Endpoint /alunos/{id} não disponível no backend');
            console.log('🔄 Usando estratégia alternativa para alunos');
            
            // Como não há endpoint específico, não mostrar turmas específicas para alunos
            // Em implementação futura, isso poderia vir do contexto de autenticação
            setTurmas([]);
            console.log('📋 Turmas ocultadas para aluno (endpoint específico indisponível)');
            
          } else if (isProfessor) {
            // Para professor: usar endpoint correto /professor/{id} (sem 's')
            console.log('🔍 Verificando cache de endpoints...');
            
            if (isCacheValid() && endpointCache.professorEndpointAvailable === false) {
              console.log('📋 Cache indica que endpoints de professor não funcionam, indo direto para fallback');
              
              try {
                const allTurmasResponse = await api.get('/turmas');
                console.log('✅ Sucesso direto no fallback de todas as turmas:', allTurmasResponse.data);
                setTurmas(allTurmasResponse.data || []);
                console.log('✅ Exibindo todas as turmas para professor (cache otimizado)');
              } catch (finalError: any) {
                console.log('❌ Fallback direto também falhou');
                setTurmas([]);
              }
            } else {
              // Tentar endpoint correto que existe no backend
              const endpoint = `/professor/${user.id}`;
              console.log('Tentando endpoint CORRETO de PROFESSOR:', endpoint);
              
              try {
                response = await api.get(endpoint);
                console.log('✅ Sucesso - Resposta para professor:', response.data);
                
                // Atualizar cache como disponível
                endpointCache.professorEndpointAvailable = true;
                endpointCache.lastChecked = new Date();
                
                if (response.data && response.data.turmas && response.data.turmas.length > 0) {
                  const turmasVinculadas = response.data.turmas.map((t: any) => t.turma || t);
                  setTurmas(turmasVinculadas);
                  console.log('✅ Turmas do professor definidas:', turmasVinculadas);
                } else if (response.data && Array.isArray(response.data)) {
                  // Se retornar array direto
                  setTurmas(response.data);
                  console.log('✅ Turmas do professor (formato direto):', response.data);
                } else {
                  setTurmas([]);
                  console.log('⚠️ Nenhuma turma encontrada para o professor');
                }
              } catch (professorError: any) {
                console.log('❌ ERRO no endpoint de professor:', endpoint);
                console.log('Status:', professorError.response?.status);
                console.log('Message:', professorError.response?.data?.message || professorError.message);
                
                if (professorError.response?.status === 404) {
                  // Atualizar cache como indisponível
                  endpointCache.professorEndpointAvailable = false;
                  endpointCache.lastChecked = new Date();
                  
                  console.log('🔄 Professor específico não encontrado, tentando buscar todas as turmas como fallback');
                  try {
                    const allTurmasResponse = await api.get('/turmas');
                    console.log('✅ Sucesso no fallback de todas as turmas:', allTurmasResponse.data);
                    setTurmas(allTurmasResponse.data || []);
                    console.log('✅ Exibindo todas as turmas para professor como fallback');
                  } catch (finalError: any) {
                    console.log('❌ Fallback final também falhou para professor');
                    console.log('Status final:', finalError.response?.status);
                    setTurmas([]);
                  }
                } else {
                  setTurmas([]);
                }
              }
            }
            
          } else {
            // Para outros usuários (admin, secretaria): mostra todas as turmas
            const endpoint = '/turmas';
            console.log('Tentando endpoint ADMIN/OUTROS:', endpoint);
            
            try {
              response = await api.get(endpoint);
              console.log('✅ Sucesso - Resposta para admin/outros:', response.data);
              setTurmas(response.data || []);
              console.log('✅ Todas as turmas definidas:', response.data || []);
            } catch (adminError: any) {
              console.log('❌ ERRO no endpoint de turmas:', endpoint);
              console.log('Status:', adminError.response?.status);
              console.log('Message:', adminError.response?.data?.message || adminError.message);
              
              // Para admins, não mostrar turmas se o endpoint não existir
              if (adminError.response?.status === 404) {
                console.log('🔄 Endpoint /turmas não encontrado, ocultando seção de turmas');
              }
              setTurmas([]);
            }
          }
          
          console.log('=== FIM DEBUG DASHBOARD TURMAS ===');
          
        } catch (error: any) {
          console.log('=== ERRO GERAL INESPERADO ===');
          console.log('Erro completo:', error);
          console.log('===============================');
          setTurmas([]);
          setTurmasError('Erro inesperado ao carregar turmas');
        } finally {
          setTurmasLoading(false);
        }
      }
      
      // Só executar se o usuário tem ID válido
      if (user && user.id) {
        fetchMinhasTurmas();
      } else {
        console.log('⚠️ Usuário sem ID válido, pulando busca de turmas');
        setTurmas([]);
        setTurmasLoading(false);
      }
    }, [user.id, isAluno, isProfessor, turmasLoading])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.headerTitle}>🏠 Escola Lina Rodrigues</Text>
          <Text style={styles.welcomeText}>Olá, {user.name}!</Text>
          <Text style={styles.roleText}>Perfil: {user.role}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Seção de Turmas */}
        {turmas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📚 {isAluno ? 'Minha Turma' : isProfessor ? 'Minhas Turmas' : 'Turmas da Escola'}
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={turmas}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.classCard}>
                  <View style={styles.classIcon}>
                    <Text style={styles.classIconText}>📖</Text>
                  </View>
                  <Text style={styles.classTitle}>{item.nome}</Text>
                  <Text style={styles.classYear}>Ano: {item.ano}</Text>
                </View>
              )}
              contentContainerStyle={styles.classesContainer}
            />
          </View>
        )}

        {/* Grid de Navegação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Acesso Rápido</Text>
          <View style={styles.grid}>
            {/* Avisos - todos podem ver */}
            <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Avisos")}>
              <Text style={styles.gridIcon}>📢</Text>
              <Text style={styles.gridText}>Avisos</Text>
            </TouchableOpacity>

            {/* Opções apenas para alunos */}
            {isAluno && (
              <>
                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Boletim")}>
                  <Text style={styles.gridIcon}>📊</Text>
                  <Text style={styles.gridText}>Meu Boletim</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("MinhaTurma")}>
                  <Text style={styles.gridIcon}>👥</Text>
                  <Text style={styles.gridText}>Minha Turma</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Calendario")}>
                  <Text style={styles.gridIcon}>📅</Text>
                  <Text style={styles.gridText}>Calendário</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Opções apenas para não-alunos (professores, admins, etc.) */}
            {!isAluno && (
              <>
                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Professores")}>
                  <Text style={styles.gridIcon}>👨‍🏫</Text>
                  <Text style={styles.gridText}>Professores</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Alunos")}>
                  <Text style={styles.gridIcon}>👨‍🎓</Text>
                  <Text style={styles.gridText}>Alunos</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Responsáveis")}>
                  <Text style={styles.gridIcon}>👨‍👩‍👧‍👦</Text>
                  <Text style={styles.gridText}>Responsáveis</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Disciplina")}>
                  <Text style={styles.gridIcon}>📝</Text>
                  <Text style={styles.gridText}>Disciplinas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Turmas")}>
                  <Text style={styles.gridIcon}>👥</Text>
                  <Text style={styles.gridText}>Turmas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gridItem} onPress={() => (navigation as any).navigate("Relatorios")}>
                  <Text style={styles.gridIcon}>📈</Text>
                  <Text style={styles.gridText}>Relatórios</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Botão de Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Sair do Sistema</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
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
  welcomeSection: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    color: '#e0e6ff',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#b8c5ff',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  classesContainer: {
    paddingRight: 20,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  classIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  classIconText: {
    fontSize: 20,
  },
  classTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  classYear: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: (width - 60) / 2,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gridIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  logoutSection: {
    margin: 20,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});