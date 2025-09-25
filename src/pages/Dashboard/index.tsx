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

export default function Dashboard() {
  const { signOut, user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const isAluno = user.role === 'ALUNO';
  const isProfessor = user.role === 'PROFESSOR';
  
  useFocusEffect(
    React.useCallback(() => {
      async function fetchMinhasTurmas() {
        try {
          let response;
          
          if (isAluno) {
            // Para aluno: busca apenas a turma em que está matriculado
            response = await api.get(`/alunos/${user.id}`);
            if (response.data.turma) {
              setTurmas([response.data.turma]);
            } else {
              setTurmas([]);
            }
          } else if (isProfessor) {
            // Para professor: busca as turmas vinculadas a ele
            response = await api.get(`/professores/${user.id}`);
            if (response.data.turmas && response.data.turmas.length > 0) {
              // A API retorna turmas no formato { turma: {...} }
              const turmasVinculadas = response.data.turmas.map((t: any) => t.turma);
              setTurmas(turmasVinculadas);
            } else {
              setTurmas([]);
            }
          } else {
            // Para outros usuários (admin, secretaria): mostra todas as turmas
            response = await api.get("/turmas");
            setTurmas(response.data || []);
          }
        } catch (error) {
          console.log("Erro ao listar turmas:", error);
          setTurmas([]);
        }
      }
      fetchMinhasTurmas();
    }, [user.id, isAluno, isProfessor])
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