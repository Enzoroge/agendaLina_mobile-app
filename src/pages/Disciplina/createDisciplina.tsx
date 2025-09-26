import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, TextInput, TouchableOpacity} from 'react-native';
import { api } from '../../services/api';

export default function CreateDisciplina(){
    const [nome, setNome] = useState('')

    async function handleAddDisciplina(){
        if(!nome.trim()){
            Alert.alert("Erro", "Por favor, informe o nome da disciplina")
            return
        }
        try {
            const response = await api.post('/disciplina',{
                nome: nome.trim()
            })
            Alert.alert("Sucesso", "Disciplina criada com sucesso!")
            setNome('') // Limpar o campo após criar
        } catch (error) {
            Alert.alert("Erro", "Erro ao criar disciplina")
        }
    }

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Adicionar Disciplina</Text>
            <TextInput
                style={styles.input}
                placeholder="Nome da disciplina"
                value={nome}
                onChangeText={setNome}
            />
            <TouchableOpacity style={styles.button} onPress={handleAddDisciplina}>
                <Text style={styles.buttonText}>Criar Disciplina</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
})

    