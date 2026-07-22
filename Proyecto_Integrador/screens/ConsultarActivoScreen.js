import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AppShell from '../components/AppShell';
import { Card, colors, InfoRow, PageHeading, PrimaryButton, SecondaryButton } from '../components/ScreenUI';
import { apiErrorMessage, downloadWithAuth, endpoints } from '../services/api';

const blobDataUrl = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });

export default function ConsultarActivoScreen({ navigation, route }) {
  const initial = route.params?.activo; const [asset, setAsset] = useState(initial); const [building, setBuilding] = useState(initial?.edificio || 'Sin edificio');
  const [photo, setPhoto] = useState(null); const [qr, setQr] = useState(null);
  useEffect(() => { if (!initial?.id) return; (async () => { try {
    const [current, buildings] = await Promise.all([endpoints.asset(initial.id), endpoints.buildings()]); setAsset(current); setBuilding(buildings.find((item) => item.id === current.edificio_id)?.nombre || 'Sin edificio');
    setQr(await blobDataUrl(await downloadWithAuth(`/activos/${current.id}/qr`)));
    if (current.foto_url) { try { setPhoto(await blobDataUrl(await downloadWithAuth(`/activos/${current.id}/foto`))); } catch { setPhoto(null); } }
  } catch (error) { Alert.alert('No fue posible consultar el activo', apiErrorMessage(error)); } })(); }, [initial?.id]);
  if (!asset) return null;
  const downloadQr = async () => { if (!qr) return; if (Platform.OS === 'web') { const link = document.createElement('a'); link.href = qr; link.download = `${asset.folio}-QR.png`; link.click(); return; }
    const path = `${FileSystem.cacheDirectory}${asset.folio}-QR.png`; await FileSystem.writeAsStringAsync(path, qr.split(',')[1], { encoding: FileSystem.EncodingType.Base64 }); await Sharing.shareAsync(path, { mimeType: 'image/png' }); };
  const printQr = () => { if (Platform.OS !== 'web') { downloadQr(); return; } const win = window.open('', '_blank'); win.document.write(`<html><body style="text-align:center;font-family:sans-serif"><h2>${asset.nombre}</h2><p>${asset.folio}</p><img src="${qr}" style="width:320px"><script>onload=()=>print()</script></body></html>`); win.document.close(); };
  const registered = asset.creado_en ? new Date(asset.creado_en).toLocaleString('es-MX') : 'No registrada';
  return <AppShell navigation={navigation} title="Consultar activo" activeRoute="InventarioGeneral"><ScrollView contentContainerStyle={styles.content}>
    <PageHeading eyebrow="// FICHA DEL ACTIVO" title={asset.nombre} subtitle="Información registrada del activo." />
    <Card><Text style={styles.section}>Fotografía del activo</Text>{photo ? <Image source={{ uri: photo }} style={styles.photo} resizeMode="contain" /> : <View style={styles.noPhoto}><Ionicons name="image-outline" size={42} color={colors.placeholder} /><Text style={styles.noPhotoText}>Sin fotografía registrada</Text></View>}</Card>
    <Card><Text style={styles.section}>Datos del activo</Text><InfoRow label="FOLIO" value={asset.folio} /><InfoRow label="NOMBRE" value={asset.nombre} />
      <InfoRow label="EDIFICIO" value={building} /><InfoRow label="UBICACIÓN" value={asset.ubicacion || 'Sin ubicación'} /><InfoRow label="GARANTÍA" value={asset.garantia || 'No registrada'} />
      <InfoRow label="OBSERVACIONES" value={asset.descripcion || 'Sin observaciones'} /><InfoRow label="FECHA DE REGISTRO" value={registered} last /></Card>
    <Card><Text style={styles.section}>Código QR</Text>{qr ? <Image source={{ uri: qr }} style={styles.qr} /> : <Text style={styles.loading}>Generando QR...</Text>}
      <PrimaryButton title="Descargar QR" icon="download-outline" onPress={downloadQr} disabled={!qr} /><SecondaryButton title="Imprimir QR" icon="print-outline" onPress={printQr} disabled={!qr} /></Card>
    <SecondaryButton title="Regresar al inventario" icon="arrow-back-outline" onPress={() => navigation.goBack()} />
  </ScrollView></AppShell>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 45 }, section: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 14 },
  photo: { width: '100%', height: 280, borderRadius: 12, backgroundColor: colors.background }, noPhoto: { height: 210, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, noPhotoText: { color: colors.textSecondary, marginTop: 9, fontWeight: '700' },
  qr: { width: 250, height: 250, alignSelf: 'center', marginBottom: 15 }, loading: { color: colors.textSecondary, textAlign: 'center', marginVertical: 40 } });
