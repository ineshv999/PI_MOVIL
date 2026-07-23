import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppShell from '../components/AppShell';
import { Card, colors, InfoRow, PageHeading, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function DetalleAuditoriaScreen({ navigation, route }) {
  const id = route.params?.auditoria?.id; const [audit, setAudit] = useState(null); const [assets, setAssets] = useState([]); const [building, setBuilding] = useState('Sin edificio');
  useEffect(() => { (async () => { try { const [detail, all, buildings] = await Promise.all([endpoints.audit(id), endpoints.assets(), endpoints.buildings()]); setAudit(detail); setBuilding(buildings.find((item) => item.id === detail.edificio_id)?.nombre || 'Sin edificio');
    setAssets(detail.detalles.map((d) => ({ ...(all.find((a) => a.id === d.activo_id) || { id: d.activo_id, nombre: d.activo_nombre, folio: d.activo_folio, codigo_qr: d.activo_folio, ubicacion: d.activo_ubicacion }), detalle: d })));
  } catch (e) { Alert.alert('Error', apiErrorMessage(e)); } })(); }, [id]);
  if (!audit) return null;
  return <AppShell navigation={navigation} title="Detalle de auditoria" activeRoute="Auditorias"><ScrollView contentContainerStyle={styles.content}>
    <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Auditorias')}><Ionicons name="arrow-back" size={20} color={colors.textSecondary} /><Text style={styles.backText}>Regresar a auditorías</Text></TouchableOpacity>
    <PageHeading eyebrow="// DETALLE" title={audit.titulo} subtitle="Informacion y activos asociados a la auditoria." />
    <Card><InfoRow label="DESCRIPCION" value={audit.descripcion || 'Sin descripcion'} /><InfoRow label="RESPONSABLE" value={audit.responsable_nombre} /><InfoRow label="EDIFICIO" value={building} /><InfoRow label="UBICACIÓN / INDICACIONES" value={audit.ubicacion_detalle || 'Sin indicaciones adicionales'} />
      {audit.estado === 'cancelada' && <InfoRow label="MOTIVO DE CANCELACIÓN" value={audit.motivo_cancelacion || 'Sin motivo registrado'} />}<InfoRow label="PROGRESO" value={`${audit.revisados}/${audit.total_activos}`} /><StatusBadge status={audit.estado === 'cancelada' ? 'Cancelada' : 'Completada'} /></Card>
    {assets.map((asset) => <Card key={asset.id}><View style={styles.row}><Ionicons name="cube-outline" size={20} color={colors.accentDark} />
      <View style={styles.body}><Text style={styles.title}>{asset.nombre}</Text><Text style={styles.meta}>{asset.codigo_qr} · {asset.ubicacion || 'Sin ubicacion'}</Text></View>
      <StatusBadge status={asset.detalle.estado_revision === 'revisado' ? 'Completada' : 'Pendiente'} /></View>
      {audit.estado !== 'cancelada' && <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RevisarActivo', { activo: { ...asset, detalle: asset.detalle }, readOnly: true })}>
        <Text style={styles.buttonText}>Consultar</Text></TouchableOpacity>}</Card>)}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 42 }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 }, backText: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, body: { flex: 1 },
  title: { color: colors.textPrimary, fontWeight: '800' }, meta: { color: colors.textSecondary, fontSize: 11, marginTop: 4 }, button: { marginTop: 12, padding: 11, borderRadius: 8, backgroundColor: colors.blueSoft, alignItems: 'center' }, buttonText: { color: colors.blue, fontWeight: '800' } });
