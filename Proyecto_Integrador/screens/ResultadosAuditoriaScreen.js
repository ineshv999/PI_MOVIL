import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppShell from '../components/AppShell';
import { Card, colors, InfoRow, PageHeading, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';
import { HorizontalBarChart } from '../components/AuditCharts';

export default function ResultadosAuditoriaScreen({ navigation, route }) {
  const id = route.params?.auditoria?.id;
  const [audit, setAudit] = useState(null);
  const [building, setBuilding] = useState('Sin edificio');
  const [statuses, setStatuses] = useState([]);
  useEffect(() => { Promise.all([endpoints.audit(id), endpoints.buildings(), endpoints.statuses()]).then(([data, buildings, statusData]) => { setAudit(data); setStatuses(statusData); setBuilding(buildings.find((item) => item.id === data.edificio_id)?.nombre || 'Sin edificio'); }).catch((e) => Alert.alert('Error', apiErrorMessage(e))); }, [id]);
  if (!audit) return <AppShell navigation={navigation} title="Resultados" activeRoute="Auditorias"><View /></AppShell>;
  const unchanged = audit.detalles.filter((d) => d.estado_revision === 'revisado' && d.estatus_anterior_id === d.estatus_nuevo_id && !d.tipo_incidencia).length;
  const palette = ['#16A34A', '#22C55E', '#D97706', '#DC2626', '#6B7280'];
  const distribution = statuses.map((status, index) => ({ label: status.nombre, value: audit.detalles.filter((row) => row.estado_revision === 'revisado' && row.estatus_nuevo_id === status.id).length, color: palette[index % palette.length] }));
  return <AppShell navigation={navigation} title="Resultados de Auditoria" activeRoute="Auditorias">
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Auditorias')}><Ionicons name="arrow-back" size={20} color={colors.textSecondary} /><Text style={styles.backText}>Regresar a auditorías</Text></TouchableOpacity>
      <PageHeading eyebrow="// REPORTE FINAL" title={audit.titulo} subtitle="Resultados consolidados de la revision fisica." />
      <StatusBadge status="Completada" />
      <Card><InfoRow label="DESCRIPCION" value={audit.descripcion || 'Sin descripcion'} />
        <InfoRow label="RESPONSABLE" value={audit.responsable_nombre} />
        <InfoRow label="EDIFICIO" value={building} />
        <InfoRow label="UBICACIÓN / INDICACIONES" value={audit.ubicacion_detalle || 'Sin indicaciones adicionales'} />
        <InfoRow label="FECHA PROGRAMADA" value={audit.fecha_programada?.slice(0, 10) || 'Sin fecha'} last /></Card>
      <View style={styles.metrics}>{[
        ['Total revisados', audit.revisados, colors.blue], ['Sin cambios', unchanged, colors.accentDark], ['Incidencias', audit.incidencias, colors.warning],
      ].map(([label, value, color]) => <Card key={label} style={styles.metric}><Text style={[styles.value, { color }]}>{value}</Text><Text style={styles.label}>{label}</Text></Card>)}</View>
      <Card><HorizontalBarChart title="Distribución del estado físico" subtitle="Estado final encontrado en los activos revisados." totalLabel="revisados" items={distribution} /></Card>
      <Card><Text style={styles.heading}>Detalle de incidencias</Text>
        {audit.detalles.filter((d) => d.tipo_incidencia).length === 0 ? <Text style={styles.empty}>Sin incidencias registradas.</Text>
          : audit.detalles.filter((d) => d.tipo_incidencia).map((d) => <View key={d.id} style={styles.incident}>
            <Text style={styles.incidentTitle}>Activo #{d.activo_id} · {d.tipo_incidencia}</Text><Text style={styles.empty}>{d.observacion}</Text>
            <Text style={styles.evidence}>{d.evidencias.length} evidencia(s) · {d.registrado_en?.slice(0, 10)}</Text></View>)}</Card>
    </ScrollView>
  </AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 45, gap: 12 }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 6 }, backText: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { flex: 1, minWidth: 100 }, value: { fontSize: 28, fontWeight: '900' }, label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  heading: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 12 }, empty: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  incident: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 }, incidentTitle: { color: colors.textPrimary, fontWeight: '800', marginBottom: 5 },
  evidence: { color: colors.label, fontSize: 10, marginTop: 6 } });
