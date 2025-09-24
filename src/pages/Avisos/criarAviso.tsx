import React, {useState, useContext}  from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";


export default function CriarAviso(){
    const [inputTitel, setInputTitle] = useState('')
    const [descricao, setDescricao] = useState('')
    const [loading, setLoading] = useState(false)
    const navigation = useNavigation()
    const { user } = useContext(AuthContext)

    async function handleCreateAviso(){
        // Validações
        if(!inputTitel.trim() || !descricao.trim()){
            Alert.alert('Erro','Por favor, preencha todos os campos.')
            return;
        }
        
        if(inputTitel.trim().length < 3){
            Alert.alert('Erro','O título deve ter pelo menos 3 caracteres.')
            return;
        }
        
        if(descricao.trim().length < 10){
            Alert.alert('Erro','A descrição deve ter pelo menos 10 caracteres.')
            return;
        }
        
        if(descricao.length > 500){
            Alert.alert('Erro','A descrição deve ter no máximo 500 caracteres.')
            return;
        }
        
        setLoading(true)
        
        try {
            const response = await api.post('/aviso', {
                titulo: inputTitel.trim(),
                descricao: descricao.trim(),
                criadoPorId: parseInt(user.id)
            })
            console.log('Resposta da API:', response.data)
            
            Alert.alert(
                'Sucesso! ✅', 
                'Aviso criado com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setInputTitle('')
                            setDescricao('')
                            navigation.goBack()
                        }
                    }
                ]
            )
        } catch (error: any) {
            console.log('Erro ao criar aviso:', error)
            console.log('Detalhes do erro:', error.response?.data)
            Alert.alert(
                'Erro ❌', 
                'Não foi possível criar o aviso. Tente novamente.',
                [{ text: 'OK' }]
            )
        } finally {
            setLoading(false)
        }
    }
    



    return(
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Criar Novo Aviso</Text>
                <Text style={styles.headerSubtitle}>Preencha as informações abaixo</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    {/* Título Section */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Título *</Text>
                        <TextInput
                            placeholder="Digite o título do aviso"
                            style={styles.input}
                            value={inputTitel}
                            onChangeText={setInputTitle}
                            placeholderTextColor="#999"
                            maxLength={100}
                            returnKeyType="next"
                        />
                        <Text style={styles.charCounter}>{inputTitel.length}/100</Text>
                    </View>

                    {/* Descrição Section */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Descrição *</Text>
                        <TextInput
                            placeholder="Descreva o conteúdo do aviso..."
                            style={styles.textArea}
                            value={descricao}
                            onChangeText={setDescricao}
                            multiline={true}
                            numberOfLines={6}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                            maxLength={500}
                        />
                        <Text style={styles.charCounter}>{descricao.length}/500</Text>
                    </View>

                    {/* Button */}
                    <TouchableOpacity 
                        onPress={handleCreateAviso} 
                        style={[styles.button, loading && styles.buttonDisabled]}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? '⏳ Criando...' : '📢 Criar Aviso'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )

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
    scrollView: {
        flex: 1,
    },
    form: {
        flex: 1,
        padding: 20,
        paddingTop: 30,
    },
    inputContainer: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 55,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    textArea: {
        width: '100%',
        height: 150,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    charCounter: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 5,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 18,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
        elevation: 0,
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    }
})