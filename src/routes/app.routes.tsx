import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons"; // ✅ Corrigido
import { AuthContext } from "../contexts/AuthContext";

import Dashboard from "../pages/Dashboard";
import Avisos from "../pages/Avisos";
import Professores from "../pages/Professores";
import Responsaveis from "../pages/Responsaveis";
import Alunos from "../pages/Alunos";
import Turmas from "../pages/Turmas";
import Disciplina from "../pages/Disciplina";

// Telas de criação
import CriarResponsavel from "../pages/Responsaveis/criarResponsavel";
import CriarAviso from "../pages/Avisos/criarAviso";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { user } = useContext(AuthContext);
  const isAluno = user.role === 'ALUNO';

  return (
    <Tab.Navigator
      screenOptions={{
        // headerShown: false,
        animation: "shift",
        tabBarHideOnKeyboard: true,
        // tabBarShowLabel: false remove a legenda abaixo do icone
        // tabBarActiveTintColor: '#fff000',
        // tabBarStyle:{
        //     backgroundColor: 'yellow'
        // }
        
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
            //   headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Avisos"
        component={Avisos}
        options={{
            // headerShown: false,

          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      
      {/* Apenas não-alunos podem ver essas telas */}
      {!isAluno && (
        <>
          <Tab.Screen
            name="Professores"
            component={Professores}
            options={{
                //   headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Feather name="user-check" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Alunos"
            component={Alunos}
            options={{
                //   headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Feather name="user" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Responsáveis"
            component={Responsaveis}
            options={{
                //   headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Feather name="user-x" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Turmas"
            component={Turmas}
            options={{
                //   headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Feather name="users" size={size} color={color} />
              ),
            }}
            
          />
          <Tab.Screen
            name="Disciplina"
            component={Disciplina}
            options={{
                //   headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Feather name="book" size={size} color={color} />
              ),
            }}
            
          />
        </>
      )}
    </Tab.Navigator>
  );
}

export default function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="CriarResponsavel" 
        component={CriarResponsavel} 
        options={{
          headerShown: true,
          title: "Criar Responsável",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="CriarAviso" 
        component={CriarAviso} 
        options={{
          headerShown: true,
          title: "Criar Aviso",
          headerBackTitle: "Voltar"
        }}
      />
    </Stack.Navigator>
  );
}
