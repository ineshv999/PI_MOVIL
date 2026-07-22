import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AppShell from '../components/AppShell';
import { Card, colors, ConfirmModal, FormField, InfoRow, PageHeading, PrimaryButton, SecondaryButton } from '../components/ScreenUI';
import { apiErrorMessage, downloadWithAuth, endpoints } from '../services/api';

export default function RevisarActivoScreen({ navigation, route }) {
  const asset = route.params?.activo;
  const auditId = route.params?.auditoriaId;
  const readOnly = route.params?.readOnly || !auditId;
  const [statuses, setStatuses] = useState([]);
  const [statusId, setStatusId] = useState(asset?.estatus_id || null);
  const [location, setLocation] = useState(asset?.ubicacion || '');
  const [notes, setNotes] = useState(asset?.detalle?.observacion || '');
  const [photo, setPhoto] = useState(null);
  const [assetPhoto, setAssetPhoto] = useState(null);
  const [qr, setQr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { (async () => { try { setStatuses(await endpoints.statuses());
    const toDataUrl = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
    setQr(await toDataUrl(await downloadWithAuth(`/activos/${asset.id}/qr`)));
    if (asset.foto_url) { try { setAssetPhoto(await toDataUrl(await downloadWithAuth(`/activos/${asset.id}/foto`))); } catch { setAssetPhoto(null); } }
  } catch (e) { Alert.alert('Error', apiErrorMessage(e)); } })(); }, [asset?.id]);
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permiso requerido', 'Autoriza el acceso a fotografias para adjuntar evidencia.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) { setPhoto(result.assets[0]); setErrors((current) => ({ ...current, photo: null, general: null })); }
  };
  const upload = async () => {
    if (!photo) return;
    const form = new FormData();
    if (Platform.OS === 'web') form.append('archivo', await (await fetch(photo.uri)).blob(), photo.fileName || 'evidencia.jpg');
    else form.append('archivo', { uri: photo.uri, name: photo.fileName || 'evidencia.jpg', type: photo.mimeType || 'image/jpeg' });
    await endpoints.uploadEvidence(auditId, asset.id, form);
  };
  const requestSave = () => {
    const next = {}; const changed = Number(statusId) !== Number(asset.estatus_id);
    if (!statusId) next.status = 'Selecciona el estado físico actual';
    if (!location.trim()) next.location = 'La ubicación encontrada es obligatoria';
    if (changed && notes.trim().length < 5) next.notes = 'Cuando cambia el estado, explica la situación con al menos 5 caracteres';
    if (photo?.fileSize > 5 * 1024 * 1024) next.photo = 'La evidencia no puede superar 5 MB';
    setErrors(next); if (Object.keys(next).length) return;
    setShowConfirm(true);
  };
  const save = async () => {
    try {
      setShowConfirm(false); setSaving(true);
      await endpoints.reviewAsset(auditId, asset.id, { encontrado: true, estatus_nuevo_id: statusId,
        ubicacion_encontrada: location.trim(), observacion: notes.trim() || null,
        tipo_incidencia: Number(statusId) !== Number(asset.estatus_id) ? 'Cambio de estado' : null });
      await upload();
      Alert.alert('Revisión guardada', 'La revisión y su evidencia se registraron correctamente.'); navigation.goBack();
    } catch (error) { setErrors({ general: apiErrorMessage(error) }); }
    finally { setSaving(false); }
  };
  const downloadQr = async () => { if (!qr) return; if (Platform.OS === 'web') { const link = document.createElement('a'); link.href = qr; link.download = `${asset.folio}-QR.png`; link.click(); return; }
    const path = `${FileSystem.cacheDirectory}${asset.folio}-QR.png`; await FileSystem.writeAsStringAsync(path, qr.split(',')[1], { encoding: FileSystem.EncodingType.Base64 }); await Sharing.shareAsync(path, { mimeType: 'image/png' }); };
  const printQr = () => { if (Platform.OS !== 'web') { downloadQr(); return; } const win = window.open('', '_blank'); win.document.write(`<html><body style="text-align:center;font-family:sans-serif"><h2>${asset.nombre}</h2><p>${asset.folio}</p><img src="${qr}" style="width:320px"><script>onload=()=>print()</script></body></html>`); win.document.close(); };

  if (!asset) return null;
  return <AppShell navigation={navigation} title="Revisar activo" activeRoute="Auditorias">
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeading eyebrow="// REVISION FISICA" title={asset.nombre} subtitle="Verifica la informacion y registra el estado fisico real." />
      <Card><Text style={styles.section}>Fotografia del activo</Text>{assetPhoto ? <Image source={{ uri: assetPhoto }} style={styles.assetPhoto} resizeMode="contain" /> : <View style={styles.noPhoto}><Ionicons name="image-outline" size={40} color={colors.placeholder} /><Text style={styles.noPhotoText}>Sin fotografia registrada</Text></View>}</Card>
      <Card><Text style={styles.section}>Datos del activo</Text>
        <InfoRow label="FOLIO" value={asset.folio} />
        <InfoRow label="NOMBRE" value={asset.nombre} />
        <InfoRow label="UBICACION" value={asset.ubicacion || 'Sin ubicacion'} />
        <InfoRow label="GARANTIA" value={asset.garantia || 'No registrada'} />
        <InfoRow label="OBSERVACIONES DEL ACTIVO" value={asset.descripcion || 'Sin observaciones'} />
        <InfoRow label="FECHA DE REGISTRO" value={asset.creado_en ? new Date(asset.creado_en).toLocaleString('es-MX') : 'No registrada'} last />
      </Card>
      <Card><Text style={styles.section}>Codigo QR</Text>{qr && <Image source={{ uri: qr }} style={styles.qr} />}<SecondaryButton title="Descargar QR" icon="download-outline" onPress={downloadQr} /><SecondaryButton title="Imprimir QR" icon="print-outline" onPress={printQr} /></Card>
      <Card><Text style={styles.section}>Estado fisico actual</Text><View style={styles.grid}>
        {errors.general && <View style={styles.errorBanner}><Ionicons name="alert-circle" size={18} color={colors.danger} /><Text style={styles.errorBannerText}>{errors.general}</Text></View>}
        {statuses.map((item) => <TouchableOpacity disabled={readOnly} key={item.id} style={[styles.state, statusId === item.id && styles.selected, errors.status && styles.invalid]} onPress={() => { setStatusId(item.id); setErrors((current) => ({ ...current, status: null, general: null })); }}>
          <Ionicons name={statusId === item.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={statusId === item.id ? colors.accentDark : colors.placeholder} />
          <Text style={styles.stateText}>{item.nombre}</Text></TouchableOpacity>)}
      </View>
        {errors.status && <Text style={styles.fieldError}>{errors.status}</Text>}
        <FormField label="UBICACION ENCONTRADA *" value={location} onChangeText={(value) => { setLocation(value); setErrors((current) => ({ ...current, location: null, general: null })); }} error={errors.location} editable={!readOnly} icon="location-outline" />
        <FormField label="OBSERVACIONES (OPCIONAL SI NO HAY CAMBIOS)" value={notes} onChangeText={(value) => { setNotes(value); setErrors((current) => ({ ...current, notes: null, general: null })); }} error={errors.notes} editable={!readOnly} multiline icon="chatbox-outline" />
      </Card>
      {!readOnly && <Card><Text style={styles.section}>Evidencia fotografica</Text>
        {photo && <Image source={{ uri: photo.uri }} style={styles.photo} />}
        <SecondaryButton title={photo ? 'Cambiar fotografia' : 'Seleccionar fotografia'} icon="camera-outline" onPress={choosePhoto} />
        {errors.photo && <Text style={styles.photoError}>{errors.photo}</Text>}
      </Card>}
      {readOnly && asset.detalle?.evidencias?.length > 0 && <Card><Text style={styles.section}>Evidencias registradas</Text>{asset.detalle.evidencias.map((item) => <View key={item.id} style={styles.evidenceRow}><Ionicons name="image-outline" size={20} color={colors.accentDark} /><View><Text style={styles.evidenceName}>{item.nombre_archivo}</Text><Text style={styles.evidenceMeta}>{Math.ceil(item.tamano_bytes / 1024)} KB</Text></View></View>)}</Card>}
      {!readOnly && <PrimaryButton title={saving ? 'Guardando...' : 'Guardar revision'} icon="save-outline" onPress={requestSave} disabled={saving} />}
      <SecondaryButton title="Regresar" icon="arrow-back-outline" onPress={() => navigation.goBack()} />
    </ScrollView><ConfirmModal visible={showConfirm} title="Confirmar revisión" message={notes.trim() ? 'Se guardarán el estado físico, la ubicación, las observaciones y la evidencia seleccionada.' : 'El activo será registrado sin cambios ni observaciones. Confirma que la información revisada es correcta.'} confirmText="Enviar revisión" confirmIcon="send-outline" onConfirm={save} onCancel={() => setShowConfirm(false)} />
  </AppShell>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 45 }, section: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, state: { flexBasis: 140, flexGrow: 1, flexDirection: 'row', gap: 7,
    alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 9 }, selected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  stateText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, photo: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },
  invalid: { borderColor: colors.danger }, fieldError: { color: colors.danger, fontSize: 10, fontWeight: '800', marginTop: -10, marginBottom: 12 }, photoError: { color: colors.danger, fontSize: 10, fontWeight: '800', marginTop: 6 }, errorBanner: { width: '100%', flexDirection: 'row', gap: 8, padding: 12, backgroundColor: colors.dangerSoft, borderRadius: 9, marginBottom: 10 }, errorBannerText: { color: colors.danger, flex: 1, fontSize: 11, fontWeight: '700' },
  assetPhoto: { width: '100%', height: 260, borderRadius: 12, backgroundColor: colors.background }, noPhoto: { height: 190, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, noPhotoText: { color: colors.textSecondary, marginTop: 8, fontWeight: '700' },
  qr: { width: 230, height: 230, alignSelf: 'center', marginBottom: 12 }, evidenceRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, evidenceName: { color: colors.textPrimary, fontWeight: '700' }, evidenceMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 3 } });
