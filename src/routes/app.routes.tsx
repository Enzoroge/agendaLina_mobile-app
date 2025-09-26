import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons"; // ✅ Corrigido
import { AuthContext } from "../contexts/AuthContext";

import Dashboard from "../pages/Dashboard";
import Avisos from "../pages/Avisos";
import MenuAdmin from "../pages/MenuAdmin";
import Professores from "../pages/Professores";
import Responsaveis from "../pages/Responsaveis";
import Alunos from "../pages/Alunos";
import Turmas from "../pages/Turmas";
import Disciplina from "../pages/Disciplina";

// Telas de criação
import CriarResponsavel from "../pages/Responsaveis/criarResponsavel";
import CriarAviso from "../pages/Avisos/criarAviso";
import CreateDisciplina from "../pages/Disciplina/createDisciplina";

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
        name="CreateDisciplina"
        component={CreateDisciplina}
        options={{
            //   headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus" size={size} color={color} />
          ),
          tabBarLabel: "Nova Disciplina",
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
      
      {/* Apenas não-alunos podem ver o menu administrativo */}
      {!isAluno && (
        <Tab.Screen
          name="Menu"
          component={MenuAdmin}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Feather name="grid" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

export default function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Telas administrativas */}
      <Stack.Screen 
        name="Professores" 
        component={Professores}
        options={{
          headerShown: true,
          title: "Professores",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="Alunos" 
        component={Alunos}
        options={{
          headerShown: true,
          title: "Alunos",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="Responsaveis" 
        component={Responsaveis}
        options={{
          headerShown: true,
          title: "Responsáveis",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="Turmas" 
        component={Turmas}
        options={{
          headerShown: true,
          title: "Turmas",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="Disciplina" 
        component={Disciplina}
        options={{
          headerShown: true,
          title: "Disciplinas",
          headerBackTitle: "Voltar"
        }}
      />

      {/* Telas de criação */}
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
