import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface MenuItemProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  color?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ title, icon, onPress, color = '#007AFF' }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Feather name={icon} size={32} color={color} />
    </View>
    <Text style={styles.menuText}>{title}</Text>
  </TouchableOpacity>
);

export default function MenuAdmin() {
  const navigation = useNavigation();

  const menuItems = [
    {
      title: 'Professores',
      icon: 'user-check' as keyof typeof Feather.glyphMap,
      onPress: () => navigation.navigate('Professores' as never),
      color: '#4CAF50',
    },
    {
      title: 'Alunos',
      icon: 'user' as keyof typeof Feather.glyphMap,
      onPress: () => navigation.navigate('Alunos' as never),
      color: '#2196F3',
    },
    {
      title: 'Responsáveis',
      icon: 'user-x' as keyof typeof Feather.glyphMap,
      onPress: () => navigation.navigate('Responsaveis' as never),
      color: '#FF9800',
    },
    {
      title: 'Turmas',
      icon: 'users' as keyof typeof Feather.glyphMap,
      onPress: () => navigation.navigate('Turmas' as never),
      color: '#9C27B0',
    },
    {
      title: 'Disciplinas',
      icon: 'book' as keyof typeof Feather.glyphMap,
      onPress: () => navigation.navigate('Disciplina' as never),
      color: '#F44336',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu Administrativo</Text>
        <Text style={styles.subtitle}>Gerencie todas as funcionalidades do sistema</Text>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            title={item.title}
            icon={item.icon}
            onPress={item.onPress}
            color={item.color}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '45%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});