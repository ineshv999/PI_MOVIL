import React, { useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, PrimaryButton } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

const empty = { nombre: '', puesto: '', edad: '', domicilio: '', correo: '', password: '', confirm: '', rol: '' };
export default function RegistrarUsuarioScreen({ navigation }) {
  const [form, setForm] = useState(empty); const [errors, setErrors] = useState({}); const [photo, setPhoto] = useState(null); const [saving, setSaving] = useState(false); const [createdUser, setCreatedUser] = useState(null);
  const change = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: null, general: null })); };
  const validate = () => {
    const e = {}; const parts = form.nombre.trim().split(/\s+/);
    if (parts.length < 2) e.nombre = 'Escribe nombre y al menos un apellido';
    if (form.puesto.trim().length < 2) e.puesto = 'El puesto o cargo es requerido';
    if (!/^\d+$/.test(form.edad) || +form.edad < 18 || +form.edad > 100) e.edad = 'Ingresa una edad entre 18 y 100';
    if (form.domicilio.trim().length < 5) e.domicilio = 'El domicilio es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Ingresa un correo electronico valido';
    if (!form.rol) e.rol = 'Selecciona un rol del sistema';
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Minimo 8 caracteres, mayuscula, minuscula y numero';
    if (form.confirm !== form.password) e.confirm = 'Las contrasenas no coinciden'; setErrors(e); return Object.keys(e).length === 0;
  };
  const pickPhoto = async () => { const p = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!p.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 }); if (!r.canceled) setPhoto(r.assets[0]); };
  const makeFormData = async (item) => { const data = new FormData(); if (Platform.OS === 'web') data.append('archivo', await (await fetch(item.uri)).blob(), item.fileName || 'perfil.jpg');
    else data.append('archivo', { uri: item.uri, name: item.fileName || 'perfil.jpg', type: item.mimeType || 'image/jpeg' }); return data; };
  const save = async () => { if (!validate()) return; try { setSaving(true); const parts = form.nombre.trim().split(/\s+/); const first = parts.shift();
    const username = form.correo.trim().toLowerCase().split('@')[0].replace(/[^a-z0-9_.-]/g, '');
    const user = await endpoints.createUser({ username, password: form.password, nombres: first, apellidos: parts.join(' '), correo: form.correo.trim(), telefono: null,
      puesto: form.puesto.trim(), edad: +form.edad, domicilio: form.domicilio.trim() }, form.rol);
    if (photo) await endpoints.uploadUserPhoto(user.id, await makeFormData(photo));
    setCreatedUser(user);
  } catch (error) { setErrors({ general: apiErrorMessage(error) }); } finally { setSaving(false); } };
  return <AppShell navigation={navigation} title="Registrar usuario" activeRoute="RegistrarUsuario"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <PageHeading eyebrow="// ALTA DE USUARIOS" title="Registrar colaborador" subtitle="Datos personales, acceso y permisos del sistema." />
    {errors.general && <ErrorBanner text={errors.general} />}
    <Card><Text style={styles.section}>Foto de perfil <Text style={styles.optional}>(opcional)</Text></Text>
      <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>{photo ? <Image source={{ uri: photo.uri }} style={styles.photo} /> : <><Ionicons name="camera-outline" size={35} color={colors.placeholder} /><Text style={styles.hint}>JPG, PNG, WEBP · max. 5 MB</Text></>}</TouchableOpacity></Card>
    <Card><Text style={styles.section}>Datos personales</Text><Field label="NOMBRE COMPLETO *" value={form.nombre} onChange={(v) => change('nombre', v)} error={errors.nombre} placeholder="Ej. Maria Gonzalez" />
      <View style={styles.row}><Field box label="PUESTO / CARGO *" value={form.puesto} onChange={(v) => change('puesto', v)} error={errors.puesto} placeholder="Ej. Tecnico" />
        <Field box label="EDAD *" value={form.edad} onChange={(v) => change('edad', v)} error={errors.edad} placeholder="28" keyboardType="number-pad" /></View>
      <Field label="DOMICILIO *" value={form.domicilio} onChange={(v) => change('domicilio', v)} error={errors.domicilio} placeholder="Calle, colonia, ciudad..." /></Card>
    <Card><Text style={styles.section}>Credenciales y acceso</Text><Field label="CORREO ELECTRONICO *" value={form.correo} onChange={(v) => change('correo', v)} error={errors.correo} placeholder="ejemplo@correo.com" keyboardType="email-address" />
      <Text style={styles.fieldLabel}>ROL DEL SISTEMA *</Text><View style={styles.roles}>{[['usuario','Auditor'],['administrador','Administrador']].map(([id,label]) => <TouchableOpacity key={id} style={[styles.role, form.rol === id && styles.roleActive, errors.rol && styles.invalid]} onPress={() => change('rol', id)}><Text>{label}</Text></TouchableOpacity>)}</View>{errors.rol && <Text style={styles.error}>{errors.rol}</Text>}
      <View style={styles.row}><Field box secure label="CONTRASENA *" value={form.password} onChange={(v) => change('password', v)} error={errors.password} placeholder="Min. 8 caracteres" />
        <Field box secure label="CONFIRMAR CONTRASENA *" value={form.confirm} onChange={(v) => change('confirm', v)} error={errors.confirm} placeholder="Repetir" /></View>
      <PrimaryButton title={saving ? 'Registrando...' : 'Registrar usuario'} icon="person-add-outline" onPress={save} disabled={saving} /></Card>
  </ScrollView><Modal visible={!!createdUser} transparent animationType="fade"><View style={styles.overlay}><View style={styles.successModal}>
    <View style={styles.successCircle}><Ionicons name="checkmark-circle-outline" size={42} color={colors.accentDark} /></View><Text style={styles.successTag}>REGISTRO EXITOSO</Text>
    <Text style={styles.successTitle}>¡Usuario registrado!</Text><Text style={styles.successText}><Text style={styles.bold}>{createdUser?.nombres} {createdUser?.apellidos}</Text> fue registrado como {createdUser?.rol === 'administrador' ? 'Administrador' : 'Auditor'} y ya puede iniciar sesión.</Text>
    <PrimaryButton title="Aceptar" icon="checkmark-outline" onPress={() => { setCreatedUser(null); setForm(empty); setPhoto(null); navigation.goBack(); }} />
  </View></View></Modal></AppShell>;
}
function Field({ label, value, onChange, error, placeholder, keyboardType, secure, box }) { return <View style={[styles.field, box && styles.half]}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={[styles.input, error && styles.invalid]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.placeholder} keyboardType={keyboardType} secureTextEntry={secure} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} />{error && <Text style={styles.error}>{error}</Text>}</View>; }
function ErrorBanner({ text }) { return <View style={styles.banner}><Ionicons name="alert-circle" size={19} color={colors.danger} /><Text style={styles.bannerText}>{text}</Text></View>; }
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 45 }, section: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 14 }, optional: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  photoBox: { height: 160, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, photo: { width: '100%', height: '100%' }, hint: { color: colors.textSecondary, fontSize: 10, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10 }, field: { marginBottom: 15 }, half: { flex: 1 }, fieldLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: .6, marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.background, color: colors.textPrimary, paddingHorizontal: 12 }, invalid: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 10, fontWeight: '700', marginTop: 5 },
  roles: { flexDirection: 'row', gap: 9, marginBottom: 3 }, role: { flex: 1, padding: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 9, alignItems: 'center' }, roleActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  banner: { flexDirection: 'row', gap: 9, padding: 13, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: '#F3C6C6', borderRadius: 9, marginBottom: 15 }, bannerText: { flex: 1, color: colors.danger, fontWeight: '700', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(8,15,13,.7)', alignItems: 'center', justifyContent: 'center', padding: 18 }, successModal: { width: '100%', maxWidth: 450, backgroundColor: '#fff', borderRadius: 22, borderTopWidth: 4, borderTopColor: colors.accent, padding: 25, alignItems: 'center' },
  successCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, successTag: { color: colors.accentDark, fontSize: 10, fontWeight: '900' }, successTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 8 }, successText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginVertical: 16 }, bold: { color: colors.textPrimary, fontWeight: '800' } });
