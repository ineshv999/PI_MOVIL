import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
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
  InfoRow,
  SearchBar,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
  ConfirmModal,
} from '../components/ScreenUI';

const defaultAudit = {
  id: 7,
  nombre: 'Auditoría de Control #7',
  descripcion: 'Revisión de inventario general de activos fijos.',
  fechaProgramada: '2026-06-18',
  responsable: 'Eduardo',
  creado: '2026-05-30 18:56:29',
  estado: 'En Progreso',
};

const defaultAssets = [
  {
    id: 62,
    folio: 'ACT-0062',
    nombre: 'Monitor Samsung 24"',
    edificio: 'Edificio A',
    ubicacion: 'Laboratorio 3',
    estadoAnterior: 'Activo',
    revisado: false,
  },
  {
    id: 61,
    folio: 'ACT-0061',
    nombre: 'Laptop Dell Latitude',
    edificio: 'Edificio B',
    ubicacion: 'Sala de maestros',
    estadoAnterior: 'Activo',
    revisado: true,
  },
];

export default function AuditoriaEnCursoScreen({ navigation, route }) {
  const audit = route.params?.auditoria || defaultAudit;
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, allAssets, buildings, statuses] = await Promise.all([
        endpoints.audit(audit.id), endpoints.assets(), endpoints.buildings(), endpoints.statuses(),
      ]);
      setAssets(detail.detalles.map((row) => {
        const item = allAssets.find((a) => a.id === row.activo_id) || { id: row.activo_id, nombre: `Activo #${row.activo_id}` };
        return { ...item, folio: item.codigo_qr, edificio: buildings.find((b) => b.id === item.edificio_id)?.nombre || 'Sin edificio',
          estadoAnterior: statuses.find((s) => s.id === row.estatus_anterior_id)?.nombre || 'Sin estado',
          revisado: row.estado_revision === 'revisado', detalle: row };
      }));
    } catch (error) { Alert.alert('No fue posible cargar la auditoria', apiErrorMessage(error)); }
  }, [audit.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reviewed = assets.filter((item) => item.revisado).length;
  const progress = assets.length ? Math.round((reviewed / assets.length) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) =>
      `${asset.nombre} ${asset.folio}`.toLowerCase().includes(q)
    );
  }, [assets, search]);

  const addDemoAsset = () => {
    if (assets.some((item) => item.id === 60)) {
      setShowAdd(false);
      return;
    }

    setAssets((current) => [
      ...current,
      {
        id: 60,
        folio: 'ACT-0060',
        nombre: 'Proyector Epson',
        edificio: 'Edificio A',
        ubicacion: 'Aula 204',
        estadoAnterior: 'Activo',
        revisado: false,
      },
    ]);
    setShowAdd(false);
  };

  return (
    <AppShell
      navigation={navigation}
      title="Auditoría en curso"
      activeRoute="Auditorias"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeading
          eyebrow="// EJECUCIÓN DE AUDITORÍA"
          title={audit.nombre}
          subtitle="Avance de revisión y estado de los activos asignados."
        />

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.navigate('Auditorias')}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
          <Text style={styles.backText}>Volver a Auditorías</Text>
        </TouchableOpacity>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButtonBlue} onPress={() => navigation.navigate('Escanear', { auditoriaId: audit.id })}>
            <Ionicons name="qr-code-outline" size={17} color={colors.blue} /><Text style={styles.actionTextBlue}>Escanear QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonBlue}
            onPress={() => setShowAdd(true)}
          >
            <Ionicons name="add-circle-outline" size={17} color={colors.blue} />
            <Text style={styles.actionTextBlue}>Agregar activo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonGreen}
            onPress={() => setShowComplete(true)}
          >
            <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
            <Text style={styles.actionTextWhite}>Completar auditoría</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonDanger}
            onPress={() => setShowCancel(true)}
          >
            <Ionicons name="close-circle-outline" size={17} color={colors.danger} />
            <Text style={styles.actionTextDanger}>Cancelar auditoría</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonDanger}
            onPress={() => setShowDelete(true)}
          >
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
            <Text style={styles.actionTextDanger}>Eliminar auditoría</Text>
          </TouchableOpacity>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Detalles de la auditoría</Text>
          <InfoRow label="DESCRIPCIÓN" value={audit.descripcion} />
          <InfoRow label="FECHA PROGRAMADA" value={audit.fechaProgramada} />
          <InfoRow label="RESPONSABLE" value={audit.responsable} />
          <InfoRow label="FECHA CREACIÓN" value={audit.creado} />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>ESTADO ACTUAL</Text>
            <StatusBadge status={audit.estado} />
          </View>
        </Card>

        <Card>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>PROGRESO DE REVISIÓN DE ACTIVOS</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressMeta}>
            {reviewed} de {assets.length} activos revisados
          </Text>
        </Card>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o folio..."
          onClear={() => setSearch('')}
        />

        {filtered.map((asset) => (
          <Card key={asset.id}>
            <View style={styles.assetHeader}>
              <View style={styles.assetIcon}>
                <Ionicons name="cube-outline" size={21} color={colors.accentDark} />
              </View>
              <View style={styles.assetBody}>
                <Text style={styles.assetName}>{asset.nombre}</Text>
                <Text style={styles.assetFolio}>{asset.folio}</Text>
              </View>
              <StatusBadge status={asset.revisado ? 'Completada' : 'Pendiente'} />
            </View>

            <Text style={styles.assetLocation}>
              {asset.edificio} · {asset.ubicacion}
            </Text>

            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() =>
                navigation.navigate('RevisarActivo', {
                  activo: asset,
                  auditoriaId: audit.id,
                })
              }
            >
              <Ionicons name="create-outline" size={17} color={colors.blue} />
              <Text style={styles.reviewText}>
                {asset.revisado ? 'Editar revisión' : 'Revisar activo'}
              </Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>

      <ConfirmModal
        visible={showComplete}
        title="Completar Auditoría"
        message={`Aún quedan ${assets.length - reviewed} activos sin revisar. Si completas la auditoría ahora, quedarán marcados como no revisados.`}
        confirmText="Completar auditoría"
        onConfirm={async () => { try { await endpoints.completeAudit(audit.id); setShowComplete(false);
          navigation.replace('ResultadosAuditoria', { auditoria: { ...audit, estado: 'Completada' } }); }
          catch (error) { Alert.alert('No fue posible completar', apiErrorMessage(error)); } }}
        onCancel={() => setShowComplete(false)}
      />

      <ConfirmModal
        visible={showCancel}
        title="Cancelar Auditoría"
        message="La auditoría pasará a estado Cancelada y ya no será posible realizar más revisiones."
        confirmText="Cancelar auditoría"
        confirmIcon="close-circle-outline"
        danger
        onConfirm={async () => { try { await endpoints.cancelAudit(audit.id, 'Cancelada desde la aplicacion movil');
          setShowCancel(false); navigation.navigate('Auditorias'); }
          catch (error) { Alert.alert('No fue posible cancelar', apiErrorMessage(error)); } }}
        onCancel={() => setShowCancel(false)}
      />

      <ConfirmModal
        visible={showDelete}
        title="Eliminar Auditoría"
        message="La auditoría y todo el detalle de activos serán eliminados permanentemente."
        confirmText="Eliminar definitivamente"
        confirmIcon="trash-outline"
        danger
        onConfirm={() => {
          setShowDelete(false);
          navigation.navigate('Auditorias');
        }}
        onCancel={() => setShowDelete(false)}
      />

      <Modal
        visible={showAdd}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.addIcon}>
              <Ionicons name="add-circle" size={30} color={colors.blue} />
            </View>
            <Text style={styles.modalTitle}>Agregar activo</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona un activo que aún no forme parte de la auditoría.
            </Text>

            <View style={styles.assetOption}>
              <Ionicons name="cube-outline" size={21} color={colors.textSecondary} />
              <View style={styles.assetOptionBody}>
                <Text style={styles.assetOptionTitle}>Proyector Epson</Text>
                <Text style={styles.assetOptionText}>ACT-0060 · Aula 204</Text>
              </View>
            </View>

            <PrimaryButton
              title="Agregar a auditoría"
              icon="add-outline"
              onPress={addDemoAsset}
              disabled={assets.some((item) => item.id === 60)}
            />
            <SecondaryButton
              title="Cancelar"
              icon="close-outline"
              onPress={() => setShowAdd(false)}
            />
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 45,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: 14,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
  },
  actionButtonBlue: {
    flexGrow: 1,
    flexBasis: 145,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C9DDFB',
    borderRadius: 9,
    backgroundColor: colors.blueSoft,
  },
  actionButtonGreen: {
    flexGrow: 1,
    flexBasis: 145,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9,
    backgroundColor: colors.accent,
  },
  actionButtonDanger: {
    flexGrow: 1,
    flexBasis: 145,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3C6C6',
    borderRadius: 9,
    backgroundColor: colors.dangerSoft,
  },
  actionTextBlue: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  actionTextWhite: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  actionTextDanger: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 12,
  },
  statusLabel: {
    color: colors.label,
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressLabel: {
    flex: 1,
    color: colors.label,
    fontSize: 9,
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  progressValue: {
    color: colors.accentDark,
    fontSize: 22,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginTop: 13,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 7,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assetIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetBody: {
    flex: 1,
  },
  assetName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  assetFolio: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  assetLocation: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 13,
  },
  reviewButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C9DDFB',
    borderRadius: 9,
    backgroundColor: colors.blueSoft,
    marginTop: 14,
  },
  reviewText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 15, 13, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  addIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  assetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    padding: 13,
    marginBottom: 15,
  },
  assetOptionBody: {
    flex: 1,
  },
  assetOptionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  assetOptionText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
});
