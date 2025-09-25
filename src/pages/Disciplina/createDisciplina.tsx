import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import { api } from '../../services/api';

export default function createDisciplina(){
    const [nome, setNome] = useState('')

    async function handleAddDisciplina(){
        if(!nome.trim()){
            Alert.alert("Error ao criar disciplina")
        }
        try {
            const response = await api.post('/disciplina',{
                nome: nome.trim()
            })
        } catch (error) {
            Alert.alert("Error ao criar disciplina")
        }

    return(
        <>
        <Text>Adicionar Disciplina</Text>
        </>
        
    )
}
}