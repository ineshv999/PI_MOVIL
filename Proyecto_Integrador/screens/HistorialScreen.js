import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppShell from '../components/AppShell';
import { Card, colors, PageHeading, SearchBar, StatusBadge } from '../components/ScreenUI';
import { apiErrorMessage, endpoints } from '../services/api';

export default function HistorialScreen({ navigation }) {
  const [audits, setAudits] = useState([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    endpoints.audits()
      .then((rows) => setAudits(rows.filter((audit) => ['completada', 'cancelada'].includes(audit.estado))))
      .catch((error) => Alert.alert('No fue posible cargar el historial', apiErrorMessage(error)));
  }, []));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return audits.filter((audit) =>
      `${audit.titulo} ${audit.descripcion || ''} ${audit.responsable_nombre || ''}`.toLowerCase().includes(term));
  }, [audits, search]);

  const openAudit = (audit) => {
    navigation.navigate(
      audit.estado === 'completada' ? 'ResultadosAuditoria' : 'DetalleAuditoria',
      { auditoria: audit },
    );
  };

  return (
    <AppShell navigation={navigation} title="Historial" activeRoute="Historial">
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeading
          eyebrow="// TRAZABILIDAD"
          title="Historial de auditorías"
          subtitle="Auditorías completadas y canceladas registradas en el sistema."
        />
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar auditoría..."
          onClear={() => setSearch('')}
        />
        <Text style={styles.section}>Auditorías cerradas</Text>
        {!filtered.length && (
          <Card>
            <Text style={styles.empty}>No hay auditorías cerradas que coincidan con la búsqueda.</Text>
          </Card>
        )}
        {filtered.map((audit) => (
          <Card key={audit.id}>
            <Text style={styles.title}>{audit.titulo}</Text>
            <StatusBadge status={audit.estado === 'completada' ? 'Completada' : 'Cancelada'} />
            <Text style={styles.text}>{audit.descripcion || 'Sin descripción'}</Text>
            <Text style={styles.meta}>
              {audit.revisados}/{audit.total_activos} revisados · {audit.incidencias} incidencias
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => openAudit(audit)}>
              <Text style={styles.buttonText}>
                {audit.estado === 'completada' ? 'Consultar resultados' : 'Consultar detalle'}
              </Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42 },
  title: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  text: { color: colors.textSecondary, marginTop: 10, fontSize: 12 },
  meta: { color: colors.label, marginTop: 8, fontSize: 10 },
  section: { color: colors.textPrimary, fontWeight: '900', fontSize: 16, marginVertical: 12 },
  empty: { color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  button: { marginTop: 13, paddingVertical: 11, borderRadius: 9, backgroundColor: colors.blueSoft, alignItems: 'center' },
  buttonText: { color: colors.blue, fontSize: 12, fontWeight: '800' },
});
