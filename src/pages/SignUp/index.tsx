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

type UserType = 'professor' | 'aluno' | 'responsavel' | null;

export default function SignUp() {
    const { signUp, loadingAuth } = useContext(AuthContext);
    const navigation = useNavigation();
    
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userType, setUserType] = useState<UserType>(null);
    
    // Campos específicos para Professor
    const [disciplina, setDisciplina] = useState('');
    const [formacao, setFormacao] = useState('');
    
    // Campos específicos para Aluno
    const [idade, setIdade] = useState('');
    const [turma, setTurma] = useState('');

    // Campos específicos para Responsável
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');

    const validateForm = () => {
        if (!nome.trim()) {
            Alert.alert('Erro', 'Por favor, digite seu nome');
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
        
        if (!userType) {
            Alert.alert('Erro', 'Selecione se você é Professor, Aluno ou Responsável');
            return false;
        }

        // Validações específicas por tipo
        if (userType === 'professor') {
            if (!disciplina.trim()) {
                Alert.alert('Erro', 'Por favor, digite sua disciplina');
                return false;
            }
            if (!formacao.trim()) {
                Alert.alert('Erro', 'Por favor, digite sua formação');
                return false;
            }
        }

        if (userType === 'aluno') {
            if (!idade.trim()) {
                Alert.alert('Erro', 'Por favor, digite sua idade');
                return false;
            }
        }

        if (userType === 'responsavel') {
            if (!telefone.trim()) {
                Alert.alert('Erro', 'Por favor, digite seu telefone');
                return false;
            }
        }

        return true;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        try {
            await signUp({
                nome,
                email,
                password,
                tipo: userType!,
                disciplina: userType === 'professor' ? disciplina : undefined,
                formacao: userType === 'professor' ? formacao : undefined,
                idade: userType === 'aluno' ? parseInt(idade) : undefined,
                turma: userType === 'aluno' ? turma || undefined : undefined,
                telefone: userType === 'responsavel' ? telefone : undefined,
                endereco: userType === 'responsavel' ? endereco || undefined : undefined
            });

            const userTypeText = userType === 'professor' ? 'de Professor' : 
                               userType === 'aluno' ? 'de Aluno' : 'de Responsável';
            
            Alert.alert(
                'Sucesso!',
                `Conta ${userTypeText} criada com sucesso!`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );

        } catch (error: any) {
            console.log('Erro ao cadastrar:', error);
            console.log('Response data:', error.response?.data);
            console.log('Status code:', error.response?.status);
            
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            
            // Mensagens específicas baseadas no tipo de erro
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status === 409) {
                errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Dados inválidos. Verifique as informações e tente novamente.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            Alert.alert('Erro no Cadastro', errorMessage);
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
                    <Text style={styles.headerTitle}>Criar Conta</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* User Type Selection */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Você é:</Text>
                    <View style={styles.userTypeContainer}>
                        <TouchableOpacity 
                            style={[
                                styles.userTypeButton,
                                userType === 'professor' && styles.userTypeButtonActive
                            ]}
                            onPress={() => setUserType('professor')}
                        >
                            <Feather 
                                name="user-check" 
                                size={24} 
                                color={userType === 'professor' ? '#fff' : '#191970'} 
                            />
                            <Text style={[
                                styles.userTypeText,
                                userType === 'professor' && styles.userTypeTextActive
                            ]}>
                                Professor
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.userTypeButton,
                                userType === 'aluno' && styles.userTypeButtonActive
                            ]}
                            onPress={() => setUserType('aluno')}
                        >
                            <Feather 
                                name="user" 
                                size={24} 
                                color={userType === 'aluno' ? '#fff' : '#191970'} 
                            />
                            <Text style={[
                                styles.userTypeText,
                                userType === 'aluno' && styles.userTypeTextActive
                            ]}>
                                Aluno
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.userTypeButton,
                                userType === 'responsavel' && styles.userTypeButtonActive
                            ]}
                            onPress={() => setUserType('responsavel')}
                        >
                            <Feather 
                                name="users" 
                                size={24} 
                                color={userType === 'responsavel' ? '#fff' : '#191970'} 
                            />
                            <Text style={[
                                styles.userTypeText,
                                userType === 'responsavel' && styles.userTypeTextActive
                            ]}>
                                Responsável
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    {/* Dados Básicos */}
                    <Text style={styles.formSectionTitle}>Dados Básicos</Text>
                    
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

                    {/* Campos Específicos por Tipo */}
                    {userType && (
                        <>
                            <Text style={styles.formSectionTitle}>
                                Dados {userType === 'professor' ? 'do Professor' : 
                                      userType === 'aluno' ? 'do Aluno' : 'do Responsável'}
                            </Text>

                            {userType === 'professor' && (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.inputContainer}>
                                            <Feather name="book" size={20} color="#666" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder='Disciplina principal'
                                                placeholderTextColor='#999'
                                                style={styles.input}
                                                value={disciplina}
                                                onChangeText={setDisciplina}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <View style={styles.inputContainer}>
                                            <Feather name="award" size={20} color="#666" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder='Formação acadêmica'
                                                placeholderTextColor='#999'
                                                style={styles.input}
                                                value={formacao}
                                                onChangeText={setFormacao}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                    </View>
                                </>
                            )}

                            {userType === 'aluno' && (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.inputContainer}>
                                            <Feather name="calendar" size={20} color="#666" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder='Idade'
                                                placeholderTextColor='#999'
                                                style={styles.input}
                                                value={idade}
                                                onChangeText={setIdade}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <View style={styles.inputContainer}>
                                            <Feather name="users" size={20} color="#666" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder='Turma (opcional)'
                                                placeholderTextColor='#999'
                                                style={styles.input}
                                                value={turma}
                                                onChangeText={setTurma}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                    </View>
                                </>
                            )}

                            {userType === 'responsavel' && (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.inputContainer}>
                                            <Feather name="phone" size={20} color="#666" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder='Telefone para contato'
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
                                            <Feather name="map-pin" size={20} color="#666" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder='Endereço (opcional)'
                                                placeholderTextColor='#999'
                                                style={styles.input}
                                                value={endereco}
                                                onChangeText={setEndereco}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                        </>
                    )}

                    {/* Botão de Cadastro */}
                    <TouchableOpacity 
                        style={[styles.signUpButton, loadingAuth && styles.buttonDisabled]} 
                        onPress={handleSignUp}
                        disabled={loadingAuth}
                        activeOpacity={0.8}
                    >
                        {loadingAuth ? (
                            <ActivityIndicator size={24} color='#fff'/>
                        ) : (
                            <>
                                <Feather name="user-plus" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.signUpButtonText}>Criar Conta</Text>
                            </>
                        )}
                    </TouchableOpacity>
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
        width: 40, // Para balancear o botão de voltar
    },
    sectionContainer: {
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#191970',
        marginBottom: 20,
        textAlign: 'center',
    },
    userTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    userTypeButton: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e9ecef',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userTypeButtonActive: {
        backgroundColor: '#191970',
        borderColor: '#191970',
    },
    userTypeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#191970',
        marginTop: 10,
    },
    userTypeTextActive: {
        color: '#fff',
    },
    formContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 25,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 20,
    },
    formSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#191970',
        marginBottom: 20,
        marginTop: 10,
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
    signUpButton: {
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
    signUpButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});