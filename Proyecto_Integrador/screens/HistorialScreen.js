import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, SearchBar, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function HistorialScreen({ navigation }) {
  const [audits, setAudits] = useState([]); const [movements, setMovements] = useState([]); const [search, setSearch] = useState('');
  useFocusEffect(useCallback(() => { Promise.all([endpoints.audits(), endpoints.movements()]).then(([rows, history]) => { setAudits(rows.filter((a) => ['completada', 'cancelada'].includes(a.estado))); setMovements(history); })
    .catch((e) => Alert.alert('No fue posible cargar historial', apiErrorMessage(e))); }, []));
  const filtered = useMemo(() => audits.filter((a) => `${a.titulo} ${a.descripcion}`.toLowerCase().includes(search.toLowerCase())), [audits, search]);
  return <AppShell navigation={navigation} title="Historial" activeRoute="Historial"><ScrollView contentContainerStyle={styles.content}>
    <PageHeading eyebrow="// TRAZABILIDAD" title="Historial de auditorias" subtitle="Auditorias cerradas registradas en la base de datos." />
    <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar..." onClear={() => setSearch('')} />
    <Text style={styles.section}>Movimientos de activos</Text>{movements.filter((m) => `${m.activo} ${m.folio} ${m.resumen}`.toLowerCase().includes(search.toLowerCase())).map((m) => <Card key={`m-${m.id}`}><Text style={styles.title}>{m.activo}</Text><Text style={styles.folio}>{m.folio}</Text><StatusBadge status={m.accion === 'retiro' ? 'Dado de baja' : m.accion === 'alta' ? 'Alta' : 'Edición'} /><Text style={styles.text}>{m.resumen}</Text><Text style={styles.meta}>{m.editor} · {m.creado_en?.slice(0, 10)}</Text></Card>)}
    <Text style={styles.section}>Auditorías cerradas</Text>
    {filtered.map((a) => <Card key={a.id}><Text style={styles.title}>{a.titulo}</Text><StatusBadge status={a.estado === 'completada' ? 'Completada' : 'Cancelada'} />
      <Text style={styles.text}>{a.descripcion || 'Sin descripcion'}</Text><Text style={styles.meta}>{a.revisados}/{a.total_activos} revisados · {a.incidencias} incidencias</Text></Card>)}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 42 }, title: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  text: { color: colors.textSecondary, marginTop: 10, fontSize: 12 }, meta: { color: colors.label, marginTop: 8, fontSize: 10 }, section: { color: colors.textPrimary, fontWeight: '900', fontSize: 16, marginVertical: 12 }, folio: { color: colors.blue, fontWeight: '800', marginBottom: 7 } });
