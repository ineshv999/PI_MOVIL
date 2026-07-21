import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppShell from '../components/AppShell';
import { Card, colors, InfoRow, PageHeading, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function DetalleAuditoriaScreen({ navigation, route }) {
  const id = route.params?.auditoria?.id; const [audit, setAudit] = useState(null); const [assets, setAssets] = useState([]);
  useEffect(() => { (async () => { try { const [detail, all] = await Promise.all([endpoints.audit(id), endpoints.assets()]); setAudit(detail);
    setAssets(detail.detalles.map((d) => ({ ...(all.find((a) => a.id === d.activo_id) || { id: d.activo_id, nombre: `Activo #${d.activo_id}` }), detalle: d })));
  } catch (e) { Alert.alert('Error', apiErrorMessage(e)); } })(); }, [id]);
  if (!audit) return null;
  return <AppShell navigation={navigation} title="Detalle de auditoria" activeRoute="Auditorias"><ScrollView contentContainerStyle={styles.content}>
    <PageHeading eyebrow="// DETALLE" title={audit.titulo} subtitle="Informacion y activos asociados a la auditoria." />
    <Card><InfoRow label="ID" value={String(audit.id)} /><InfoRow label="DESCRIPCION" value={audit.descripcion || 'Sin descripcion'} />
      <InfoRow label="PROGRESO" value={`${audit.revisados}/${audit.total_activos}`} /><StatusBadge status={audit.estado === 'cancelada' ? 'Cancelada' : 'Completada'} /></Card>
    {assets.map((asset) => <Card key={asset.id}><View style={styles.row}><Ionicons name="cube-outline" size={20} color={colors.accentDark} />
      <View style={styles.body}><Text style={styles.title}>{asset.nombre}</Text><Text style={styles.meta}>{asset.codigo_qr} · {asset.ubicacion || 'Sin ubicacion'}</Text></View>
      <StatusBadge status={asset.detalle.estado_revision === 'revisado' ? 'Completada' : 'Pendiente'} /></View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RevisarActivo', { activo: { ...asset, detalle: asset.detalle }, readOnly: true })}>
        <Text style={styles.buttonText}>Consultar</Text></TouchableOpacity></Card>)}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 42 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, body: { flex: 1 },
  title: { color: colors.textPrimary, fontWeight: '800' }, meta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 }, button: { marginTop: 12, padding: 11, borderRadius: 8, backgroundColor: colors.blueSoft, alignItems: 'center' }, buttonText: { color: colors.blue, fontWeight: '800' } });
