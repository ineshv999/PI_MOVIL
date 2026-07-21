import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, StatusBadge } from '../components/ScreenUI';
import { endpoints } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState({ assets: 0, active: 0, pending: 0, recent: null });
  useFocusEffect(useCallback(() => { (async () => { try {
    const [assets, audits] = await Promise.all([endpoints.assets(), endpoints.audits()]);
    const active = audits.filter((a) => ['programada', 'en_progreso'].includes(a.estado));
    setData({ assets: assets.length, active: active.length, pending: active.reduce((n, a) => n + a.pendientes, 0), recent: active[0] || null });
  } catch { /* Los modulos muestran errores detallados. */ } })(); }, []));
  const metrics = [['Activos registrados', data.assets, 'cube-outline'], ['Auditorias activas', data.active, 'clipboard-outline'], ['Pendientes de revision', data.pending, 'time-outline']];
  return <AppShell navigation={navigation} title="Dashboard" activeRoute="Dashboard"><ScrollView contentContainerStyle={styles.content}>
    <PageHeading eyebrow="// PANEL PRINCIPAL" title="Dashboard" subtitle="Resumen en tiempo real del inventario y las auditorias." />
    <View style={styles.grid}>{metrics.map(([label, value, icon]) => <Card key={label} style={styles.metric}>
      <Ionicons name={icon} size={23} color={colors.accentDark} /><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></Card>)}</View>
    <Card><Text style={styles.heading}>Acciones rapidas</Text>
      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Auditorias')}><Ionicons name="clipboard-outline" size={21} color={colors.blue} /><Text style={styles.actionText}>Ver auditorias</Text></TouchableOpacity>
      <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Escanear')}><Ionicons name="qr-code-outline" size={21} color={colors.accentDark} /><Text style={styles.actionText}>Consultar activo por QR</Text></TouchableOpacity>
    </Card>
    {data.recent && <Card><View style={styles.row}><Text style={styles.heading}>Auditoria reciente</Text><StatusBadge status={data.recent.estado === 'programada' ? 'Programada' : 'En Progreso'} /></View>
      <Text style={styles.audit}>{data.recent.titulo}</Text><Text style={styles.label}>{data.recent.revisados} de {data.recent.total_activos} revisados</Text>
      <TouchableOpacity style={styles.continue} onPress={() => navigation.navigate('Auditorias')}><Text style={styles.continueText}>Abrir auditoria</Text></TouchableOpacity></Card>}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 42 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { flex: 1, minWidth: 105 },
  value: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', marginTop: 10 }, label: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  heading: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 12 }, action: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { color: colors.textPrimary, fontWeight: '700' }, row: { flexDirection: 'row', justifyContent: 'space-between' }, audit: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  continue: { backgroundColor: colors.accent, padding: 12, borderRadius: 9, marginTop: 14, alignItems: 'center' }, continueText: { color: '#fff', fontWeight: '800' } });
