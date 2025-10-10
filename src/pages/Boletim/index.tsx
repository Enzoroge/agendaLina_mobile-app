import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CalculoMediaService } from '../../services/calculoMediaService';
import type { Boletim } from '../../services/calculoMediaService';

export default function BoletimPage() {
  const [boletim, setBoletim] = useState<Boletim | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  return(
    <View style={styles.container}>
      <View>
        <View style={styles.cardHeader}>
          <Text>Boletim</Text>
        </View>
        <View style={styles.cardBody}>
          <Text>Historia</Text>
          <Text>Nota: 8.5</Text>
          
        </View>
         <View style={styles.cardBody}>
          <Text>Historia</Text>
          <Text>Nota: 8.5</Text>
          
        </View>
      </View>
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  cardBody: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeader: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  }
})

export {BoletimPage};