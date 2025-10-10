import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import Routes from './src/routes';
import { StyleSheet, Text, View } from 'react-native';
import SignIn from './src/pages/SignIn';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer >
        <AuthProvider>
            <StatusBar backgroundColor="black" style="light" translucent={false}  />
            <Routes/>
         </AuthProvider>
     </NavigationContainer>
    </SafeAreaProvider>
  );
}


