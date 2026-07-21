import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/AppShell';
import { Card, colors, InfoRow, PageHeading, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function ResultadosAuditoriaScreen({ navigation, route }) {
  const id = route.params?.auditoria?.id;
  const [audit, setAudit] = useState(null);
  useEffect(() => { endpoints.audit(id).then(setAudit).catch((e) => Alert.alert('Error', apiErrorMessage(e))); }, [id]);
  if (!audit) return <AppShell navigation={navigation} title="Resultados" activeRoute="Auditorias"><View /></AppShell>;
  const unchanged = audit.detalles.filter((d) => d.estado_revision === 'revisado' && d.estatus_anterior_id === d.estatus_nuevo_id && !d.tipo_incidencia).length;
  return <AppShell navigation={navigation} title="Resultados de Auditoria" activeRoute="Auditorias">
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeading eyebrow="// REPORTE FINAL" title={audit.titulo} subtitle="Resultados consolidados de la revision fisica." />
      <StatusBadge status="Completada" />
      <Card><InfoRow label="DESCRIPCION" value={audit.descripcion || 'Sin descripcion'} />
        <InfoRow label="RESPONSABLE" value={`Usuario #${audit.responsable_id}`} />
        <InfoRow label="FECHA PROGRAMADA" value={audit.fecha_programada?.slice(0, 10) || 'Sin fecha'} last /></Card>
      <View style={styles.metrics}>{[
        ['Total revisados', audit.revisados, colors.blue], ['Sin cambios', unchanged, colors.accentDark], ['Incidencias', audit.incidencias, colors.warning],
      ].map(([label, value, color]) => <Card key={label} style={styles.metric}><Text style={[styles.value, { color }]}>{value}</Text><Text style={styles.label}>{label}</Text></Card>)}</View>
      <Card><Text style={styles.heading}>Detalle de incidencias</Text>
        {audit.detalles.filter((d) => d.tipo_incidencia).length === 0 ? <Text style={styles.empty}>Sin incidencias registradas.</Text>
          : audit.detalles.filter((d) => d.tipo_incidencia).map((d) => <View key={d.id} style={styles.incident}>
            <Text style={styles.incidentTitle}>Activo #{d.activo_id} · {d.tipo_incidencia}</Text><Text style={styles.empty}>{d.observacion}</Text>
            <Text style={styles.evidence}>{d.evidencias.length} evidencia(s) · {d.registrado_en?.slice(0, 10)}</Text></View>)}</Card>
    </ScrollView>
  </AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 45, gap: 12 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { flex: 1, minWidth: 100 }, value: { fontSize: 28, fontWeight: '900' }, label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  heading: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 12 }, empty: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  incident: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 }, incidentTitle: { color: colors.textPrimary, fontWeight: '800', marginBottom: 5 },
  evidence: { color: colors.label, fontSize: 10, marginTop: 6 } });
