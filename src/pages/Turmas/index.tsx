import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity,
    RefreshControl,
    Alert,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { debugTurmas } from './debug';

type Aluno = {
    id: number;
    nome: string;
}

type Professor = {
    id: number;
    nome?: string;
    professor?: {
        id: number;
        nome: string;
    };
}

type Disciplina = {
    id: number;
    nome: string;
}

type Turma = {
    id: number;
    nome: string;
    ano: number;
    alunos: Aluno[];
    professores: Professor[];
    disciplinas: Disciplina[];
}




function Turmas(){
    console.log('🏫 === COMPONENTE TURMAS RENDERIZADO ===');
    
    const navigation = useNavigation();
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    
    // Estados para edição
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editType, setEditType] = useState<'professores' | 'alunos' | 'disciplinas'>('professores');
    const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Dados disponíveis para seleção
    const [professoresDisponiveis, setProfessoresDisponiveis] = useState<Professor[]>([]);
    const [alunosDisponiveis, setAlunosDisponiveis] = useState<Aluno[]>([]);
    const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<Disciplina[]>([]);
    
    // Estados de seleção
    const [professoresSelecionados, setProfessoresSelecionados] = useState<number[]>([]);
    const [alunosSelecionados, setAlunosSelecionados] = useState<number[]>([]);
    const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);

    const fetchTurmas = async () => {
        try {
            console.log('🔄 === INICIANDO FETCH TURMAS ===');
            console.log('📱 Estado atual das turmas:', turmas.length);
            
            // Tentar primeiro /turma (singular - padrão REST)
            let response;
            try {
                console.log('🔄 Tentando GET /turma...');
                response = await api.get('/turma');
                console.log('✅ Sucesso com /turma:', {
                    status: response.status,
                    dataType: typeof response.data,
                    isArray: Array.isArray(response.data),
                    length: response.data?.length,
                    data: response.data
                });
            } catch (singularError: any) {
                console.log('⚠️ /turma falhou:', singularError.response?.status, singularError.message);
                try {
                    console.log('🔄 Tentando GET /turmas com paginação...');
                    // Primeiro, tenta buscar TODAS as turmas de uma vez
                    response = await api.get('/turmas?page=1&limit=100');
                    console.log('✅ Sucesso com /turmas (limit 100):', {
                        status: response.status,
                        dataType: typeof response.data,
                        isArray: Array.isArray(response.data),
                        length: response.data?.length,
                        data: response.data
                    });
                } catch (pluralError: any) {
                    console.log('⚠️ /turmas com limit falhou:', pluralError.response?.status, pluralError.message);
                    
                    // FALLBACK: Tentar sem parâmetros (paginação padrão)
                    try {
                        console.log('🔄 Fallback: Tentando GET /turmas sem parâmetros...');
                        response = await api.get('/turmas');
                        console.log('✅ Sucesso com /turmas (padrão):', {
                            status: response.status,
                            data: response.data
                        });
                        
                        // Se retornou dados paginados, buscar todas as páginas
                        if (response.data?.data?.pagination) {
                            console.log('📄 Detectada paginação - buscando todas as páginas...');
                            const pagination = response.data.data.pagination;
                            let todasTurmas = response.data.data.turmas || [];
                            
                            // Buscar páginas restantes
                            for (let page = 2; page <= pagination.totalPages; page++) {
                                try {
                                    console.log(`📄 Buscando página ${page}/${pagination.totalPages}...`);
                                    const pageResponse = await api.get(`/turmas?page=${page}`);
                                    const paginaTurmas = pageResponse.data?.data?.turmas || pageResponse.data?.turmas || [];
                                    todasTurmas = [...todasTurmas, ...paginaTurmas];
                                } catch (pageError) {
                                    console.log(`⚠️ Erro ao buscar página ${page}:`, pageError);
                                }
                            }
                            
                            console.log(`✅ Total de turmas coletadas: ${todasTurmas.length}`);
                            
                            // Recriar estrutura da resposta com todas as turmas
                            response.data = {
                                ...response.data,
                                data: {
                                    ...response.data.data,
                                    turmas: todasTurmas,
                                    pagination: {
                                        ...pagination,
                                        currentPage: 1,
                                        itemsPerPage: todasTurmas.length,
                                        totalItems: todasTurmas.length,
                                        totalPages: 1
                                    }
                                }
                            };
                        }
                        
                    } catch (fallbackError: any) {
                        console.log('❌ Todas as tentativas falharam');
                        throw fallbackError;
                    }
                }
            }
            
            console.log('📊 Turmas carregadas:', {
                total: response.data?.length || 0,
                dados: response.data
            });



            // CORREÇÃO: Processar diferentes formatos de resposta
            let turmasParaSetar = [];
            
            if (response.data?.data?.turmas) {
                // Formato: { data: { turmas: [...] } }
                turmasParaSetar = response.data.data.turmas;
                console.log('📝 Usando formato response.data.data.turmas');
            } else if (response.data?.turmas) {
                // Formato: { turmas: [...] }
                turmasParaSetar = response.data.turmas;
                console.log('📝 Usando formato response.data.turmas');
            } else if (Array.isArray(response.data)) {
                // Formato: [...]
                turmasParaSetar = response.data;
                console.log('📝 Usando formato array direto');
            } else {
                turmasParaSetar = [];
                console.log('⚠️ Formato não reconhecido, usando array vazio');
            }
            
            console.log('📝 Definindo turmas no estado:', {
                dadosRecebidos: response.data,
                formatoDetectado: response.data?.data?.turmas ? 'data.data.turmas' : 
                                 response.data?.turmas ? 'data.turmas' : 
                                 Array.isArray(response.data) ? 'array direto' : 'desconhecido',
                quantidadeParaSetar: turmasParaSetar.length,
                turmasParaSetar
            });
            
            // Debug detalhado de cada turma - FOCO NOS PROFESSORES
            if (turmasParaSetar && Array.isArray(turmasParaSetar)) {
                turmasParaSetar.forEach((turma: any, index: any) => {
                    console.log(`🔍 Turma ${index + 1}:`, {
                        id: turma.id,
                        nome: turma.nome,
                        professores: turma.professores?.length || 0,
                        alunos: turma.alunos?.length || 0,
                        disciplinas: turma.disciplinas?.length || 0
                    });
                    
                    // DEBUG ESPECÍFICO DOS PROFESSORES
                    if (turma.professores && turma.professores.length > 0) {
                        console.log(`👨‍🏫 Professores da turma ${turma.nome}:`, turma.professores);
                        turma.professores.forEach((prof: any, profIndex: any) => {
                            console.log(`   Professor ${profIndex + 1}:`, {
                                estruturaCompleta: prof,
                                nome: prof.nome,
                                professorNome: prof.professor?.nome,
                                professorUser: prof.professor?.user,
                                professorUserNome: prof.professor?.user?.nome,
                                todasAsPropriedades: Object.keys(prof),
                                propriedadesProfessor: prof.professor ? Object.keys(prof.professor) : null,
                                propriedadesUser: prof.professor?.user ? Object.keys(prof.professor.user) : null
                            });
                        });
                    } else {
                        console.log(`👨‍🏫 Turma ${turma.nome} não tem professores ou array vazio`);
                    }
                });
            }
            
            setTurmas(turmasParaSetar);
            
            // Log após definir o estado (será executado na próxima renderização)
            setTimeout(() => {
                console.log('✅ Estado das turmas após setTurmas:', turmas.length);
            }, 100);
            
        } catch (error: any) {
            console.error('❌ Erro ao buscar turmas:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // TEMPORÁRIO: Usar dados mock para teste
            console.log('🧪 Usando dados mock para teste...');
            const mockData = debugTurmas.dadosMock;
            console.log('📝 Definindo turmas MOCK no estado:', mockData);
            setTurmas(mockData);
            
            Alert.alert('Aviso', 'Usando dados de teste (verifique a conexão com o backend)');
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTurmas();
        setRefreshing(false);
    };

    const toggleExpandCard = (turmaId: number) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(turmaId)) {
                newSet.delete(turmaId);
            } else {
                newSet.add(turmaId);
            }
            return newSet;
        });
    };
    
    // Recarregar dados sempre que a tela ganha foco
    useFocusEffect(
        useCallback(() => {
            fetchTurmas();
            loadAvailableData();
        }, [])
    );

    // Carregar dados disponíveis para edição
    const loadAvailableData = async () => {
        try {
            const [professoresRes, alunosRes, disciplinasRes] = await Promise.all([
                api.get('/professores'),
                api.get('/alunos'),
                api.get('/disciplinas')
            ]);

            setProfessoresDisponiveis(Array.isArray(professoresRes.data) ? professoresRes.data : []);
            
            const alunosData = alunosRes.data?.alunos || alunosRes.data;
            setAlunosDisponiveis(Array.isArray(alunosData) ? alunosData : []);
            
            setDisciplinasDisponiveis(Array.isArray(disciplinasRes.data) ? disciplinasRes.data : []);
        } catch (error) {
            console.error('Erro ao carregar dados disponíveis:', error);
        }
    };

    // Abrir modal de edição
    const openEditModal = (turma: Turma, type: 'professores' | 'alunos' | 'disciplinas') => {
        setSelectedTurma(turma);
        setEditType(type);
        
        // Debug: Verificar estrutura da turma selecionada
        console.log('🔍 Turma selecionada para edição:', {
            id: turma.id,
            nome: turma.nome,
            type,
            professores: turma.professores,
            alunos: turma.alunos,
            disciplinas: turma.disciplinas
        });

        // Pré-selecionar itens já associados à turma
        if (type === 'professores') {
            const professorIds = turma.professores?.map(p => p.professor?.id || p.id).filter((id): id is number => Boolean(id)) || [];
            console.log('👥 Professor IDs pré-selecionados:', professorIds);
            setProfessoresSelecionados(professorIds);
        } else if (type === 'alunos') {
            const alunoIds = turma.alunos?.map(a => a.id).filter(Boolean) || [];
            console.log('🎓 Aluno IDs pré-selecionados:', alunoIds);
            setAlunosSelecionados(alunoIds);
        } else if (type === 'disciplinas') {
            const disciplinaIds = turma.disciplinas?.map(d => d.id).filter(Boolean) || [];
            console.log('📚 Disciplina IDs pré-selecionados:', disciplinaIds);
            setDisciplinasSelecionadas(disciplinaIds);
        }
        
        setEditModalVisible(true);
    };

    // Salvar alterações
    const handleSaveEdit = async () => {
        if (!selectedTurma) return;

        setLoading(true);
        try {
            let updateData = {};
            
            if (editType === 'professores') {
                updateData = { professorIds: professoresSelecionados };
            } else if (editType === 'alunos') {
                updateData = { alunoIds: alunosSelecionados };
            } else if (editType === 'disciplinas') {
                updateData = { disciplinaIds: disciplinasSelecionadas };
            }

            console.log('🔄 Enviando atualização:', {
                turmaId: selectedTurma.id,
                editType,
                updateData,
                payload: {
                    nome: selectedTurma.nome,
                    ano: selectedTurma.ano,
                    ...updateData
                }
            });

            const response = await api.put(`/turma/${selectedTurma.id}`, {
                nome: selectedTurma.nome,
                ano: selectedTurma.ano,
                ...updateData
            });

            console.log('✅ Resposta da atualização:', response.data);

            setEditModalVisible(false);
            
            // Atualizar a turma específica e recarregar lista
            console.log('🔄 Recarregando dados após edição...');
            
            // Primeiro, tentar buscar a turma específica para ver se foi atualizada
            try {
                const turmaAtualizada = await api.get(`/turma/${selectedTurma.id}`);
                console.log('� Turma específica atualizada:', turmaAtualizada.data);
            } catch (specificError) {
                console.log('⚠️ Erro ao buscar turma específica:', specificError);
            }
            
            // Forçar colapso e expansão do card para atualizar visualmente
            const turmaId = selectedTurma.id;
            setExpandedCards(prev => {
                const newSet = new Set(prev);
                newSet.delete(turmaId);
                return newSet;
            });
            
            // Recarregar lista completa com delay
            setTimeout(async () => {
                await fetchTurmas();
                // Reabrir o card após carregamento
                setTimeout(() => {
                    setExpandedCards(prev => {
                        const newSet = new Set(prev);
                        newSet.add(turmaId);
                        return newSet;
                    });
                }, 300);
            }, 1000);

            Alert.alert('Sucesso', `${editType.charAt(0).toUpperCase() + editType.slice(1)} atualizados com sucesso!`);
        } catch (error: any) {
            console.error('❌ Erro ao atualizar turma:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao atualizar turma');
        } finally {
            setLoading(false);
        }
    };

    // Funções de toggle
    const toggleProfessor = (id: number) => {
        setProfessoresSelecionados(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const toggleAluno = (id: number) => {
        setAlunosSelecionados(prev => 
            prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
        );
    };

    const toggleDisciplina = (id: number) => {
        setDisciplinasSelecionadas(prev => 
            prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
        );
    };


    // Debug do estado no momento da renderização
    console.log('🎨 === RENDERIZAÇÃO TURMAS ===');
    console.log('📊 Estado atual:', {
        quantidadeTurmas: turmas.length,
        turmas: turmas.map(t => ({ id: t.id, nome: t.nome })),
        refreshing
    });

    return(
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎓 Turmas</Text>
                <Text style={styles.headerSubtitle}>
                    {turmas.length} {turmas.length === 1 ? 'turma cadastrada' : 'turmas cadastradas'}
                </Text>
                
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.testButton}
                        onPress={async () => {
                            console.log('🧪 Teste manual da API iniciado...');
                            const resultado = await debugTurmas.testarAPI(api);
                            console.log('🧪 Resultado do teste:', resultado);
                            
                            // Processar o resultado da mesma forma que fetchTurmas
                            if (resultado && resultado.turmas && Array.isArray(resultado.turmas)) {
                                console.log('✅ Carregando dados REAIS da API:', resultado.turmas.length, 'turmas');
                                setTurmas(resultado.turmas);
                                Alert.alert('Sucesso!', `Carregadas ${resultado.turmas.length} turmas reais da API!`);
                            } else {
                                console.log('⚠️ Usando dados mock como fallback');
                                setTurmas(debugTurmas.dadosMock);
                                Alert.alert('Atenção', 'API não retornou dados válidos. Usando dados de exemplo.');
                            }
                        }}
                    >
                        <Feather name="refresh-cw" size={16} color="#fff" />
                        <Text style={styles.testButtonText}>Teste API</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AdicionarTurma' as never)}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={styles.addButtonText}>Nova Turma</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista de Turmas */}
            <FlatList
                data={turmas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    console.log('🏗️ Renderizando item:', { 
                        id: item.id, 
                        nome: item.nome,
                        professores: item.professores?.length || 0,
                        alunos: item.alunos?.length || 0,
                        disciplinas: item.disciplinas?.length || 0,
                        estruturaProfessores: item.professores
                    });
                    const isExpanded = expandedCards.has(item.id);
                    const totalMembros = (item.alunos?.length || 0) + (item.professores?.length || 0);
                    
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardTitleContainer}>
                                    <View style={styles.turmaIcon}>
                                        <Text style={styles.turmaIconText}>{item.ano}°</Text>
                                    </View>
                                    <View style={styles.cardTitleInfo}>
                                        <Text style={styles.cardTitle}>{item.nome}</Text>
                                        <Text style={styles.cardSubtitle}>Ano letivo: {item.ano}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={styles.detailsButton}
                                        onPress={() => (navigation as any).navigate('DetalhesTurma', { turmaId: item.id })}
                                    >
                                        <Feather name="eye" size={18} color="#2196F3" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.expandButton}
                                        onPress={() => toggleExpandCard(item.id)}
                                    >
                                        <Feather 
                                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                                            size={20} 
                                            color="#4CAF50" 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Resumo sempre visível */}
                            <View style={styles.summaryContainer}>
                                <View style={styles.statItem}>
                                    <Feather name="users" size={16} color="#4CAF50" />
                                    <Text style={styles.statText}>{totalMembros} membros</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Feather name="book" size={16} color="#FF9800" />
                                    <Text style={styles.statText}>{item.disciplinas.length} disciplinas</Text>
                                </View>
                            </View>

                            {/* Detalhes expandidos */}
                            {isExpanded && (
                                <View style={styles.detailsContainer}>
                                    {/* Professores */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <Feather name="user-check" size={18} color="#191970" />
                                                <Text style={styles.sectionTitle}>
                                                    Professores ({item.professores.length})
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                style={styles.editButton}
                                                onPress={() => openEditModal(item, 'professores')}
                                            >
                                                <Feather name="edit-2" size={16} color="#4CAF50" />
                                            </TouchableOpacity>
                                        </View>
                                        {item.professores && item.professores.length > 0 ? (
                                            item.professores.map((prof: any, index: any) => {
                                                // Debug do professor individual
                                                console.log(`👨‍🏫 Renderizando professor ${index + 1} do card:`, prof);
                                                
                                                // Acessar o nome do professor corretamente baseado na estrutura da API
                                                const nomeProf = prof.nome || prof.professor?.user?.name || prof.professor?.nome || `Professor ${prof.professorId || index + 1}`;
                                                
                                                return (
                                                    <View key={index} style={styles.listItem}>
                                                        <Text style={styles.listItemText}>
                                                            • {nomeProf}
                                                        </Text>
                                                    </View>
                                                );
                                            })
                                        ) : (
                                            <Text style={styles.emptyText}>Nenhum professor cadastrado</Text>
                                        )}
                                    </View>

                                    {/* Alunos */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <Feather name="users" size={18} color="#191970" />
                                                <Text style={styles.sectionTitle}>
                                                    Alunos ({item.alunos.length})
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                style={styles.editButton}
                                                onPress={() => openEditModal(item, 'alunos')}
                                            >
                                                <Feather name="edit-2" size={16} color="#4CAF50" />
                                            </TouchableOpacity>
                                        </View>
                                        {item.alunos && item.alunos.length > 0 ? (
                                            <>
                                                {item.alunos.slice(0, isExpanded ? item.alunos.length : 3).map((aluno: any, index: any) => (
                                                    <View key={index} style={styles.listItem}>
                                                        <Text style={styles.listItemText}>• {aluno.nome || aluno.aluno?.user?.name || aluno.user?.name || `Aluno ${index + 1}`}</Text>
                                                    </View>
                                                ))}
                                            </>
                                        ) : (
                                            <Text style={styles.emptyText}>Nenhum aluno cadastrado</Text>
                                        )}
                                    </View>

                                    {/* Disciplinas */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionHeaderLeft}>
                                                <Feather name="book" size={18} color="#191970" />
                                                <Text style={styles.sectionTitle}>
                                                    Disciplinas ({item.disciplinas.length})
                                                </Text>
                                            </View>
                                            <TouchableOpacity 
                                                style={styles.editButton}
                                                onPress={() => openEditModal(item, 'disciplinas')}
                                            >
                                                <Feather name="edit-2" size={16} color="#4CAF50" />
                                            </TouchableOpacity>
                                        </View>
                                        {item.disciplinas && item.disciplinas.length > 0 ? (
                                            item.disciplinas.map((disciplina: any, index: any) => (
                                                <View key={index} style={styles.listItem}>
                                                    <Text style={styles.listItemText}>• {disciplina.nome || disciplina.disciplina?.nome || `Disciplina ${index + 1}`}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.emptyText}>Nenhuma disciplina cadastrada</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏫</Text>
                        <Text style={styles.emptyTitle}>Nenhuma turma encontrada</Text>
                        <Text style={styles.emptySubtitle}>
                            As turmas cadastradas aparecerão aqui
                        </Text>
                    </View>
                )}
            />

            {/* Modal de Edição */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Editar {editType === 'professores' ? 'Professores' : 
                                       editType === 'alunos' ? 'Alunos' : 'Disciplinas'}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setEditModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Feather name="x" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            {editType === 'professores' && (
                                <FlatList
                                    data={professoresDisponiveis}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={styles.checkboxItem}
                                            onPress={() => toggleProfessor(item.id)}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                professoresSelecionados.includes(item.id) && styles.checkboxSelected
                                            ]}>
                                                {professoresSelecionados.includes(item.id) && (
                                                    <Feather name="check" size={16} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={styles.checkboxText}>{(item as any).user?.name || item.nome || `Professor ${item.id}`}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}

                            {editType === 'alunos' && (
                                <FlatList
                                    data={alunosDisponiveis}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={styles.checkboxItem}
                                            onPress={() => toggleAluno(item.id)}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                alunosSelecionados.includes(item.id) && styles.checkboxSelected
                                            ]}>
                                                {alunosSelecionados.includes(item.id) && (
                                                    <Feather name="check" size={16} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={styles.checkboxText}>{(item as any).user?.name || item.nome || `Aluno ${item.id}`}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}

                            {editType === 'disciplinas' && (
                                <FlatList
                                    data={disciplinasDisponiveis}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={styles.checkboxItem}
                                            onPress={() => toggleDisciplina(item.id)}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                disciplinasSelecionadas.includes(item.id) && styles.checkboxSelected
                                            ]}>
                                                {disciplinasSelecionadas.includes(item.id) && (
                                                    <Feather name="check" size={16} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={styles.checkboxText}>{item.nome}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#191970',
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
        paddingVertical: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    turmaIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#191970',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    turmaIconText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardTitleInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#191970',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    expandButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f9ff',
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        paddingHorizontal: 18,
        backgroundColor: '#f8f9fa',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginLeft: 8,
    },
    detailsContainer: {
        padding: 18,
        backgroundColor: '#fff',
    },
    detailSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#191970',
        marginLeft: 10,
    },
    listItem: {
        paddingVertical: 4,
        paddingLeft: 20,
    },
    listItemText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    testButton: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    editButton: {
        padding: 8,
        borderRadius: 16,
        backgroundColor: '#e8f5e8',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailsButton: {
        padding: 8,
        borderRadius: 16,
        backgroundColor: '#e3f2fd',
    },
    // Estilos do Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#191970',
    },
    closeButton: {
        padding: 5,
    },
    modalContent: {
        maxHeight: 400,
        marginBottom: 20,
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    checkboxText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

export default Turmas;

