import React, {useState, createContext, ReactNode, useEffect} from 'react';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextData = {
    user: UserProps;
    isAuthenticatde: boolean;
    signIn: (info: SignInProps) => Promise<void>
    signUp: (info: SignUpProps) => Promise<void>
    loadingAuth: boolean;
    loading: boolean;
    signOut: () => Promise<void>
}

type UserProps = {
  id: string,
  name: string,
  email: string,
  token: string,
  role: string,
}

type AuthProviderProps = {
    children: ReactNode
}

type SignInProps = {
    email: string,
    password: string
}

type SignUpProps = {
    nome: string,
    email: string,
    password: string,
    tipo: 'professor' | 'aluno' | 'responsavel',
    disciplina?: string,
    disciplinas?: number[], // Array de IDs das disciplinas selecionadas
    formacao?: string,
    idade?: number,
    turma?: string,
    telefone?: string,
    endereco?: string,
    alunoId?: number
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({children}: AuthProviderProps){
    const [user, setUser] = useState<UserProps>({
        id:'',
        name: '',
        email: '',
        token: '',
        role: ''
    })
    
    const [isAuthenticatde, setIsAuthenticatde] = useState(false);
    const [loadingAuth, setLogingAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        async function getUser(){
            const userInfo = await AsyncStorage.getItem('@agendaLina')
            let hasUser: UserProps = JSON.parse(userInfo || '{}')

            if(Object.keys(hasUser).length > 0){
                api.defaults.headers.common['Authorization'] = `Bearer ${hasUser.token}`;

                setUser({
                    id: hasUser.id,
                    name: hasUser.name,
                    email: hasUser.email,
                    token: hasUser.token,
                    role: hasUser.role
                })
                setIsAuthenticatde(true);
            }

            setLoading(false);
        }
        getUser();
    }, [])

    async function signIn({email, password}: SignInProps){
        setLogingAuth(true);
        
        try{
            console.log('Tentando fazer login no endpoint: /login');
            const response = await api.post('/login', {
                email,
                password
            })

            const {id, name, token, role} = response.data;

            const data = {
                ...response.data
            };

            await AsyncStorage.setItem('@agendaLina', JSON.stringify(data))

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser({
                id,
                name, 
                email,
                token,
                role
            })
            
            setIsAuthenticatde(true);
            setLogingAuth(false);
            
        }catch(err){
            console.log("erro ao acessar", err)
            setLogingAuth(false);
        }
    }

    async function signUp({nome, email, password, tipo, disciplina, disciplinas, formacao, idade, turma, telefone, endereco, alunoId}: SignUpProps){
        setLogingAuth(true)

        try {
            // Primeiro criar o usuário básico
            const userResponse = await api.post('/users', {
                name: nome,
                email,
                password,
                role: tipo.toUpperCase() // PROFESSOR, ALUNO, RESPONSAVEL
            })

            console.log('Resposta da criação do usuário:', userResponse.data);

            // Extrair o ID do usuário criado
            let userId;
            if (userResponse.data && userResponse.data.user && userResponse.data.user.id) {
                // Caso o backend retorne {user: {id: X, ...}}
                userId = userResponse.data.user.id;
            } else if (typeof userResponse.data === 'object' && userResponse.data.id) {
                // Caso o backend retorne {id: X, ...}
                userId = userResponse.data.id;
            } else if (typeof userResponse.data === 'number') {
                // Caso o backend retorne apenas o ID como número
                userId = userResponse.data;
            } else if (typeof userResponse.data === 'string') {
                // Caso o backend retorne apenas o ID como string
                userId = parseInt(userResponse.data);
            } else {
                throw new Error('Erro ao obter ID do usuário criado');
            }
            
            const userIdNumber = parseInt(String(userId));
            console.log('UserID convertido:', userIdNumber);

            // Criar o perfil específico
            if (tipo === 'professor') {
                const professorData = {
                    userId: userIdNumber,
                    nome,
                    ...(disciplina && { disciplina }),
                    ...(formacao && { formacao })
                };
                console.log('Dados do professor a serem enviados:', professorData);
                const professorResponse = await api.post('/professor', professorData);
                console.log('Resposta completa da criação do professor:', professorResponse.data);
                
                // Se disciplinas foram selecionadas, criar as associações
                if (disciplinas && disciplinas.length > 0) {
                    console.log('Iniciando associação de disciplinas...');
                    console.log('Disciplinas a serem associadas:', disciplinas);
                    console.log('Resposta do professor:', JSON.stringify(professorResponse.data, null, 2));
                    
                    try {
                        // Tentar diferentes formas de extrair o ID do professor
                        let professorId = null;
                        
                        if (professorResponse.data.id) {
                            professorId = professorResponse.data.id;
                            console.log('Professor ID encontrado em data.id:', professorId);
                        } else if (professorResponse.data.professor?.id) {
                            professorId = professorResponse.data.professor.id;
                            console.log('Professor ID encontrado em data.professor.id:', professorId);
                        } else if (professorResponse.data.createProfessor?.id) {
                            professorId = professorResponse.data.createProfessor.id;
                            console.log('Professor ID encontrado em data.createProfessor.id:', professorId);
                        }
                        
                        console.log('Professor ID final extraído:', professorId);
                        
                        if (professorId) {
                            const associacaoData = {
                                professorId: professorId,
                                disciplinaId: disciplinas
                            };
                            
                            console.log('Dados da associação a serem enviados:', associacaoData);
                            console.log('Fazendo chamada para /associar-professor-disciplina...');
                            
                            const associacaoResponse = await api.post('/associar-professor-disciplina', associacaoData);
                            
                            console.log('Resposta da associação:', associacaoResponse.data);
                            console.log('Disciplinas associadas com sucesso!');
                        } else {
                            console.error('ID do professor não encontrado na resposta!');
                            console.error('Estrutura da resposta:', Object.keys(professorResponse.data));
                        }
                    } catch (error: any) {
                        console.error('=== ERRO AO ASSOCIAR DISCIPLINAS ===');
                        console.error('Erro completo:', error);
                        console.error('Status do erro:', error.response?.status);
                        console.error('Dados do erro:', error.response?.data);
                        console.error('Mensagem do erro:', error.message);
                        console.error('=====================================');
                        // Não interromper o cadastro se a associação falhar
                    }
                }
                
            } else if (tipo === 'aluno') {
                const alunoData = {
                    userId: userIdNumber,
                    nome,
                    ...(idade && { idade }),
                    ...(turma && { turma })
                };
                console.log('Dados do aluno a serem enviados:', alunoData);
                await api.post('/aluno', alunoData);
                
            } else if (tipo === 'responsavel') {
                const responsavelData: any = {
                    userId: userIdNumber,
                    nome,
                    email,
                    ...(telefone && { telefone }),
                    ...(endereco && { endereco })
                };
                
                // Se alunoId foi fornecido, inclua-o
                if (alunoId) {
                    responsavelData.alunoId = alunoId;
                }
                
                console.log('Dados do responsável a serem enviados:', responsavelData);
                
                try {
                    await api.post('/responsavel', responsavelData);
                } catch (responsavelError: any) {
                    // Se o erro for sobre alunoId obrigatório, lance uma mensagem específica
                    if (responsavelError.response?.data?.message?.includes('alunoId')) {
                        throw new Error('Para criar um responsável, é necessário associá-lo a um aluno. Esta funcionalidade será implementada em breve.');
                    }
                    // Re-lance outros erros
                    throw responsavelError;
                }
            }

            setLogingAuth(false)
            return Promise.resolve();
            
        } catch (error: any) {
            setLogingAuth(false)
            
            if (error.response?.status === 409) {
                throw new Error('Este email já está cadastrado. Tente fazer login ou use outro email.');
            } else if (error.response?.status === 400) {
                const backendMessage = error.response?.data?.message || error.response?.data?.error;
                throw new Error(backendMessage || 'Dados inválidos. Verifique as informações e tente novamente.');
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Erro ao criar conta. Verifique sua conexão e tente novamente.');
            }
        }
    }

    async function signOut(){
        await AsyncStorage.clear()
        .then(() => {
            setIsAuthenticatde(false);
            setUser({
                id: '',
                name: '',
                email: '',
                token: '',
                role: ''
            })
        })
    }

    return(
        <AuthContext.Provider 
            value={{
                user,
                isAuthenticatde,
                signIn,
                loadingAuth,
                loading,
                signUp,
                signOut
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}