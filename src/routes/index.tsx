import React, {useContext} from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { AuthContext } from "../contexts/AuthContext";

import AppRoutes from "./app.routes";
import AuthRoutes from "./auth.routes";

function Routes(){
   const {isAuthenticatde, loading} = useContext(AuthContext)

    if(loading){
        return(
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.appIcon}>🏫</Text>
                    </View>
                    
                    <Text style={styles.appName}>AgendaLina</Text>
                    <Text style={styles.loadingText}>Carregando...</Text>
                    
                    <ActivityIndicator 
                        size="large" 
                        color="#4CAF50" 
                        style={styles.spinner}
                    />
                    
                    <Text style={styles.footerText}>Sistema de Gestão Educacional</Text>
                </View>
            </View>
        )
    }

    return(
        isAuthenticatde ? <AppRoutes/> : <AuthRoutes/>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#191970',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingCard: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 15,
        width: '85%',
        maxWidth: 300,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e8f5e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    appIcon: {
        fontSize: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#191970',
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 25,
        textAlign: 'center',
    },
    spinner: {
        marginBottom: 25,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default Routes;
