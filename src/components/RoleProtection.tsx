import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

interface RoleProtectionProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackMessage?: string;
}

export default function RoleProtection({ allowedRoles, children, fallbackMessage }: RoleProtectionProps) {
  const { user } = useContext(AuthContext);
  
  const hasAccess = allowedRoles.includes(user.role);
  
  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚫 Acesso Negado</Text>
        </View>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedIcon}>🔒</Text>
          <Text style={styles.accessDeniedTitle}>Área Restrita</Text>
          <Text style={styles.accessDeniedSubtitle}>
            {fallbackMessage || 'Você não tem permissão para acessar esta área.'}
          </Text>
          <Text style={styles.roleInfo}>
            Seu perfil atual: {user.role}
          </Text>
          <Text style={styles.allowedRoles}>
            Perfis permitidos: {allowedRoles.join(', ')}
          </Text>
        </View>
      </View>
    );
  }
  
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#d32f2f",
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
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  accessDeniedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  accessDeniedSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  roleInfo: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: '600',
  },
  allowedRoles: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: 'italic',
  },
});