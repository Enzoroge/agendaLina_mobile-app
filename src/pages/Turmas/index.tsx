import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity,
    RefreshControl,
    Alert,
    ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';

type Aluno = {
    id: number;
    nome: string;
}

type Professor = {
    id: number;
    nome?: string;
    professor?: {
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




export default function Turmas(){
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const fetchTurmas = async () => {
        try {
            const response = await api.get('/turmas');
            setTurmas(response.data);
        } catch (error) {
            console.log('Erro ao buscar turmas:', error);
            Alert.alert('Erro', 'Não foi possível carregar as turmas');
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
    
    useEffect(() => {
        fetchTurmas();
    }, [])


    return(
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎓 Turmas</Text>
                <Text style={styles.headerSubtitle}>
                    {turmas.length} {turmas.length === 1 ? 'turma cadastrada' : 'turmas cadastradas'}
                </Text>
            </View>

            {/* Lista de Turmas */}
            <FlatList
                data={turmas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const isExpanded = expandedCards.has(item.id);
                    const totalMembros = item.alunos.length + item.professores.length;
                    
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
                                            <Feather name="user-check" size={18} color="#191970" />
                                            <Text style={styles.sectionTitle}>
                                                Professores ({item.professores.length})
                                            </Text>
                                        </View>
                                        {item.professores.length > 0 ? (
                                            item.professores.map((prof, index) => (
                                                <View key={index} style={styles.listItem}>
                                                    <Text style={styles.listItemText}>
                                                        • {prof.nome || prof.professor?.nome || 'Nome não encontrado'}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.emptyText}>Nenhum professor cadastrado</Text>
                                        )}
                                    </View>

                                    {/* Alunos */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.sectionHeader}>
                                            <Feather name="users" size={18} color="#191970" />
                                            <Text style={styles.sectionTitle}>
                                                Alunos ({item.alunos.length})
                                            </Text>
                                        </View>
                                        {item.alunos.length > 0 ? (
                                            <>
                                                {item.alunos.slice(0, isExpanded ? item.alunos.length : 3).map((aluno, index) => (
                                                    <View key={index} style={styles.listItem}>
                                                        <Text style={styles.listItemText}>• {aluno.nome}</Text>
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
                                            <Feather name="book" size={18} color="#191970" />
                                            <Text style={styles.sectionTitle}>
                                                Disciplinas ({item.disciplinas.length})
                                            </Text>
                                        </View>
                                        {item.disciplinas.length > 0 ? (
                                            item.disciplinas.map((disciplina, index) => (
                                                <View key={index} style={styles.listItem}>
                                                    <Text style={styles.listItemText}>• {disciplina.nome}</Text>
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
})

