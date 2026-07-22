import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiErrorMessage, endpoints } from '../services/api';
import AppShell from '../components/AppShell';
import {
  colors,
  PageHeading,
  Card,
  SearchBar,
} from '../components/ScreenUI';

const assets = [
  {
    id: 62,
    folio: 'ACT-0062',
    nombre: 'Monitor Samsung 24"',
    edificio: 'Edificio A',
    ubicacion: 'Laboratorio 3',
    estado: 'Activo',
    garantia: '2027-01-15',
  },
  {
    id: 61,
    folio: 'ACT-0061',
    nombre: 'Laptop Dell Latitude',
    edificio: 'Edificio B',
    ubicacion: 'Sala de maestros',
    estado: 'Activo',
    garantia: '2026-12-10',
  },
  {
    id: 60,
    folio: 'ACT-0060',
    nombre: 'Proyector Epson',
    edificio: 'Edificio A',
    ubicacion: 'Aula 204',
    estado: 'Pendiente',
    garantia: '2026-08-30',
  },
];

export default function InventarioGeneralScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [remoteAssets, setRemoteAssets] = useState([]);
  const load = useCallback(async () => {
    try {
      const [data, buildings] = await Promise.all([endpoints.assets(), endpoints.buildings()]);
      setRemoteAssets(data.map((item) => ({ ...item,
        edificio: buildings.find((b) => b.id === item.edificio_id)?.nombre || 'Sin edificio',
      })));
    } catch (error) { Alert.alert('No fue posible cargar inventario', apiErrorMessage(error)); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return remoteAssets;
    return remoteAssets.filter((asset) =>
      `${asset.nombre} ${asset.folio} ${asset.edificio} ${asset.ubicacion}`
        .toLowerCase()
        .includes(q)
    );
  }, [search, remoteAssets]);

  return (
    <AppShell
      navigation={navigation}
      title="Inventario general"
      activeRoute="InventarioGeneral"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeading
          eyebrow="// INVENTARIO"
          title="Inventario general"
          subtitle="Consulta los activos registrados y su ubicación actual."
        />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, folio o ubicación..."
          onClear={() => setSearch('')}
        />

        {filtered.map((asset) => (
          <Card key={asset.id}>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <Ionicons name="cube-outline" size={22} color={colors.accentDark} />
              </View>
              <View style={styles.headerBody}>
                <Text style={styles.name}>{asset.nombre}</Text>
                <Text style={styles.folio}>{asset.folio}</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={17} color={colors.textSecondary} />
              <Text style={styles.location}>
                {asset.edificio} · {asset.ubicacion}
              </Text>
            </View>

            <Text style={styles.warranty}>Garantía: {asset.garantia}</Text>

            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate('ConsultarActivo', { activo: asset })
              }
            >
              <Text style={styles.viewText}>Consultar activo</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.blue} />
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBox: {
    width: 43,
    height: 43,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  folio: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  location: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  warranty: {
    color: colors.placeholder,
    fontSize: 11,
    marginTop: 7,
  },
  viewButton: {
    minHeight: 41,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#C9DDFB',
    borderRadius: 9,
    backgroundColor: colors.blueSoft,
    marginTop: 14,
  },
  viewText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
});
