import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, RefreshControl, Modal, TouchableOpacity, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import RoleProtection from '../../components/RoleProtection';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  telefone?: string;
};

type Professor = {
  id: number;
  userId: number;
  user: User; // Relacionamento com User
  turmas: { turma: Turma }[]; // vem do relacionamento N:N TurmaProfessor
  disciplinasLecionadas: {
    disciplina: Disciplina;
  }[]; // relacionamento N:N através da tabela ProfessorDisciplina
};

type Turma = {
  id: number;
  nome: string;
  ano: number;
};

type Disciplina = {
  id: number;
  nome: string;
  professoresLecionando?: {
    professor: {
      id: number;
      user?: {
        name: string;
      };
    };
  }[]; // relacionamento N:N através da tabela ProfessorDisciplina
};

export default function Professores() {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [professores, setProfessores] = useState<Professor[]>([]);
  
  // Debug dos insets
  console.log('📱 Safe Area Insets:', insets);
  const [refreshing, setRefreshing] = useState(false);
  
  // Debug: Log sempre que o estado de professores muda
  useEffect(() => {
    console.log('🔄 Estado de professores atualizado:', {
      total: professores.length,
      ids: professores.map(p => p.id),
      hasNullOrUndefined: professores.some(p => !p || !p.id)
    });
  }, [professores]);
  
  // Estados para o modal de disciplinas
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [todasDisciplinas, setTodasDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [modoRemocao, setModoRemocao] = useState(false);

  // Buscar todas as disciplinas disponíveis
  const fetchTodasDisciplinas = async () => {
    try {
      console.log('🔄 Buscando disciplinas da API...');
      const response = await api.get('/disciplinas'); 
      console.log('📚 Disciplinas recebidas:', response.data);
      
      // Validar disciplinas recebidas da API
      if (Array.isArray(response.data)) {
        const disciplinasComIdsInvalidos = response.data.filter(d => !d || !isValidId(d.id));
        if (disciplinasComIdsInvalidos.length > 0) {
          console.warn('⚠️ Disciplinas com IDs inválidos recebidas da API:', disciplinasComIdsInvalidos);
        }
        
        // Filtrar apenas disciplinas com IDs válidos
        const disciplinasValidas = response.data.filter(d => d && isValidId(d.id));
        console.log('✅ Disciplinas válidas:', disciplinasValidas.length, 'de', response.data.length);
        setTodasDisciplinas(disciplinasValidas);
      } else {
        console.warn('⚠️ Resposta da API não é um array:', response.data);
        setTodasDisciplinas([]);
      }
    } catch (error: any) {
      console.log('❌ Erro ao buscar disciplinas:', error);
      console.log('❌ Resposta do erro:', error.response?.data);
      Alert.alert('Erro', 'Não foi possível carregar as disciplinas');
      setTodasDisciplinas([]);
    }
  };

  // Abrir modal para gerenciar disciplinas do professor
  const abrirModalDisciplinas = async (professor: Professor) => {
    console.log('🔓 Abrindo modal para o professor:', professor);
    console.log('📚 Disciplinas lecionadas pelo professor:', professor.disciplinasLecionadas);
    console.log('🔍 PROFESSOR COMPLETO NO ABRIR MODAL:', JSON.stringify(professor, null, 2));
    
    // TESTE: Tentar recarregar dados específicos do professor
    try {
      console.log('🔄 Tentando recarregar dados do professor específico...');
      const professorAtualizado = await api.get(`/professores/${professor.id}`);
      console.log('🆕 Dados atualizados do professor:', JSON.stringify(professorAtualizado.data, null, 2));
      setSelectedProfessor(professorAtualizado.data);
    } catch (error) {
      console.warn('⚠️ Não foi possível recarregar dados específicos, tentando buscar na lista atual...');
      
      // Alternativa: buscar o professor na lista atual (que pode ter dados mais atuais)
      const professorNaLista = professores.find(p => p.id === professor.id);
      if (professorNaLista) {
        console.log('📋 Professor encontrado na lista atual:', JSON.stringify(professorNaLista, null, 2));
        setSelectedProfessor(professorNaLista);
      } else {
        console.warn('⚠️ Professor não encontrado na lista, usando dados originais');
        setSelectedProfessor(professor);
      }
    }
    
    // Obter disciplinas já lecionadas pelo professor com debug aprimorado
    console.log('🔍 DEBUG - disciplinasLecionadas completas:', JSON.stringify(professor.disciplinasLecionadas, null, 2));
    
    // Aguardar disciplinas serem carregadas antes de processar
    if (todasDisciplinas.length === 0) {
      await fetchTodasDisciplinas();
    }
    
    const disciplinasJaLecionadas = professor.disciplinasLecionadas?.map((pd: any) => {
      console.log('🔍 DEBUG - Processando item:', JSON.stringify(pd, null, 2));
      
      // Verificar diferentes possíveis estruturas
      if (pd && pd.disciplina && pd.disciplina.id) {
        console.log('✅ Usando pd.disciplina.id:', pd.disciplina.id);
        return pd.disciplina.id;
      } else if (pd && pd.disciplinaId) {
        console.log('✅ Usando pd.disciplinaId:', pd.disciplinaId);
        return pd.disciplinaId;
      } else if (pd && pd.id) {
        console.log('✅ Usando pd.id:', pd.id);
        return pd.id;
      } else if (pd && pd.disciplina && pd.disciplina.nome) {
        // 🔧 CORREÇÃO: Buscar ID pelo nome da disciplina
        console.log('🔧 Disciplina sem ID, buscando pelo nome:', pd.disciplina.nome);
        const disciplinaEncontrada = todasDisciplinas.find(d => d.nome === pd.disciplina.nome);
        if (disciplinaEncontrada) {
          console.log('✅ ID encontrado pelo nome:', disciplinaEncontrada.id);
          return disciplinaEncontrada.id;
        } else {
          console.warn('❌ Disciplina não encontrada pelo nome:', pd.disciplina.nome);
          return null;
        }
      } else {
        console.warn('⚠️ Estrutura não reconhecida em abrirModal:', pd);
        return null;
      }
    }).filter(id => id !== null && id !== undefined) || [];
    
    console.log('📋 Disciplinas já lecionadas (IDs):', disciplinasJaLecionadas);
    console.log('🔍 DEBUG - Tipos dos IDs lecionados:', disciplinasJaLecionadas.map(id => ({ id, tipo: typeof id, valor: id })));
    
    // Filtrar apenas IDs válidos antes de definir o estado
    const disciplinasValidasIds = disciplinasJaLecionadas.filter(id => {
      const valid = isValidId(id);
      if (!valid) {
        console.warn('⚠️ ID inválido encontrado nas disciplinas lecionadas:', { id, tipo: typeof id, valor: id });
      }
      return valid;
    });
    
    console.log('✅ IDs válidos filtrados:', disciplinasValidasIds);
    setDisciplinasSelecionadas(disciplinasValidasIds);
    
    console.log('🔄 Buscando todas as disciplinas disponíveis...');
    await fetchTodasDisciplinas();
    setModalVisible(true);
  };

  // Função auxiliar para validar ID
  const isValidId = (id: any): id is number => {
    return id !== null && id !== undefined && typeof id === 'number' && !isNaN(id) && id > 0;
  };

  // Toggle seleção de disciplina
  const toggleDisciplina = (disciplinaId: number) => {
    console.log('🔄 Toggle disciplina:', { disciplinaId, tipo: typeof disciplinaId, valor: disciplinaId });
    
    // Validar ID antes de adicionar
    if (!isValidId(disciplinaId)) {
      console.error('❌ ID inválido passado para toggleDisciplina:', disciplinaId);
      Alert.alert('Erro', 'ID da disciplina é inválido.');
      return;
    }
    
    setDisciplinasSelecionadas(prev => {
      const isSelected = prev.includes(disciplinaId);
      const newSelection = isSelected
        ? prev.filter(id => id !== disciplinaId)
        : [...prev, disciplinaId];
      
      console.log('📋 Seleção atualizada:', {
        anterior: prev,
        disciplinaId,
        acao: isSelected ? 'removida' : 'adicionada',
        nova: newSelection
      });
      
      return newSelection;
    });
  };

  // Alternar modo de remoção
  const toggleModoRemocao = () => {
    const novoModo = !modoRemocao;
    setModoRemocao(novoModo);
    
    console.log(`🔄 Alternando para modo: ${novoModo ? 'Remoção' : 'Adição'}`);
    
    // Ajustar seleções baseado no modo
    const disciplinasJaAssociadas = selectedProfessor?.disciplinasLecionadas?.map((pd: any) => {
      // Verificar diferentes possíveis estruturas
      if (pd && pd.disciplina && pd.disciplina.id) {
        return pd.disciplina.id;
      } else if (pd && pd.disciplinaId) {
        return pd.disciplinaId;
      } else if (pd && pd.id) {
        return pd.id;
      } else if (pd && pd.disciplina && pd.disciplina.nome) {
        // 🔧 CORREÇÃO: Buscar ID pelo nome da disciplina
        const disciplinaEncontrada = todasDisciplinas.find(d => d.nome === pd.disciplina.nome);
        return disciplinaEncontrada ? disciplinaEncontrada.id : null;
      } else {
        return null;
      }
    }).filter(id => id !== null && id !== undefined) || [];
    
    if (novoModo) {
      // Entrando no modo remoção: limpar seleções (usuário deve selecionar o que remover)
      setDisciplinasSelecionadas([]);
      console.log('🗑️ Modo remoção ativado - seleções limpas');
    } else {
      // Saindo do modo remoção: voltar para disciplinas já associadas
      setDisciplinasSelecionadas(disciplinasJaAssociadas);
      console.log('➕ Modo adição ativado - disciplinas já associadas selecionadas:', disciplinasJaAssociadas);
    }
  };

  // Função para confirmar remoção
  const confirmarRemocao = () => {
    if (!selectedProfessor) {
      Alert.alert('Erro', 'Professor não selecionado.');
      return;
    }

    console.log('🔍 DEBUG - Professor para remoção:', JSON.stringify(selectedProfessor, null, 2));
    console.log('🔍 DEBUG - disciplinasLecionadas raw:', selectedProfessor?.disciplinasLecionadas);

    // Corrigir o mapeamento para acessar corretamente os IDs
    const disciplinasJaAssociadas = selectedProfessor?.disciplinasLecionadas?.map((pd: any) => {
      console.log('🔍 DEBUG - Item disciplina lecionada:', JSON.stringify(pd, null, 2));
      
      // Verificar diferentes possíveis estruturas
      if (pd && pd.disciplina && pd.disciplina.id) {
        return pd.disciplina.id;
      } else if (pd && pd.disciplinaId) {
        return pd.disciplinaId;
      } else if (pd && pd.id) {
        return pd.id;
      } else if (pd && pd.disciplina && pd.disciplina.nome) {
        // 🔧 CORREÇÃO: Buscar ID pelo nome da disciplina
        console.log('🔧 Buscando ID pelo nome:', pd.disciplina.nome);
        const disciplinaEncontrada = todasDisciplinas.find(d => d.nome === pd.disciplina.nome);
        if (disciplinaEncontrada) {
          console.log('✅ ID encontrado:', disciplinaEncontrada.id);
          return disciplinaEncontrada.id;
        } else {
          console.warn('❌ Disciplina não encontrada:', pd.disciplina.nome);
          return null;
        }
      } else {
        console.warn('⚠️ Estrutura de disciplina não reconhecida:', pd);
        return null;
      }
    }).filter(id => id !== null && id !== undefined && isValidId(id)) || [];

    const disciplinasParaRemover = disciplinasSelecionadas.filter(id => {
      const valid = isValidId(id);
      const isAssociated = disciplinasJaAssociadas.includes(id);
      console.log(`🔍 Disciplina ${id}: válida=${valid}, associada=${isAssociated}`);
      return valid && isAssociated;
    });
    
    console.log('🔍 Validação de remoção:');
    console.log('  📚 Disciplinas já associadas:', disciplinasJaAssociadas);
    console.log('  ☑️ Disciplinas selecionadas:', disciplinasSelecionadas);
    console.log('  🗑️ Disciplinas para remover:', disciplinasParaRemover);
    
    if (disciplinasParaRemover.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma disciplina válida para remover.');
      return;
    }

    // Obter nomes das disciplinas para mostrar na confirmação
    const nomesDisciplinas = todasDisciplinas
      .filter(d => disciplinasParaRemover.includes(d.id))
      .map(d => d.nome)
      .join(', ');

    Alert.alert(
      'Confirmar Remoção',
      `Deseja remover ${disciplinasParaRemover.length} disciplina(s) do professor ${selectedProfessor.user.name}?\n\nDisciplinas: ${nomesDisciplinas}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removerDisciplinas(disciplinasParaRemover)
        }
      ]
    );
  };

  // Remover disciplinas específicas do professor
  const removerDisciplinas = async (disciplinasParaRemover: number[]) => {
    if (!selectedProfessor) {
      Alert.alert('Erro', 'Professor não selecionado.');
      return;
    }

    if (!selectedProfessor.id) {
      Alert.alert('Erro', 'ID do professor é obrigatório.');
      return;
    }

    if (!disciplinasParaRemover || disciplinasParaRemover.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma disciplina para remover.');
      return;
    }

    // Debug: Verificar tipos e valores dos IDs para remoção
    console.log('🔍 DEBUG - Validação de IDs para remoção:');
    console.log('  📋 disciplinasParaRemover:', disciplinasParaRemover);
    console.log('  🔢 Tipos dos IDs:', disciplinasParaRemover.map(id => ({ id, tipo: typeof id, valor: id })));
    
    // Validar se todas as disciplinas têm IDs válidos (devem ser números positivos)
    const disciplinasInvalidas = disciplinasParaRemover.filter(id => {
      const invalid = !isValidId(id);
      if (invalid) {
        console.log('❌ ID inválido encontrado para remoção:', { id, tipo: typeof id, valor: id });
      }
      return invalid;
    });
    
    if (disciplinasInvalidas.length > 0) {
      console.log('❌ IDs inválidos detectados para remoção:', disciplinasInvalidas);
      Alert.alert('Erro', `Algumas disciplinas selecionadas têm IDs inválidos: ${disciplinasInvalidas.join(', ')}`);
      return;
    }

    console.log('🗑️ Iniciando remoção de disciplinas...');
    console.log('📝 Professor:', selectedProfessor.user.name);
    console.log('📚 Disciplinas para remover:', disciplinasParaRemover);

    setLoading(true);
    try {
      // Criar payload compatível com o backend
      const requestData = {
        professorId: selectedProfessor.id.toString(), // Backend espera string
        disciplinaId: disciplinasParaRemover.map(id => id.toString()) // Backend espera array de strings
      };

      console.log('📤 Dados sendo enviados para remoção:', requestData);
      console.log('🔍 Formato esperado pelo backend:');
      console.log('  - professorId:', typeof requestData.professorId, requestData.professorId);
      console.log('  - disciplinaId:', requestData.disciplinaId.map(id => ({ valor: id, tipo: typeof id })));

      // Usar DELETE com dados no corpo da requisição (método HTTP correto para remoção)
      const response = await api.delete('/desassociar-professor-disciplina', {
        data: requestData
      });

      console.log('✅ Disciplinas removidas com sucesso:', response.data);
      Alert.alert('Sucesso', 'Disciplinas removidas com sucesso!');
      
      // Atualizar disciplinas selecionadas removendo as que foram desassociadas
      setDisciplinasSelecionadas(prev => 
        prev.filter(id => !disciplinasParaRemover.includes(id))
      );
      
      await fetchProfessores(); // Atualizar lista de professores
      
      // Fechar o modal e voltar para a tela de professores
      setModalVisible(false);
      setSelectedProfessor(null);
      setDisciplinasSelecionadas([]); // Limpar disciplinas selecionadas
      setModoRemocao(false); // Resetar modo de remoção
    } catch (error: any) {
      console.log('❌ === ERRO DETALHADO AO REMOVER DISCIPLINAS ===');
      console.log('❌ Erro completo:', error);
      console.log('❌ Status do erro:', error.response?.status);
      console.log('❌ Resposta do erro:', error.response?.data);
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de remoção não encontrado. Verifique se a rota existe no backend.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || error.response?.data?.message || 'Dados inválidos';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', `Não foi possível remover as disciplinas.\n\nDetalhes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Salvar associações de disciplinas
  const salvarDisciplinas = async () => {
    if (!selectedProfessor) {
      Alert.alert('Erro', 'Professor não selecionado.');
      return;
    }

    if (!selectedProfessor.id) {
      Alert.alert('Erro', 'ID do professor é obrigatório.');
      return;
    }

    if (!disciplinasSelecionadas || disciplinasSelecionadas.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma disciplina.');
      return;
    }

    // Debug: Verificar tipos e valores dos IDs
    console.log('🔍 DEBUG - Validação de IDs:');
    console.log('  📋 disciplinasSelecionadas:', disciplinasSelecionadas);
    console.log('  🔢 Tipos dos IDs:', disciplinasSelecionadas.map(id => ({ id, tipo: typeof id, valor: id })));
    
    // Validar se todas as disciplinas têm IDs válidos (devem ser números positivos)
    const disciplinasInvalidas = disciplinasSelecionadas.filter(id => {
      const invalid = !isValidId(id);
      if (invalid) {
        console.log('❌ ID inválido encontrado:', { id, tipo: typeof id, valor: id });
      }
      return invalid;
    });
    
    if (disciplinasInvalidas.length > 0) {
      console.log('❌ IDs inválidos detectados:', disciplinasInvalidas);
      Alert.alert('Erro', `Algumas disciplinas selecionadas têm IDs inválidos: ${disciplinasInvalidas.join(', ')}`);
      return;
    }

    console.log('🔄 Iniciando salvamento das disciplinas...');
    console.log('📝 Professor selecionado:', selectedProfessor);
    console.log('📚 Disciplinas selecionadas:', disciplinasSelecionadas);

    setLoading(true);
    try {
      // Usar a rota POST que existe no backend: /associar-professor-disciplina
      const requestData = {
        professorId: selectedProfessor.id.toString(), // Backend espera string
        disciplinaId: disciplinasSelecionadas.map(id => id.toString()) // Backend espera array de strings
      };
      
      console.log('📤 Dados sendo enviados para /associar-professor-disciplina:', requestData);
      console.log('🔍 Formato para associação:');
      console.log('  - professorId:', typeof requestData.professorId, requestData.professorId);
      console.log('  - disciplinaId:', requestData.disciplinaId.map(id => ({ valor: id, tipo: typeof id })));
      
      const response = await api.post('/associar-professor-disciplina', requestData);
      
      console.log('✅ Resposta da API:', response.data);
      console.log('✅ Status da resposta:', response.status);
      
      Alert.alert('Sucesso', 'Disciplinas atualizadas com sucesso!');
      setModalVisible(false);
      setSelectedProfessor(null);
      setDisciplinasSelecionadas([]); // Limpar disciplinas selecionadas
      setModoRemocao(false); // Resetar modo de remoção
      await fetchProfessores(); // Atualizar lista de professores
    } catch (error: any) {
      console.log('❌ === ERRO DETALHADO AO SALVAR DISCIPLINAS ===');
      console.log('❌ Erro completo:', error);
      console.log('❌ URL tentada:', error.config?.url);
      console.log('❌ Método usado:', error.config?.method);
      console.log('❌ Dados enviados:', error.config?.data);
      console.log('❌ Status do erro:', error.response?.status);
      console.log('❌ Resposta do erro:', error.response?.data);
      console.log('❌ Mensagem do erro:', error.message);
      console.log('❌ ================================================');
      
      // Mostrar detalhes do erro para debug
      let errorMessage = 'Erro desconhecido';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique se a rota existe no backend.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || error.response?.data?.message || 'Dados inválidos';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', `Não foi possível salvar as disciplinas.\n\nDetalhes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Buscar professores
  const fetchProfessores = async () => {
    try {
      console.log('🔄 Buscando professores da API...');
      const response = await api.get('/professores');
      console.log('👨‍🏫 Professores recebidos da API direta:', response.data);
      console.log('👨‍🏫 Resposta completa da API:', JSON.stringify(response.data, null, 2));
      
      // Verificar se há dados válidos e únicos
      if (response.data && Array.isArray(response.data)) {
        // Verificar IDs únicos para evitar chaves duplicadas
        const ids = response.data.map((prof: any) => prof.id);
        const idsUnicos = new Set(ids);
        
        if (ids.length !== idsUnicos.size) {
          console.warn('⚠️ ATENÇÃO: Professores com IDs duplicados detectados!');
          console.log('📊 Total de professores:', ids.length);
          console.log('📊 IDs únicos:', idsUnicos.size);
          console.log('🔍 IDs:', ids);
        }
        
        // Log detalhado do primeiro professor para debug
        if (response.data.length > 0) {
          const primeiroProf = response.data[0];
          console.log('🔍 PRIMEIRO PROFESSOR DETALHADO:');
          console.log('  📋 ID:', primeiroProf.id);
          console.log('  👤 User:', primeiroProf.user);
          console.log('  📚 Disciplinas lecionadas:', JSON.stringify(primeiroProf.disciplinasLecionadas, null, 2));
          console.log('  👥 Turmas:', JSON.stringify(primeiroProf.turmas, null, 2));
          
          // Verificar se disciplinasLecionadas existe e tem dados
          if (!primeiroProf.disciplinasLecionadas) {
            console.warn('⚠️ PROBLEMA: disciplinasLecionadas é null/undefined');
          } else if (Array.isArray(primeiroProf.disciplinasLecionadas) && primeiroProf.disciplinasLecionadas.length === 0) {
            console.warn('⚠️ PROBLEMA: disciplinasLecionadas é um array vazio');
          } else if (Array.isArray(primeiroProf.disciplinasLecionadas) && primeiroProf.disciplinasLecionadas.length > 0) {
            console.log('✅ disciplinasLecionadas tem', primeiroProf.disciplinasLecionadas.length, 'itens');
            console.log('✅ Primeiro item:', JSON.stringify(primeiroProf.disciplinasLecionadas[0], null, 2));
          } else {
            console.warn('⚠️ PROBLEMA: disciplinasLecionadas não é um array:', typeof primeiroProf.disciplinasLecionadas);
          }
        }
        
        // Filtrar dados duplicados se existirem
        const professoresUnicos = response.data.filter((prof: any, index: number, array: any[]) => 
          array.findIndex((p: any) => p.id === prof.id) === index
        );
        
        setProfessores(professoresUnicos);
      } else {
        console.warn('⚠️ Dados de professores inválidos:', response.data);
        setProfessores([]);
      }
    } catch (error: any) {
      console.log('❌ Erro ao buscar professores:', error);
      console.log('❌ Resposta do erro:', error.response?.data);
      Alert.alert('Erro', 'Não foi possível carregar os professores');
      setProfessores([]);
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
        keyExtractor={(item, index) => `professor-${item.id}-${index}`}
        renderItem={({ item, index }) => {
          // Validação de segurança
          if (!item || !item.id || !item.user) {
            console.warn(`⚠️ Professor inválido no índice ${index}:`, item);
            return null;
          }
          
          return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.professorIcon}>
                <Text style={styles.professorIconText}>👨‍🏫</Text>
              </View>
              <View style={styles.professorInfo}>
                <Text style={styles.professorName}>{item.user.name}</Text>
                <Text style={styles.professorId}>ID: {item.id}</Text>
                {item.user.telefone && (
                  <Text style={styles.professorTelefone}>📞 {item.user.telefone}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => abrirModalDisciplinas(item)}
              >
                <Feather name="settings" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Disciplinas lecionadas pelo professor */}
            {(() => {
              // Obter disciplinas lecionadas pelo professor
              const disciplinasLecionadas = item.disciplinasLecionadas?.map(pd => pd.disciplina) || [];

              console.log('🔍 Professor:', item.user.name, '(ID:', item.id, ')');
              console.log('📚 Disciplinas lecionadas:', disciplinasLecionadas);

              return disciplinasLecionadas.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    📚 Disciplinas ({disciplinasLecionadas.length}):
                  </Text>
                  <View style={styles.tagContainer}>
                    {disciplinasLecionadas.map((d, index) => (
                      <View key={`disciplina-${item.id}-${d.id}-${index}`} style={styles.tag}>
                        <Text style={styles.tagText}>{d.nome}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* Turmas */}
            {item.turmas && item.turmas.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 Turmas:</Text>
                <View style={styles.tagContainer}>
                  {item.turmas.map((t, index) => (
                    <View key={`turma-${item.id}-${t.turma.id}-${index}`} style={[styles.tag, styles.turmaTag]}>
                      <Text style={styles.tagText}>{t.turma.nome}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Caso não tenha disciplinas ou turmas */}
            {(() => {
              const temDisciplinas = item.disciplinasLecionadas && item.disciplinasLecionadas.length > 0;
              const temTurmas = item.turmas && item.turmas.length > 0;

              return !temDisciplinas && !temTurmas && (
                <View style={styles.emptySection}>
                  <Text style={styles.emptyText}>📋 Nenhuma disciplina ou turma atribuída</Text>
                </View>
              );
            })()}
          </View>
          );
        }}
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
        ListFooterComponent={() => (
          <View style={{ height: Math.max(120, insets.bottom + 80) }} />
        )}
      />

      {/* Modal para gerenciar disciplinas */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {modoRemocao ? 'Remover Disciplinas' : 'Gerenciar Disciplinas'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedProfessor?.user.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modeButton, modoRemocao && styles.modeButtonActive]}
                onPress={toggleModoRemocao}
              >
                <Feather 
                  name={modoRemocao ? 'plus' : 'trash-2'} 
                  size={20} 
                  color={modoRemocao ? '#fff' : '#ff4444'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modeIndicator}>
              <Text style={[styles.modalSectionTitle, modoRemocao && styles.removalModeTitle]}>
                {modoRemocao 
                  ? '🗑️ Selecione disciplinas para remover:' 
                  : '📚 Selecione disciplinas para associar:'}
              </Text>
              {modoRemocao && (
                <Text style={styles.modeDescription}>
                  Apenas disciplinas já associadas podem ser removidas
                </Text>
              )}
            </View>
            
            {(() => {
              // No modo remoção, filtrar para mostrar apenas disciplinas já associadas
              console.log('🔍 DEBUG - Estado do professor selecionado:', {
                professorId: selectedProfessor?.id,
                professorNome: selectedProfessor?.user?.name,
                disciplinasLecionadas: selectedProfessor?.disciplinasLecionadas,
                quantidadeDisciplinas: selectedProfessor?.disciplinasLecionadas?.length || 0
              });
              
              console.log('🔍 DEBUG - Professor selecionado COMPLETO:', JSON.stringify(selectedProfessor, null, 2));

              const disciplinasJaAssociadas = selectedProfessor?.disciplinasLecionadas?.map((pd: any) => {
                console.log('📝 Processando disciplina lecionada:', JSON.stringify(pd, null, 2));
                
                // Verificar diferentes possíveis estruturas
                if (pd && pd.disciplina && pd.disciplina.id) {
                  console.log('📝 Usando pd.disciplina.id:', pd.disciplina.id);
                  return pd.disciplina.id;
                } else if (pd && pd.disciplinaId) {
                  console.log('📝 Usando pd.disciplinaId:', pd.disciplinaId);
                  return pd.disciplinaId;
                } else if (pd && pd.id) {
                  console.log('📝 Usando pd.id:', pd.id);
                  return pd.id;
                } else if (pd && pd.disciplina && pd.disciplina.nome) {
                  // 🔧 CORREÇÃO: Buscar ID pelo nome da disciplina
                  console.log('🔧 Disciplina sem ID, buscando pelo nome:', pd.disciplina.nome);
                  const disciplinaEncontrada = todasDisciplinas.find(d => d.nome === pd.disciplina.nome);
                  if (disciplinaEncontrada) {
                    console.log('✅ ID encontrado pelo nome:', disciplinaEncontrada.id);
                    return disciplinaEncontrada.id;
                  } else {
                    console.warn('❌ Disciplina não encontrada pelo nome:', pd.disciplina.nome);
                    return null;
                  }
                } else {
                  console.warn('⚠️ Estrutura não reconhecida no modal:', pd);
                  return null;
                }
              }).filter(id => id !== null && id !== undefined) || [];
              
              console.log('🔍 Modo atual:', modoRemocao ? 'Remoção' : 'Adição');
              console.log('📚 Todas as disciplinas disponíveis:', todasDisciplinas.length);
              console.log('🔗 Disciplinas já associadas (IDs):', disciplinasJaAssociadas);
              console.log('� Tipos dos IDs associados:', disciplinasJaAssociadas.map(id => ({ id, tipo: typeof id })));

              const disciplinasParaExibir = modoRemocao 
                ? todasDisciplinas.filter(disciplina => {
                    const incluir = disciplinasJaAssociadas.includes(disciplina.id);
                    console.log(`🧮 Disciplina ${disciplina.nome} (ID: ${disciplina.id}, tipo: ${typeof disciplina.id}): ${incluir ? 'INCLUIR' : 'excluir'}`);
                    console.log(`   🔍 Comparando com associadas:`, disciplinasJaAssociadas.map(id => `${id}(${typeof id})`));
                    
                    // Tentar comparação flexível para debug
                    const incluirFlexivel = disciplinasJaAssociadas.some(id => 
                      id == disciplina.id || // comparação flexível
                      String(id) === String(disciplina.id) // comparação como string
                    );
                    
                    if (incluir !== incluirFlexivel) {
                      console.warn(`⚠️ Diferença de comparação: rígida=${incluir}, flexível=${incluirFlexivel}`);
                    }
                    
                    return incluir;
                  })
                : todasDisciplinas.filter(disciplina => !disciplinasJaAssociadas.includes(disciplina.id));

              console.log('�📋 Disciplinas para exibir:', disciplinasParaExibir.map(d => ({ id: d.id, nome: d.nome })));

              if (modoRemocao && disciplinasParaExibir.length === 0) {
                return (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptyText}>
                      📋 Este professor não possui disciplinas associadas para remover.
                    </Text>
                    <Text style={styles.emptyText}>
                      Debug: {disciplinasJaAssociadas.length} disciplinas associadas encontradas
                    </Text>
                  </View>
                );
              }

              return disciplinasParaExibir.map((disciplina, index) => {
                // Verificar se outros professores também lecionam esta disciplina
                const outrosProfessores = disciplina.professoresLecionando?.filter(
                  pl => pl.professor.id !== selectedProfessor?.id
                ) || [];
                const temOutrosProfessores = outrosProfessores.length > 0;
                const isSelected = disciplinasSelecionadas.includes(disciplina.id);
                
                // Verificar se a disciplina já está associada ao professor
                const jaAssociada = disciplinasJaAssociadas.includes(disciplina.id);
                
                // No modo normal, desabilitar disciplinas já associadas
                const isDisabled = !modoRemocao && jaAssociada;
              
                return (
                  <TouchableOpacity
                    key={`modal-disciplina-${modoRemocao ? 'remove' : 'add'}-${disciplina.id}-${index}`}
                    style={[
                      styles.disciplinaItem,
                      temOutrosProfessores && styles.disciplinaComOutrosProfessores,
                      isDisabled && styles.disciplinaDisabled,
                      modoRemocao && styles.disciplinaRemovalMode
                    ]}
                    onPress={() => {
                      console.log('🖱️ Clique na disciplina:', { 
                        disciplina: disciplina.nome, 
                        id: disciplina.id, 
                        tipo: typeof disciplina.id, 
                        isDisabled 
                      });
                      if (!isDisabled) {
                        toggleDisciplina(disciplina.id);
                      }
                    }}
                    disabled={isDisabled}
                  >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && (
                        <Feather name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.disciplinaNome,
                        isDisabled && styles.disciplinaNomeDisabled
                      ]}>
                        {disciplina.nome}
                        {jaAssociada && !modoRemocao && ' ✓'}
                      </Text>
                      {temOutrosProfessores && (
                        <Text style={styles.outrosProfessores}>
                          Também lecionada por: {outrosProfessores.map(op => op.professor.user?.name || 'Professor').join(', ')}
                        </Text>
                      )}
                      {jaAssociada && !modoRemocao && (
                        <Text style={styles.jaAssociadaText}>
                          Já associada a este professor
                        </Text>
                      )}
                      {modoRemocao && jaAssociada && (
                        <Text style={styles.removalModeText}>
                          Clique para remover esta disciplina
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setModalVisible(false);
                setModoRemocao(false);
                setSelectedProfessor(null);
                setDisciplinasSelecionadas([]); // Limpar disciplinas selecionadas
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            {modoRemocao ? (
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButton]}
                onPress={confirmarRemocao}
                disabled={loading}
              >
                <Text style={styles.removeButtonText}>
                  {loading ? 'Removendo...' : 'Remover Selecionadas'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={salvarDisciplinas}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 20, // Padding base mínimo
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
  professorTelefone: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 2,
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
  // Estilos para o botão de gerenciar
  manageButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  // Estilos do modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#191970',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  disciplinaItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  disciplinaAtribuida: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disciplinaComOutrosProfessores: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0', // Roxo para indicar compartilhamento
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  disciplinaNome: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  disciplinaNomeDisabled: {
    color: '#999',
  },
  professorAtribuido: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  outrosProfessores: {
    fontSize: 12,
    color: '#9C27B0',
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Novos estilos para funcionalidade de remoção
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  modeButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  modeIndicator: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  removalModeTitle: {
    color: '#ff4444',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  disciplinaDisabled: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  disciplinaRemovalMode: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  jaAssociadaText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  removalModeText: {
    fontSize: 12,
    color: '#ff4444',
    fontStyle: 'italic',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
