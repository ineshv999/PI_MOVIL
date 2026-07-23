import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiErrorMessage, endpoints } from '../services/api';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
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
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [remoteAssets, setRemoteAssets] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => {
    try {
      const [data, buildings] = await Promise.all([endpoints.assets(), endpoints.buildings()]);
      setRemoteAssets(data.map((item) => ({ ...item,
        edificio: buildings.find((b) => b.id === item.edificio_id)?.nombre || 'Sin edificio',
      })));
    } catch (error) { Alert.alert('No fue posible cargar inventario', apiErrorMessage(error)); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const removeAsset = async (purge) => { if (!pendingDelete) return; try { setDeleting(true); await (purge ? endpoints.purgeAsset(pendingDelete.id) : endpoints.deleteAsset(pendingDelete.id)); setPendingDelete(null); await load(); } catch (e) { Alert.alert(purge ? 'No fue posible borrar toda la existencia' : 'No fue posible retirar', apiErrorMessage(e)); } finally { setDeleting(false); } };

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
            {isAdmin && <TouchableOpacity style={styles.deleteButton} onPress={() => setPendingDelete(asset)}><Ionicons name="trash-outline" size={17} color={colors.danger} /><Text style={styles.deleteText}>Eliminar activo</Text></TouchableOpacity>}
          </Card>
        ))}
      </ScrollView><Modal visible={!!pendingDelete} transparent animationType="fade" onRequestClose={() => !deleting && setPendingDelete(null)}><View style={styles.overlay}><View style={styles.modalCard}>
        <View style={styles.warningCircle}><Ionicons name="warning-outline" size={42} color={colors.danger} /></View><Text style={styles.modalTitle}>Eliminar activo</Text>
        <Text style={styles.modalText}><Text style={styles.bold}>{pendingDelete?.nombre}</Text>{'\n'}Retirar conserva el historial. Borrar toda existencia elimina fotografía, revisiones de auditoría e historial y no se puede deshacer.</Text>
        <TouchableOpacity disabled={deleting} style={styles.safeDelete} onPress={() => removeAsset(false)}><Ionicons name="archive-outline" size={20} color={colors.danger} /><Text style={styles.safeText}>{deleting ? 'Procesando...' : 'Retirar y conservar historial'}</Text></TouchableOpacity>
        <TouchableOpacity disabled={deleting} style={styles.purgeButton} onPress={() => removeAsset(true)}><Ionicons name="trash-outline" size={20} color="#fff" /><Text style={styles.purgeText}>Borrar toda existencia</Text></TouchableOpacity>
        <TouchableOpacity disabled={deleting} style={styles.cancelButton} onPress={() => setPendingDelete(null)}><Ionicons name="arrow-back" size={20} color={colors.textSecondary} /><Text style={styles.cancelText}>Regresar</Text></TouchableOpacity>
      </View></View></Modal>
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
  deleteButton: { minHeight: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#F3C6C6', borderRadius: 9, marginTop: 8, backgroundColor: colors.dangerSoft }, deleteText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(8,15,13,.68)', alignItems: 'center', justifyContent: 'center', padding: 20 }, modalCard: { width: '100%', maxWidth: 610, backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center' }, warningCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, modalTitle: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', marginBottom: 14 }, modalText: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, textAlign: 'center', marginBottom: 24 }, bold: { color: colors.textPrimary, fontWeight: '900' }, safeDelete: { width: '100%', minHeight: 58, borderWidth: 1, borderColor: '#F3C6C6', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, safeText: { color: colors.danger, fontWeight: '900' }, purgeButton: { width: '100%', minHeight: 60, borderRadius: 14, backgroundColor: colors.danger, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, purgeText: { color: '#fff', fontWeight: '900' }, cancelButton: { width: '100%', minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, cancelText: { color: colors.textSecondary, fontWeight: '800' },
});
