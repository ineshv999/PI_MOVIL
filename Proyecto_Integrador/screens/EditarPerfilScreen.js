import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, PrimaryButton } from '../components/ScreenUI';
import { apiErrorMessage, downloadWithAuth, endpoints } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EditarPerfilScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ nombres: user?.nombres || '', apellidos: user?.apellidos || '', puesto: user?.puesto || '', edad: String(user?.edad || ''), domicilio: user?.domicilio || '', password: '', confirm: '' });
  const [photo, setPhoto] = useState(null); const [currentPhoto, setCurrentPhoto] = useState(null); const [errors, setErrors] = useState({}); const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; if (!user?.foto_url) return undefined; (async () => { try { const blob = await downloadWithAuth('/auth/me/foto'); const reader = new FileReader(); reader.onloadend = () => { if (active) setCurrentPhoto(reader.result); }; reader.readAsDataURL(blob); } catch { /* se muestra el marcador */ } })(); return () => { active = false; }; }, [user?.foto_url]);
  const change = (key, value) => { setForm((old) => ({ ...old, [key]: value })); setErrors((old) => ({ ...old, [key]: null })); };
  const validate = () => { const e = {};
    if (form.nombres.trim().length < 2) e.nombres = 'Ingresa al menos 2 caracteres';
    if (form.apellidos.trim().length < 2) e.apellidos = 'Ingresa al menos 2 caracteres';
    if (form.puesto.trim().length < 2) e.puesto = 'El puesto es requerido';
    if (!/^\d+$/.test(form.edad) || +form.edad < 18 || +form.edad > 100) e.edad = 'Ingresa una edad entre 18 y 100';
    if (form.domicilio.trim().length < 5) e.domicilio = 'El domicilio es requerido';
    if (form.password && (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password))) e.password = 'Mínimo 8 caracteres, mayúscula, minúscula y número';
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden'; setErrors(e); return !Object.keys(e).length; };
  const pickPhoto = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .75 }); if (!result.canceled) setPhoto(result.assets[0]); };
  const photoForm = async () => { const data = new FormData(); if (Platform.OS === 'web') data.append('archivo', await (await fetch(photo.uri)).blob(), photo.fileName || 'perfil.jpg');
    else data.append('archivo', { uri: photo.uri, name: photo.fileName || 'perfil.jpg', type: photo.mimeType || 'image/jpeg' }); return data; };
  const save = async () => { if (!validate()) return; try { setSaving(true); const payload = { nombres: form.nombres.trim(), apellidos: form.apellidos.trim(), puesto: form.puesto.trim(), edad: +form.edad, domicilio: form.domicilio.trim() }; if (form.password) payload.password = form.password;
      await endpoints.updateMe(payload); if (photo) await endpoints.uploadMyPhoto(await photoForm()); await refreshUser(); Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (error) { Alert.alert('No fue posible actualizar', apiErrorMessage(error)); } finally { setSaving(false); } };
  return <AppShell navigation={navigation} title="Mi perfil" activeRoute="EditarPerfil"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <PageHeading eyebrow="// CUENTA DE USUARIO" title="Editar perfil" subtitle="Actualiza tu información personal y credenciales." />
    <Card><TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>{photo?.uri || currentPhoto ? <><Image source={{ uri: photo?.uri || currentPhoto }} style={styles.photo} /><View style={styles.photoBadge}><Ionicons name="camera" size={17} color="#fff" /><Text style={styles.badgeText}>Cambiar foto</Text></View></> : <><Ionicons name="camera-outline" size={34} color={colors.accentDark} /><Text style={styles.photoText}>Seleccionar fotografía</Text></>}</TouchableOpacity></Card>
    <Card><Text style={styles.section}>Datos de acceso</Text><ReadOnly label="CORREO ELECTRÓNICO" value={user?.correo} /><ReadOnly label="ROL DEL SISTEMA" value={({ administrador: 'Administrador', auditor: 'Auditor', usuario: 'Usuario' })[user?.rol] || user?.rol} /></Card>
    <Card><Field label="NOMBRES *" value={form.nombres} onChangeText={(v) => change('nombres', v)} error={errors.nombres} /><Field label="APELLIDOS *" value={form.apellidos} onChangeText={(v) => change('apellidos', v)} error={errors.apellidos} /><Field label="PUESTO *" value={form.puesto} onChangeText={(v) => change('puesto', v)} error={errors.puesto} /><Field label="EDAD *" value={form.edad} keyboardType="numeric" onChangeText={(v) => change('edad', v)} error={errors.edad} /><Field label="DOMICILIO *" value={form.domicilio} onChangeText={(v) => change('domicilio', v)} error={errors.domicilio} /></Card>
    <Card><Text style={styles.section}>Cambiar contraseña (opcional)</Text><Field label="NUEVA CONTRASEÑA" secureTextEntry value={form.password} onChangeText={(v) => change('password', v)} error={errors.password} /><Field label="CONFIRMAR CONTRASEÑA" secureTextEntry value={form.confirm} onChangeText={(v) => change('confirm', v)} error={errors.confirm} /><PrimaryButton title={saving ? 'Guardando...' : 'Guardar cambios'} icon="save-outline" onPress={save} disabled={saving} /></Card>
  </ScrollView></AppShell>;
}
function Field({ label, error, ...props }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={[styles.input, error && styles.invalid]} placeholderTextColor={colors.placeholder} />{error && <Text style={styles.error}>{error}</Text>}</View>; }
function ReadOnly({ label, value }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={[styles.input, styles.readOnly]}><Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} /><Text style={styles.readOnlyText}>{value || '—'}</Text></View></View>; }
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 50 }, photoBox: { height: 190, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, photo: { width: '100%', height: '100%', resizeMode: 'cover' }, photoBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.accentDark, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }, badgeText: { color: '#fff', fontWeight: '800', fontSize: 11 }, photoText: { color: colors.accentDark, fontWeight: '800', marginTop: 8 }, section: { fontSize: 16, fontWeight: '900', marginBottom: 16 }, field: { marginBottom: 15 }, label: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 7 }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.textPrimary }, readOnly: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#ECEFED' }, readOnlyText: { color: colors.textSecondary, fontWeight: '700' }, invalid: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 10, fontWeight: '700', marginTop: 5 } });
