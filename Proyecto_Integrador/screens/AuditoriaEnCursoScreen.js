import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
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
  const [availableAssets, setAvailableAssets] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [auditBuilding, setAuditBuilding] = useState('Sin edificio');

  const load = useCallback(async () => {
    try {
      const [detail, allAssets, buildings, statuses] = await Promise.all([
        endpoints.audit(audit.id), endpoints.assets(), endpoints.buildings(), endpoints.statuses(),
      ]);
      setAssets(detail.detalles.map((row) => {
        const item = allAssets.find((a) => a.id === row.activo_id) || { id: row.activo_id, nombre: `Activo #${row.activo_id}` };
        return { ...item, folio: item.folio, edificio: buildings.find((b) => b.id === item.edificio_id)?.nombre || 'Sin edificio',
          estadoAnterior: statuses.find((s) => s.id === row.estatus_anterior_id)?.nombre || 'Sin estado',
          revisado: row.estado_revision === 'revisado', detalle: row };
      }));
      setAvailableAssets(allAssets.map((item) => ({ ...item, edificio: buildings.find((b) => b.id === item.edificio_id)?.nombre || 'Sin edificio' })));
      setAuditBuilding(buildings.find((item) => item.id === detail.edificio_id)?.nombre || 'Sin edificio');
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

  const candidates = availableAssets.filter((item) => !assets.some((assigned) => assigned.id === item.id) && item.activo && `${item.nombre} ${item.folio} ${item.edificio} ${item.ubicacion}`.toLowerCase().includes(addSearch.toLowerCase()));
  const addSelectedAsset = async () => {
    if (!selectedAssetId) return;
    try { await endpoints.assignAssets(audit.id, [selectedAssetId]); setShowAdd(false); setSelectedAssetId(null); setAddSearch(''); await load(); }
    catch (error) { Alert.alert('No fue posible agregar el activo', apiErrorMessage(error)); }
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
          <InfoRow label="EDIFICIO" value={auditBuilding} />
          <InfoRow label="UBICACIÓN / INDICACIONES" value={audit.ubicacion_detalle || 'Sin indicaciones adicionales'} />
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
        visible={showDelete}
        title="Eliminar Auditoría"
        message="La auditoría y todo el detalle de activos serán eliminados permanentemente."
        confirmText="Eliminar definitivamente"
        confirmIcon="trash-outline"
        danger
        onConfirm={async () => { try { await endpoints.deleteAudit(audit.id); setShowDelete(false); navigation.navigate('Auditorias'); }
          catch (error) { Alert.alert('No fue posible eliminar', apiErrorMessage(error)); } }}
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

            <TextInput style={styles.searchInput} value={addSearch} onChangeText={setAddSearch} placeholder="Buscar por nombre, folio, edificio o ubicación..." />
            <ScrollView style={styles.candidateList}>{candidates.length ? candidates.map((item) => <TouchableOpacity key={item.id} style={[styles.assetOption, selectedAssetId === item.id && styles.assetOptionSelected]} onPress={() => setSelectedAssetId(item.id)}>
              <Ionicons name={selectedAssetId === item.id ? 'radio-button-on' : 'radio-button-off'} size={21} color={colors.blue} /><View style={styles.assetOptionBody}><Text style={styles.assetOptionTitle}>{item.nombre}</Text><Text style={styles.assetOptionText}>{item.folio} · {item.edificio} · {item.ubicacion || 'Sin ubicación'}</Text></View>
            </TouchableOpacity>) : <Text style={styles.noCandidates}>No hay activos disponibles con esa búsqueda.</Text>}</ScrollView>

            <PrimaryButton
              title="Agregar a auditoría"
              icon="add-outline"
              onPress={addSelectedAsset}
              disabled={!selectedAssetId}
            />
            <SecondaryButton
              title="Cancelar"
              icon="close-outline"
              onPress={() => setShowAdd(false)}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={showCancel} transparent animationType="fade" onRequestClose={() => setShowCancel(false)}><View style={styles.modalOverlay}><View style={styles.modalCard}>
        <View style={styles.cancelIcon}><Ionicons name="warning-outline" size={32} color={colors.danger} /></View><Text style={styles.modalTitle}>Cancelar auditoría</Text><Text style={styles.modalSubtitle}>Indica el motivo. La auditoría quedará cerrada y ya no permitirá más revisiones.</Text>
        <Text style={styles.reasonLabel}>MOTIVO DE CANCELACIÓN *</Text><TextInput style={[styles.reasonInput, cancelError && styles.reasonInvalid]} value={cancelReason} onChangeText={(value) => { setCancelReason(value); setCancelError(''); }} multiline placeholder="Explica por qué se cancela la auditoría..." />{cancelError && <Text style={styles.reasonError}>{cancelError}</Text>}
        <TouchableOpacity style={styles.cancelConfirm} onPress={async () => { if (cancelReason.trim().length < 5) { setCancelError('Escribe un motivo de al menos 5 caracteres'); return; } try { await endpoints.cancelAudit(audit.id, cancelReason.trim()); setShowCancel(false); navigation.navigate('Auditorias'); } catch (error) { setCancelError(apiErrorMessage(error)); } }}><Ionicons name="close-circle-outline" size={20} color="#fff" /><Text style={styles.cancelConfirmText}>Cancelar auditoría</Text></TouchableOpacity>
        <SecondaryButton title="Regresar" icon="arrow-back-outline" onPress={() => { setShowCancel(false); setCancelError(''); }} />
      </View></View></Modal>
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
  searchInput: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, color: colors.textPrimary },
  candidateList: { maxHeight: 270, marginBottom: 12 },
  assetOptionSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  noCandidates: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 25 },
  cancelIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  reasonLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '900', marginBottom: 7 },
  reasonInput: { height: 115, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, textAlignVertical: 'top', marginBottom: 5 },
  reasonInvalid: { borderColor: colors.danger }, reasonError: { color: colors.danger, fontSize: 10, fontWeight: '800', marginBottom: 12 },
  cancelConfirm: { minHeight: 52, borderRadius: 10, backgroundColor: colors.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cancelConfirmText: { color: '#fff', fontWeight: '900' },
});
