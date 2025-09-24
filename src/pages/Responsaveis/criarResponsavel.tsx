import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function CriarResponsavel() {
    const { user } = useContext(AuthContext);
    const navigation = useNavigation();
    
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefone, setTelefone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        if (!nome.trim()) {
            Alert.alert('Erro', 'Por favor, digite o nome');
            return false;
        }
        
        if (!email.includes('@')) {
            Alert.alert('Erro', 'Por favor, digite um e-mail válido');
            return false;
        }
        
        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return false;
        }
        
        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return false;
        }

        if (!telefone.trim()) {
            Alert.alert('Erro', 'Por favor, digite o telefone');
            return false;
        }

        return true;
    };

    const handleCreateResponsavel = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            console.log('=== CRIANDO RESPONSÁVEL ===');
            
            // Primeiro criar o usuário
            const userResponse = await api.post('/users', {
                name: nome,
                email,
                password,
                role: 'RESPONSAVEL'
            });

            console.log('✅ Usuário criado:', userResponse.data);

            // Extrair o userId
            let userId = userResponse.data?.id || userResponse.data?.user?.id;
            
            if (Array.isArray(userResponse.data) && userResponse.data.length > 0) {
                userId = userResponse.data[0].id;
            }

            if (!userId) {
                console.log('❌ ID não encontrado, tentando buscar por email...');
                
                const searchResponse = await api.get(`/users?email=${email}`);
                if (searchResponse.data && searchResponse.data.id) {
                    userId = searchResponse.data.id;
                } else if (Array.isArray(searchResponse.data) && searchResponse.data.length > 0) {
                    userId = searchResponse.data[0].id;
                }
            }

            const userIdNumber = parseInt(String(userId));
            if (isNaN(userIdNumber) || userIdNumber <= 0) {
                throw new Error(`ID do usuário inválido: ${userId}`);
            }

            console.log('✅ UserId validado:', userIdNumber);

            // Criar o perfil de responsável
            const responsavelData = {
                userId: userIdNumber,
                nome,
                telefone,
                email
            };

            console.log('📤 Criando responsável:', responsavelData);
            
            await api.post('/responsavel', responsavelData);
            
            console.log('✅ Responsável criado com sucesso!');

            Alert.alert(
                'Sucesso! ✅',
                'Responsável cadastrado com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Limpar formulário
                            setNome('');
                            setEmail('');
                            setPassword('');
                            setConfirmPassword('');
                            setTelefone('');
                            navigation.goBack();
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.log('=== ERRO DETALHADO ===');
            console.log('Mensagem:', error.message);
            console.log('Status:', error.response?.status);
            console.log('Data:', error.response?.data);
            console.log('======================');

            let errorMessage = 'Erro ao criar responsável. Tente novamente.';

            if (error.response?.status === 409) {
                errorMessage = 'Este email já está cadastrado. Use outro email.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Dados inválidos. Verifique as informações.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message && error.message.includes('Network Error')) {
                errorMessage = 'Erro de conexão. Verifique sua internet.';
            }

            Alert.alert('Erro no Cadastro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Criar Responsável</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>👨‍👩‍👧‍👦 Dados do Responsável</Text>
                    <Text style={styles.formSubtitle}>Preencha as informações abaixo</Text>
                    
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Feather name="user" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder='Nome completo'
                                placeholderTextColor='#999'
                                style={styles.input}
                                value={nome}
                                onChangeText={setNome}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder='E-mail'
                                placeholderTextColor='#999'
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Feather name="phone" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder='Telefone'
                                placeholderTextColor='#999'
                                style={styles.input}
                                value={telefone}
                                onChangeText={setTelefone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder='Senha (mín. 6 caracteres)'
                                placeholderTextColor='#999'
                                secureTextEntry={!showPassword}
                                style={[styles.input, styles.passwordInput]}
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Feather 
                                    name={showPassword ? "eye-off" : "eye"} 
                                    size={20} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder='Confirmar senha'
                                placeholderTextColor='#999'
                                secureTextEntry={!showConfirmPassword}
                                style={[styles.input, styles.passwordInput]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity 
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                            >
                                <Feather 
                                    name={showConfirmPassword ? "eye-off" : "eye"} 
                                    size={20} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Botão de Criar */}
                    <TouchableOpacity 
                        style={[styles.createButton, loading && styles.buttonDisabled]} 
                        onPress={handleCreateResponsavel}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size={24} color='#fff'/>
                        ) : (
                            <>
                                <Feather name="user-plus" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.createButtonText}>Criar Responsável</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Info adicional */}
                    <View style={styles.infoContainer}>
                        <Feather name="info" size={16} color="#4CAF50" />
                        <Text style={styles.infoText}>
                            O responsável poderá fazer login com o email e senha criados e acompanhar as informações dos alunos.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#191970',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    formContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 30,
        borderRadius: 20,
        padding: 25,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#191970',
        textAlign: 'center',
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    passwordInput: {
        paddingRight: 15,
    },
    eyeIcon: {
        padding: 5,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        height: 55,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    buttonDisabled: {
        backgroundColor: '#999',
        elevation: 0,
    },
    buttonIcon: {
        marginRight: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e8',
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
        lineHeight: 20,
    },
});