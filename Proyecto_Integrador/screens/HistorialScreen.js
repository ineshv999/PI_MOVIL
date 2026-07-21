import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, SearchBar, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function HistorialScreen({ navigation }) {
  const [audits, setAudits] = useState([]); const [search, setSearch] = useState('');
  useFocusEffect(useCallback(() => { endpoints.audits().then((rows) => setAudits(rows.filter((a) => ['completada', 'cancelada'].includes(a.estado))))
    .catch((e) => Alert.alert('No fue posible cargar historial', apiErrorMessage(e))); }, []));
  const filtered = useMemo(() => audits.filter((a) => `${a.titulo} ${a.descripcion}`.toLowerCase().includes(search.toLowerCase())), [audits, search]);
  return <AppShell navigation={navigation} title="Historial" activeRoute="Historial"><ScrollView contentContainerStyle={styles.content}>
    <PageHeading eyebrow="// TRAZABILIDAD" title="Historial de auditorias" subtitle="Auditorias cerradas registradas en la base de datos." />
    <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar..." onClear={() => setSearch('')} />
    {filtered.map((a) => <Card key={a.id}><Text style={styles.title}>{a.titulo}</Text><StatusBadge status={a.estado === 'completada' ? 'Completada' : 'Cancelada'} />
      <Text style={styles.text}>{a.descripcion || 'Sin descripcion'}</Text><Text style={styles.meta}>{a.revisados}/{a.total_activos} revisados · {a.incidencias} incidencias</Text></Card>)}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 42 }, title: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  text: { color: colors.textSecondary, marginTop: 10, fontSize: 12 }, meta: { color: colors.label, marginTop: 8, fontSize: 10 } });
