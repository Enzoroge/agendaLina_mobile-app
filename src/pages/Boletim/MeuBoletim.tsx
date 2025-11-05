import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { boletimService } from '../../services/boletimService';
import { AuthContext } from '../../contexts/AuthContext';

type BoletimAluno = {
  id: number;
  turma: {
    id: number;
    nome: string;
  };
  boletimDisciplinas?: Array<{
    disciplina: {
      nome: string;
    };
    mediaBimestre1: number | null;
    mediaBimestre2: number | null;
    mediaBimestre3: number | null;
    mediaBimestre4: number | null;
    mediaFinal: number | null;
  }>;
};

export default function MeuBoletim() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  
  const [boletins, setBoletins] = useState<BoletimAluno[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('🏁 MeuBoletim - Tela inicializada');
  console.log('👤 MeuBoletim - Usuário:', user?.id, user?.role);

  // Carregar boletins do aluno logado
  const carregarMeusBoletins = async () => {
    try {
      setLoading(true);
      const userIdNumber = Number(user?.id);
      console.log('👤 Usuário logado - userId:', userIdNumber);
      
      // 🎯 NOVA ESTRATÉGIA: Buscar todos os boletins e encontrar pelo userId correto
      console.log('🔍 Buscando todos os boletins para identificar o aluno...');

      const response = await boletimService.list({ limit: 100 });

      console.log('📋 Resposta completa do backend:', response);
      console.log('📊 Total de boletins retornados:', response?.boletins?.length || 0);

      if (response?.boletins && response.boletins.length > 0) {
        // � ENCONTRAR MEU ALUNO ID: Buscar boletim onde aluno.userId === userIdNumber
        console.log('🔍 Procurando aluno com userId:', userIdNumber);
        
        let meuAlunoId = null;
        
        // Procurar o alunoId correspondente ao userId
        for (const boletim of response.boletins) {
          const alunoUserId = boletim.aluno?.user?.id;
          console.log('🔍 Boletim', boletim.id, '- Aluno userId:', alunoUserId, 'vs Logado userId:', userIdNumber);
          
          if (alunoUserId === userIdNumber) {
            meuAlunoId = boletim.aluno?.id;
            console.log('✅ ENCONTRADO! AlunoId:', meuAlunoId, 'para userId:', userIdNumber);
            break;
          }
        }
        
        if (meuAlunoId) {
          // 🔒 FILTRO DE SEGURANÇA: Pegar apenas boletins do meu alunoId
          const meusBoletins = response.boletins.filter((boletim: any) => {
            const boletimAlunoId = boletim.aluno?.id;
            console.log('� Verificando boletim:', boletim.id, 'AlunoId:', boletimAlunoId, 'vs Meu AlunoId:', meuAlunoId);
            return boletimAlunoId === meuAlunoId;
          });
          
          console.log('✅ Boletins válidos encontrados:', meusBoletins.length);
          console.log('📝 IDs dos boletins:', meusBoletins.map(b => b.id));
          setBoletins(meusBoletins as any);
        } else {
          console.log('ℹ️ Nenhum boletim encontrado para o usuário logado (userId:', userIdNumber, ')');
          setBoletins([]);
        }
      } else {
        console.log('❌ Nenhum boletim encontrado no sistema');
        setBoletins([]);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar boletins do aluno:', error);
      
      Alert.alert('Erro', 'Não foi possível carregar seus boletins.');
      setBoletins([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular situação do aluno com base na média final
  const calcularSituacao = (mediaFinal: number | null): { texto: string; cor: string } => {
    if (mediaFinal === null || mediaFinal === undefined) {
      return { texto: 'Não Avaliado', cor: '#6c757d' };
    }
    
    if (mediaFinal >= 7) {
      return { texto: 'Aprovado', cor: '#28a745' };
    } else if (mediaFinal >= 5) {
      return { texto: 'Recuperação', cor: '#ffc107' };
    } else {
      return { texto: 'Reprovado', cor: '#dc3545' };
    }
  };

  // Formatar nota para exibição
  const formatarNota = (nota: number | null): string => {
    if (nota === null || nota === undefined) {
      return '-';
    }
    return nota.toFixed(1);
  };

  // Navegar para detalhes de um boletim específico
  const verDetalhesBoletim = (boletim: BoletimAluno) => {
    (navigation as any).navigate('BoletimDetalhe', { 
      id: boletim.id 
    });
  };

  useEffect(() => {
    carregarMeusBoletins();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#191970" />
        <Text style={styles.loadingText}>Carregando seus boletins...</Text>
      </View>
    );
  }

  if (boletins.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>�</Text>
        <Text style={styles.emptyTitle}>Boletim Não Disponível</Text>
        <Text style={styles.emptyText}>
          Seus boletins ainda não foram lançados pelos professores.{'\n\n'}
          📞 Entre em contato com a coordenação para mais informações.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={carregarMeusBoletins}
        >
          <Text style={styles.retryButtonText}>🔄 Verificar Novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>⬅️ Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Boletins</Text>
        <Text style={styles.headerSubtitle}>
          {(user as any)?.nome || 'Aluno'}
        </Text>
        <Text style={styles.headerInfo}>
          {boletins.length} boletim{boletins.length !== 1 ? 's' : ''} encontrado{boletins.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {boletins.map((boletim) => (
          <View key={boletim.id} style={styles.boletimCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.turmaNome}>{boletim.turma.nome}</Text>
              <TouchableOpacity
                style={styles.verDetalhesButton}
                onPress={() => verDetalhesBoletim(boletim)}
              >
                <Text style={styles.verDetalhesText}>Ver Detalhes →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.disciplinasContainer}>
              {boletim.boletimDisciplinas && boletim.boletimDisciplinas.length > 0 ? (
                boletim.boletimDisciplinas.map((bd, index) => {
                  const situacao = calcularSituacao(bd.mediaFinal);
                  
                  return (
                    <View key={index} style={styles.disciplinaItem}>
                      <View style={styles.disciplinaHeader}>
                        <Text style={styles.disciplinaNome}>
                          {bd.disciplina.nome}
                        </Text>
                        <View style={[styles.situacaoBadge, { backgroundColor: situacao.cor }]}>
                          <Text style={styles.situacaoTexto}>{situacao.texto}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.notasContainer}>
                        <View style={styles.notaItem}>
                          <Text style={styles.notaLabel}>1º Bim</Text>
                          <Text style={styles.notaValor}>{formatarNota(bd.mediaBimestre1)}</Text>
                        </View>
                        <View style={styles.notaItem}>
                          <Text style={styles.notaLabel}>2º Bim</Text>
                          <Text style={styles.notaValor}>{formatarNota(bd.mediaBimestre2)}</Text>
                        </View>
                        <View style={styles.notaItem}>
                          <Text style={styles.notaLabel}>3º Bim</Text>
                          <Text style={styles.notaValor}>{formatarNota(bd.mediaBimestre3)}</Text>
                        </View>
                        <View style={styles.notaItem}>
                          <Text style={styles.notaLabel}>4º Bim</Text>
                          <Text style={styles.notaValor}>{formatarNota(bd.mediaBimestre4)}</Text>
                        </View>
                        <View style={[styles.notaItem, styles.mediaFinal]}>
                          <Text style={styles.notaLabel}>Média</Text>
                          <Text style={[styles.notaValor, { fontWeight: 'bold' }]}>
                            {formatarNota(bd.mediaFinal)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.semDisciplinas}>
                  Nenhuma disciplina encontrada neste boletim
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>⬅️ Voltar ao Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  header: {
    backgroundColor: '#191970',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  headerInfo: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  boletimCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  turmaNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  verDetalhesButton: {
    backgroundColor: '#191970',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verDetalhesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  disciplinasContainer: {
    gap: 12,
  },
  disciplinaItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  disciplinaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  disciplinaNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  situacaoBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  situacaoTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notaItem: {
    alignItems: 'center',
    flex: 1,
  },
  mediaFinal: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingVertical: 8,
  },
  notaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notaValor: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  semDisciplinas: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  retryButton: {
    backgroundColor: '#191970',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});