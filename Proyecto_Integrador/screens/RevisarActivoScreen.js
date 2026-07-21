import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppShell from '../components/AppShell';
import { Card, colors, FormField, InfoRow, PageHeading, PrimaryButton, SecondaryButton } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function RevisarActivoScreen({ navigation, route }) {
  const asset = route.params?.activo;
  const auditId = route.params?.auditoriaId;
  const readOnly = route.params?.readOnly || !auditId;
  const [statuses, setStatuses] = useState([]);
  const [statusId, setStatusId] = useState(asset?.estatus_id || null);
  const [location, setLocation] = useState(asset?.ubicacion || '');
  const [notes, setNotes] = useState(asset?.detalle?.observacion || '');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { endpoints.statuses().then(setStatuses).catch((e) => Alert.alert('Error', apiErrorMessage(e))); }, []);
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permiso requerido', 'Autoriza el acceso a fotografias para adjuntar evidencia.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };
  const upload = async () => {
    if (!photo) return;
    const form = new FormData();
    if (Platform.OS === 'web') form.append('archivo', await (await fetch(photo.uri)).blob(), photo.fileName || 'evidencia.jpg');
    else form.append('archivo', { uri: photo.uri, name: photo.fileName || 'evidencia.jpg', type: photo.mimeType || 'image/jpeg' });
    await endpoints.uploadEvidence(auditId, asset.id, form);
  };
  const save = async () => {
    if (!statusId || !location.trim() || notes.trim().length < 3) {
      Alert.alert('Campos incompletos', 'Selecciona estado, ubicacion y escribe observaciones.'); return;
    }
    try {
      setSaving(true);
      await endpoints.reviewAsset(auditId, asset.id, { encontrado: true, estatus_nuevo_id: statusId,
        ubicacion_encontrada: location.trim(), observacion: notes.trim(),
        tipo_incidencia: statusId !== asset.estatus_id ? 'Cambio de estado' : null });
      await upload();
      Alert.alert('Revision guardada', 'La revision y su evidencia se registraron correctamente.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }]);
    } catch (error) { Alert.alert('No fue posible guardar', apiErrorMessage(error)); }
    finally { setSaving(false); }
  };

  if (!asset) return null;
  return <AppShell navigation={navigation} title="Revisar activo" activeRoute="Auditorias">
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeading eyebrow="// REVISION FISICA" title={asset.nombre} subtitle="Verifica la informacion y registra el estado fisico real." />
      <Card><Text style={styles.section}>Datos del activo</Text>
        <InfoRow label="CODIGO QR" value={asset.codigo_qr || asset.folio} />
        <InfoRow label="UBICACION" value={asset.ubicacion || 'Sin ubicacion'} />
        <InfoRow label="GARANTIA" value={asset.garantia || 'No registrada'} last />
      </Card>
      <Card><Text style={styles.section}>Estado fisico actual</Text><View style={styles.grid}>
        {statuses.map((item) => <TouchableOpacity disabled={readOnly} key={item.id} style={[styles.state, statusId === item.id && styles.selected]} onPress={() => setStatusId(item.id)}>
          <Ionicons name={statusId === item.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={statusId === item.id ? colors.accentDark : colors.placeholder} />
          <Text style={styles.stateText}>{item.nombre}</Text></TouchableOpacity>)}
      </View>
        <FormField label="UBICACION ENCONTRADA *" value={location} onChangeText={setLocation} editable={!readOnly} icon="location-outline" />
        <FormField label="OBSERVACIONES *" value={notes} onChangeText={setNotes} editable={!readOnly} multiline icon="chatbox-outline" />
      </Card>
      {!readOnly && <Card><Text style={styles.section}>Evidencia fotografica</Text>
        {photo && <Image source={{ uri: photo.uri }} style={styles.photo} />}
        <SecondaryButton title={photo ? 'Cambiar fotografia' : 'Seleccionar fotografia'} icon="camera-outline" onPress={choosePhoto} />
      </Card>}
      {!readOnly && <PrimaryButton title={saving ? 'Guardando...' : 'Guardar revision'} icon="save-outline" onPress={save} disabled={saving} />}
      <SecondaryButton title="Regresar" icon="arrow-back-outline" onPress={() => navigation.goBack()} />
    </ScrollView>
  </AppShell>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 45 }, section: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, state: { flexBasis: 140, flexGrow: 1, flexDirection: 'row', gap: 7,
    alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 9 }, selected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  stateText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, photo: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 }, });
