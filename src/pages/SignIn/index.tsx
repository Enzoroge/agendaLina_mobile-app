import React, {useState, useContext} from 'react';
import { 
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../contexts/AuthContext';

export default function SignIn(){
    const {signIn, loadingAuth} = useContext(AuthContext)
    const navigation = useNavigation();

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    async function handleLogin(){
        if(email === '' || password === ''){
            Alert.alert('Atenção', 'Por favor, preencha todos os campos');
            return;
        }
        
        if(!email.includes('@')){
            Alert.alert('Erro', 'Por favor, digite um e-mail válido');
            return;
        }
        
        try {
            await signIn({email, password})
        } catch (error) {
            Alert.alert('Erro', 'Credenciais inválidas. Tente novamente.');
        }
    }

    return(
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header com Logo */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image 
                            style={styles.logo}
                            source={require('../../assets/logo.jpeg')}
                        />
                    </View>
                    <Text style={styles.title}>Agenda Lina</Text>
                    <Text style={styles.subtitle}>Sistema de Gestão Escolar</Text>
                </View>

                {/* Formulário de Login */}
                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder='Digite seu e-mail'
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
                                placeholder='Digite sua senha'
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

                    <TouchableOpacity 
                        style={[styles.button, loadingAuth && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={loadingAuth}
                        activeOpacity={0.8}
                    >
                        {loadingAuth ? (
                            <ActivityIndicator size={24} color='#fff'/>
                        ) : (
                            <>
                                <Feather name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Entrar</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Link para Cadastro */}
                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Não tem uma conta? </Text>
                        <TouchableOpacity 
                            onPress={() => (navigation as any).navigate('SignUp')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.signUpLink}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 Agenda Lina</Text>
                    <Text style={styles.footerSubtext}>Versão 1.0.0</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 20,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    title: {
        color: '#191970',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
    button: {
        backgroundColor: '#191970',
        height: 55,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
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
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    footerSubtext: {
        color: '#999',
        fontSize: 12,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    signUpText: {
        color: '#666',
        fontSize: 16,
    },
    signUpLink: {
        color: '#191970',
        fontSize: 16,
        fontWeight: 'bold',
    },
});