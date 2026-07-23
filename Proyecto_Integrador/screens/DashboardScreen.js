import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, StatusBadge } from '../components/ScreenUI';
import { endpoints } from '../services/api';
import { HorizontalBarChart } from '../components/AuditCharts';

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState({ assets: 0, active: 0, pending: 0, recent: [], reviewed: 0, unchanged: 0, incidents: 0 });
  useFocusEffect(useCallback(() => { (async () => { try {
    const [assets, audits] = await Promise.all([endpoints.assets(), endpoints.audits()]);
    const active = audits.filter((a) => ['programada', 'en_progreso'].includes(a.estado));
    const closed = audits.filter((a) => ['completada', 'cancelada'].includes(a.estado));
    const details = await Promise.all(closed.map((audit) => endpoints.audit(audit.id)));
    const rows = details.flatMap((audit) => audit.detalles);
    const reviewedRows = rows.filter((row) => row.estado_revision === 'revisado');
    const recent = [...active].sort((a, b) => new Date(b.creada_en) - new Date(a.creada_en)).slice(0, 3);
    setData({ assets: assets.length, active: active.length, pending: active.reduce((n, a) => n + a.pendientes, 0), recent,
      reviewed: reviewedRows.length, unchanged: reviewedRows.filter((row) => row.estatus_anterior_id === row.estatus_nuevo_id && !row.tipo_incidencia).length,
      incidents: reviewedRows.filter((row) => row.tipo_incidencia).length });
  } catch { /* Los modulos muestran errores detallados. */ } })(); }, []));
  const metrics = [['Activos registrados', data.assets, 'cube-outline'], ['Auditorias activas', data.active, 'clipboard-outline'], ['Pendientes de revision', data.pending, 'time-outline']];
  return <AppShell navigation={navigation} title="Dashboard" activeRoute="Dashboard"><ScrollView contentContainerStyle={styles.content}>
    <PageHeading eyebrow="// PANEL PRINCIPAL" title="Dashboard" subtitle="Resumen en tiempo real del inventario y las auditorias." />
    <View style={styles.grid}>{metrics.map(([label, value, icon]) => <Card key={label} style={styles.metric}>
      <Ionicons name={icon} size={23} color={colors.accentDark} /><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></Card>)}</View>
    <Card><HorizontalBarChart title="Resumen de auditorías" subtitle="Resultados acumulados de las auditorías cerradas." totalLabel="revisados" totalValue={data.reviewed} items={[
      { label: 'Activos revisados', value: data.reviewed, color: colors.blue }, { label: 'Sin cambios · todo correcto', value: data.unchanged, color: colors.accent }, { label: 'Con incidencias', value: data.incidents, color: colors.danger },
    ]} /></Card>
    <Card><Text style={styles.heading}>Acciones rapidas</Text>
      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Auditorias')}><Ionicons name="clipboard-outline" size={21} color={colors.blue} /><Text style={styles.actionText}>Ver auditorias</Text></TouchableOpacity>
      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Escanear')}><Ionicons name="qr-code-outline" size={21} color={colors.accentDark} /><Text style={styles.actionText}>Consultar activo por QR</Text></TouchableOpacity>
    </Card>
    {data.recent.length > 0 && <Card><Text style={styles.heading}>Auditorias recientes</Text>{data.recent.map((audit) => <View key={audit.id} style={styles.recentItem}>
      <View style={styles.row}><Text style={styles.audit}>{audit.titulo}</Text><StatusBadge status={audit.estado === 'programada' ? 'Programada' : 'En Progreso'} /></View>
      <Text style={styles.label}>{audit.revisados} de {audit.total_activos} revisados</Text>
    </View>)}<TouchableOpacity style={styles.continue} onPress={() => navigation.navigate('Auditorias')}><Text style={styles.continueText}>Ver auditorias</Text></TouchableOpacity></Card>}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 42 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { flex: 1, minWidth: 105 },
  value: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', marginTop: 10 }, label: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  heading: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 12 }, action: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { color: colors.textPrimary, fontWeight: '700' }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, audit: { color: colors.textPrimary, fontWeight: '800', fontSize: 16, flex: 1 }, recentItem: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 },
  continue: { backgroundColor: colors.accent, padding: 12, borderRadius: 9, marginTop: 14, alignItems: 'center' }, continueText: { color: '#fff', fontWeight: '800' } });
