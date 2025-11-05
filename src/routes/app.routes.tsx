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
import Atividades from "../pages/Atividades";
import MinhasAtividades from "../pages/Atividades/MinhasAtividades";
import ListarBoletins from "../pages/Boletim/ListarBoletins";
import BoletimDetalhe from "../pages/Boletim/BoletimDetalhe";
import LancarMedias from "../pages/Boletim/LancarMedias";
import SelecionarTurmaBoletim from "../pages/Boletim/SelecionarTurmaBoletim";
import ListaAlunosBoletim from "../pages/Boletim/ListaAlunosBoletim";
import MeuBoletim from "../pages/Boletim/MeuBoletim";

// Telas de criação
import CriarResponsavel from "../pages/Responsaveis/criarResponsavel";
import CriarAviso from "../pages/Avisos/criarAviso";
import CreateDisciplina from "../pages/Disciplina/createDisciplina";
import AdicionarTurma from "../pages/Turmas/adicionarTurma";
import CriarAtividades from "../pages/Atividades/criarAtividades";

// Telas de edição/detalhes
import EditTurma from "../pages/Turmas/editTurma";
import DetalhesTurma from "../pages/Turmas/detalhesTurma";
import EditAtividade from "../pages/Atividades/editAtividade";

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
        name="Boletins"
        component={ListarBoletins}
        options={{ headerShown: true, title: 'Boletins' }}
      />
      <Stack.Screen
        name="BoletimDetalhe"
        component={BoletimDetalhe}
        options={{ headerShown: true, title: 'Boletim' }}
      />
      <Stack.Screen
        name="LancarMedias"
        component={LancarMedias}
        options={{ headerShown: true, title: 'Lançar Médias' }}
      />
      <Stack.Screen
        name="SelecionarTurmaBoletim"
        component={SelecionarTurmaBoletim}
        options={{ headerShown: true, title: 'Selecionar Turma' }}
      />
      <Stack.Screen
        name="ListaAlunosBoletim"
        component={ListaAlunosBoletim}
        options={{ headerShown: true, title: 'Gerenciar Boletins' }}
      />
      <Stack.Screen
        name="MeuBoletim"
        component={MeuBoletim}
        options={{ headerShown: true, title: 'Meu Boletim' }}
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
      <Stack.Screen 
        name="Atividades" 
        component={Atividades}
        options={{
          headerShown: true,
          title: "Atividades",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="MinhasAtividades" 
        component={MinhasAtividades}
        options={{
          headerShown: false,
          title: "Minhas Atividades",
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
      <Stack.Screen 
        name="AdicionarTurma" 
        component={AdicionarTurma} 
        options={{
          headerShown: false,
          title: "Nova Turma",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="EditTurma" 
        component={EditTurma} 
        options={{
          headerShown: false,
          title: "Editar Turma",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="DetalhesTurma" 
        component={DetalhesTurma} 
        options={{
          headerShown: false,
          title: "Detalhes da Turma",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="CriarAtividades" 
        component={CriarAtividades} 
        options={{
          headerShown: false,
          title: "Nova Atividade",
          headerBackTitle: "Voltar"
        }}
      />
      <Stack.Screen 
        name="EditAtividade" 
        component={EditAtividade} 
        options={{
          headerShown: false,
          title: "Editar Atividade",
          headerBackTitle: "Voltar"
        }}
      />
    </Stack.Navigator>
  );
}
