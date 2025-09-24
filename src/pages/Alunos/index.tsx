import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import RoleProtection from '../../components/RoleProtection';

interface Aluno {
    id: number;
    userId: number;
    nome: string;
    dataNascimento?: string;
    turmaId?: number;
    responsavelId?: number;
    situacao: 'RECUPERACAO' | 'APROVADO' | 'REPROVADO';
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    turma?: {
        id: number;
        nome: string;
    };
    responsavel?: {
        id: number;
        nome: string;
    };
}

interface Turma {
    id: number;
    nome: string;
}

interface Responsavel {
    id: number;
    nome: string;
}

export default function Alunos() {
    const navigation = useNavigation();
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
    
    // Form fields
    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [turmaId, setTurmaId] = useState<number | undefined>(undefined);
    const [responsavelId, setResponsavelId] = useState<number | undefined>(undefined);
    const [situacao, setSituacao] = useState<'RECUPERACAO' | 'APROVADO' | 'REPROVADO'>('RECUPERACAO');

    useEffect(() => {
        loadAlunos();
        loadTurmas();
        loadResponsaveis();
    }, []);

    const loadAlunos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/alunos');
            setAlunos(response.data || []);
        } catch (error) {
            console.log('Erro ao carregar alunos:', error);
            Alert.alert('Erro', 'Não foi possível carregar a lista de alunos');
        } finally {
            setLoading(false);
        }
    };

    const loadTurmas = async () => {
        try {
            const response = await api.get('/turmas');
            setTurmas(response.data || []);
        } catch (error) {
            console.log('Erro ao carregar turmas:', error);
        }
    };

    const loadResponsaveis = async () => {
        try {
            const response = await api.get('/responsaveis');
            setResponsaveis(response.data || []);
        } catch (error) {
            console.log('Erro ao carregar responsáveis:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAlunos();
        setRefreshing(false);
    };

    const openModal = (aluno?: Aluno) => {
        if (aluno) {
            setEditingAluno(aluno);
            setNome(aluno.nome);
            setDataNascimento(aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '');
            setTurmaId(aluno.turmaId);
            setResponsavelId(aluno.responsavelId);
            setSituacao(aluno.situacao);
        } else {
            setEditingAluno(null);
            setNome('');
            setDataNascimento('');
            setTurmaId(undefined);
            setResponsavelId(undefined);
            setSituacao('RECUPERACAO');
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingAluno(null);
        setNome('');
        setDataNascimento('');
        setTurmaId(undefined);
        setResponsavelId(undefined);
        setSituacao('RECUPERACAO');
    };

    const handleSubmit = async () => {
        if (!nome.trim()) {
            Alert.alert('Erro', 'Nome é obrigatório');
            return;
        }

        try {
            const alunoData = {
                nome: nome.trim(),
                ...(dataNascimento && { dataNascimento: new Date(dataNascimento).toISOString() }),
                ...(turmaId && { turmaId }),
                ...(responsavelId && { responsavelId }),
                situacao
            };

            if (editingAluno) {
                await api.put(`/aluno/${editingAluno.id}`, alunoData);
                Alert.alert('Sucesso', 'Aluno atualizado com sucesso');
            } else {
                await api.post('/aluno', alunoData);
                Alert.alert('Sucesso', 'Aluno criado com sucesso');
            }

            closeModal();
            loadAlunos();
        } catch (error: any) {
            console.log('Erro ao salvar aluno:', error);
            const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao salvar aluno';
            Alert.alert('Erro', message);
        }
    };

    const handleDelete = (aluno: Aluno) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Deseja realmente excluir o aluno ${aluno.nome}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => deleteAluno(aluno.id)
                }
            ]
        );
    };

    const deleteAluno = async (id: number) => {
        try {
            await api.delete(`/aluno/${id}`);
            Alert.alert('Sucesso', 'Aluno excluído com sucesso');
            loadAlunos();
        } catch (error: any) {
            console.log('Erro ao excluir aluno:', error);
            const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao excluir aluno';
            Alert.alert('Erro', message);
        }
    };

    const getSituacaoColor = (situacao: string) => {
        switch (situacao) {
            case 'APROVADO': return '#4CAF50';
            case 'REPROVADO': return '#F44336';
            case 'RECUPERACAO': return '#FF9800';
            default: return '#757575';
        }
    };

    const getSituacaoText = (situacao: string) => {
        switch (situacao) {
            case 'APROVADO': return 'Aprovado';
            case 'REPROVADO': return 'Reprovado';
            case 'RECUPERACAO': return 'Recuperação';
            default: return situacao;
        }
    };

    const renderAluno = ({ item }: { item: Aluno }) => (
        <View style={styles.alunoCard}>
            <View style={styles.alunoHeader}>
                <View style={styles.alunoInfo}>
                    <Text style={styles.alunoNome}>{item.nome}</Text>
                    <Text style={styles.alunoId}>ID: {item.id}</Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openModal(item)}
                    >
                        <Feather name="edit" size={18} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item)}
                    >
                        <Feather name="trash-2" size={18} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Situação */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Situação:</Text>
                <View style={[styles.situacaoTag, { backgroundColor: getSituacaoColor(item.situacao) }]}>
                    <Text style={styles.situacaoText}>{getSituacaoText(item.situacao)}</Text>
                </View>
            </View>

            {/* Informações acadêmicas */}
            {(item.turma || item.dataNascimento) && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎓 Informações:</Text>
                    <View style={styles.infoContainer}>
                        {item.turma && (
                            <View style={styles.infoItem}>
                                <Feather name="users" size={16} color="#2196F3" />
                                <Text style={styles.infoText}>Turma: {item.turma.nome}</Text>
                            </View>
                        )}
                        {item.dataNascimento && (
                            <View style={styles.infoItem}>
                                <Feather name="calendar" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>
                                    Nascimento: {new Date(item.dataNascimento).toLocaleDateString('pt-BR')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Responsável */}
            {item.responsavel && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Responsável:</Text>
                    <View style={styles.responsavelContainer}>
                        <Feather name="user" size={16} color="#FF9800" />
                        <Text style={styles.responsavelText}>{item.responsavel.nome}</Text>
                    </View>
                </View>
            )}
        </View>
    );

    if (loading && alunos.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Carregando alunos...</Text>
            </View>
        );
    }

    return (
        <RoleProtection allowedRoles={['ADMIN', 'SECRETARIA', 'PROFESSOR']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>👨‍🎓 Alunos</Text>
                    <Text style={styles.subtitle}>
                        {alunos.length} {alunos.length === 1 ? 'aluno' : 'alunos'} cadastrados
                    </Text>
                </View>

                {/* Botão Criar Aluno */}
                <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => openModal()}
                >
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Criar Novo Aluno</Text>
                </TouchableOpacity>

                {/* Lista de Alunos */}
                {alunos.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="users" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
                        <Text style={styles.emptySubtitle}>
                            Os alunos aparecerão aqui após o cadastro
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={alunos}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderAluno}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Modal de Criação/Edição */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Header do Modal */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
                                    </Text>
                                    <TouchableOpacity onPress={closeModal}>
                                        <Feather name="x" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>

                                {/* Formulário */}
                                <View style={styles.form}>
                                    {/* Nome */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nome *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nome do aluno"
                                            value={nome}
                                            onChangeText={setNome}
                                        />
                                    </View>

                                    {/* Data de Nascimento */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Data de Nascimento</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="AAAA-MM-DD"
                                            value={dataNascimento}
                                            onChangeText={setDataNascimento}
                                        />
                                    </View>

                                    {/* Situação */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Situação</Text>
                                        <View style={styles.situacaoButtons}>
                                            {['RECUPERACAO', 'APROVADO', 'REPROVADO'].map((sit) => (
                                                <TouchableOpacity
                                                    key={sit}
                                                    style={[
                                                        styles.situacaoButton,
                                                        situacao === sit && styles.situacaoButtonActive
                                                    ]}
                                                    onPress={() => setSituacao(sit as any)}
                                                >
                                                    <Text style={[
                                                        styles.situacaoButtonText,
                                                        situacao === sit && styles.situacaoButtonTextActive
                                                    ]}>
                                                        {getSituacaoText(sit)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Turma */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Turma (Opcional)</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.optionButtons}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.optionButton,
                                                        !turmaId && styles.optionButtonActive
                                                    ]}
                                                    onPress={() => setTurmaId(undefined)}
                                                >
                                                    <Text style={[
                                                        styles.optionButtonText,
                                                        !turmaId && styles.optionButtonTextActive
                                                    ]}>
                                                        Nenhuma
                                                    </Text>
                                                </TouchableOpacity>
                                                {turmas.map((turma) => (
                                                    <TouchableOpacity
                                                        key={turma.id}
                                                        style={[
                                                            styles.optionButton,
                                                            turmaId === turma.id && styles.optionButtonActive
                                                        ]}
                                                        onPress={() => setTurmaId(turma.id)}
                                                    >
                                                        <Text style={[
                                                            styles.optionButtonText,
                                                            turmaId === turma.id && styles.optionButtonTextActive
                                                        ]}>
                                                            {turma.nome}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>

                                    {/* Responsável */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Responsável (Opcional)</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.optionButtons}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.optionButton,
                                                        !responsavelId && styles.optionButtonActive
                                                    ]}
                                                    onPress={() => setResponsavelId(undefined)}
                                                >
                                                    <Text style={[
                                                        styles.optionButtonText,
                                                        !responsavelId && styles.optionButtonTextActive
                                                    ]}>
                                                        Nenhum
                                                    </Text>
                                                </TouchableOpacity>
                                                {responsaveis.map((resp) => (
                                                    <TouchableOpacity
                                                        key={resp.id}
                                                        style={[
                                                            styles.optionButton,
                                                            responsavelId === resp.id && styles.optionButtonActive
                                                        ]}
                                                        onPress={() => setResponsavelId(resp.id)}
                                                    >
                                                        <Text style={[
                                                            styles.optionButtonText,
                                                            responsavelId === resp.id && styles.optionButtonTextActive
                                                        ]}>
                                                            {resp.nome}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                </View>

                                {/* Botões de Ação */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={closeModal}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSubmit}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {editingAluno ? 'Atualizar' : 'Criar'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
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
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        margin: 20,
        padding: 15,
        borderRadius: 8,
        justifyContent: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    listContainer: {
        padding: 20,
        paddingTop: 0,
    },
    alunoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    alunoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    alunoInfo: {
        flex: 1,
    },
    alunoNome: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    alunoId: {
        fontSize: 14,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#E3F2FD',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#FFEBEE',
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    situacaoTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    situacaoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoContainer: {
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    responsavelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    responsavelText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    situacaoButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    situacaoButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    situacaoButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    situacaoButtonText: {
        fontSize: 14,
        color: '#666',
    },
    situacaoButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    optionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    optionButton: {
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    optionButtonActive: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    optionButtonText: {
        fontSize: 14,
        color: '#666',
    },
    optionButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    saveButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});