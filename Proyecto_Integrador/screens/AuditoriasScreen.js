import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage, endpoints } from '../services/api';
import {
  colors,
  PageHeading,
  Card,
  SearchBar,
  StatusBadge,
  ConfirmModal,
} from '../components/ScreenUI';

const initialAudits = [
  {
    id: 10,
    nombre: 'Auditoría de Control #10',
    descripcion: 'Revisión de inventario general de activos fijos.',
    fechaProgramada: '2026-05-21',
    creado: '2026-05-30',
    responsable: 'Eduardo',
    estado: 'Completada',
    avance: '6/6',
  },
  {
    id: 7,
    nombre: 'Auditoría de Control #7',
    descripcion: 'Revisión de inventario general de activos fijos.',
    fechaProgramada: '2026-06-18',
    creado: '2026-05-30',
    responsable: 'Eduardo',
    estado: 'En Progreso',
    avance: '2/6',
  },
  {
    id: 3,
    nombre: 'Auditoría de Control #2',
    descripcion: 'Revisión de activos del edificio administrativo.',
    fechaProgramada: '2026-07-10',
    creado: '2026-06-01',
    responsable: 'Ana',
    estado: 'Cancelada',
    avance: '0/6',
  },
];

export default function AuditoriasScreen({ navigation }) {
  const [audits, setAudits] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState(null);
  const { isAdmin } = useAuth();

  const load = useCallback(async () => {
    try {
      const labels = { programada: 'Programada', en_progreso: 'En Progreso', completada: 'Completada', cancelada: 'Cancelada' };
      const data = await endpoints.audits();
      setAudits(data.map((item) => ({ ...item, nombre: item.titulo,
        fechaProgramada: item.fecha_programada?.slice(0, 10) || 'Sin fecha', creado: item.creada_en?.slice(0, 10),
        responsable: `Usuario #${item.responsable_id}`, estado: labels[item.estado] || item.estado,
        avance: `${item.revisados}/${item.total_activos}` })));
    } catch (error) { Alert.alert('No fue posible cargar auditorias', apiErrorMessage(error)); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter((audit) =>
      `${audit.nombre} ${audit.descripcion} ${audit.estado} ${audit.responsable}`
        .toLowerCase()
        .includes(q)
    );
  }, [audits, search]);

  const removeSelected = async () => {
    if (!selectedToDelete) return;
    try { await endpoints.deleteAudit(selectedToDelete.id); setSelectedToDelete(null); await load(); }
    catch (error) { Alert.alert('No fue posible eliminar', apiErrorMessage(error)); }
  };

  const openAudit = async (audit) => {
    try {
      if (audit.estado === 'Programada') await endpoints.startAudit(audit.id);
      navigation.navigate('AuditoriaEnCurso', { auditoria: audit });
    } catch (error) { Alert.alert('No fue posible iniciar', apiErrorMessage(error)); }
  };

  return (
    <AppShell navigation={navigation} title="Auditorías" activeRoute="Auditorias">
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeading
          eyebrow="// CONTROL Y REVISIÓN"
          title="Mis Auditorías"
          subtitle="Gestión, planificación y ejecución de revisiones físicas de activos."
        />

        {isAdmin && <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CrearAuditoria')}
        >
          <Ionicons name="add" size={19} color="#FFFFFF" />
          <Text style={styles.createText}>Crear auditoría</Text>
        </TouchableOpacity>}

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar auditoría..."
          onClear={() => setSearch('')}
        />

        {filtered.map((audit) => (
          <Card key={audit.id}>
            <View style={styles.topRow}>
              <View style={styles.titleBody}>
                <Text style={styles.auditId}>ID {audit.id}</Text>
                <Text style={styles.auditName}>{audit.nombre}</Text>
              </View>
              <StatusBadge status={audit.estado} />
            </View>

            <Text style={styles.description}>{audit.descripcion}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>FECHA PROGRAMADA</Text>
                <Text style={styles.infoValue}>{audit.fechaProgramada}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>RESPONSABLE</Text>
                <Text style={styles.infoValue}>{audit.responsable}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>AVANCE</Text>
                <Text style={styles.infoValue}>{audit.avance}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              {audit.estado === 'Completada' && (
                <TouchableOpacity
                  style={styles.resultButton}
                  onPress={() =>
                    navigation.navigate('ResultadosAuditoria', { auditoria: audit })
                  }
                >
                  <Ionicons name="bar-chart-outline" size={16} color={colors.blue} />
                  <Text style={styles.resultText}>Resultados</Text>
                </TouchableOpacity>
              )}

              {['Programada', 'En Progreso'].includes(audit.estado) && (
                <>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => openAudit(audit)}
                  >
                    <Ionicons name="play" size={15} color="#FFFFFF" />
                    <Text style={styles.startText}>{audit.estado === 'Programada' ? 'Iniciar' : 'Continuar'}</Text>
                  </TouchableOpacity>

                  {isAdmin && <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() =>
                      navigation.navigate('EditarAuditoria', { auditoria: audit })
                    }
                  >
                    <Ionicons name="create-outline" size={17} color={colors.blue} />
                  </TouchableOpacity>}
                </>
              )}

              {audit.estado === 'Cancelada' && (
                <TouchableOpacity
                  style={styles.resultButton}
                  onPress={() =>
                    navigation.navigate('DetalleAuditoria', { auditoria: audit })
                  }
                >
                  <Ionicons name="eye-outline" size={16} color={colors.blue} />
                  <Text style={styles.resultText}>Detalles</Text>
                </TouchableOpacity>
              )}

              {isAdmin && <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setSelectedToDelete(audit)}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </TouchableOpacity>}
            </View>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card>
            <Text style={styles.empty}>No se encontraron auditorías.</Text>
          </Card>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!selectedToDelete}
        title="Confirmar eliminación"
        message="Esta acción es permanente. Se eliminará la auditoría y todo el detalle de activos asociados."
        confirmText="Eliminar definitivamente"
        confirmIcon="trash-outline"
        danger
        onConfirm={removeSelected}
        onCancel={() => setSelectedToDelete(null)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 42,
  },
  createButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.accent,
    borderRadius: 9,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  createText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBody: {
    flex: 1,
  },
  auditId: {
    color: colors.label,
    fontSize: 10,
    fontWeight: '700',
  },
  auditName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 15,
  },
  infoBlock: {
    flexGrow: 1,
    flexBasis: 95,
    borderRadius: 9,
    backgroundColor: colors.background,
    padding: 10,
  },
  infoLabel: {
    color: colors.label,
    fontSize: 8,
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },
  resultButton: {
    flex: 1,
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C9DDFB',
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
  },
  resultText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '800',
  },
  startButton: {
    flex: 1,
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  iconButton: {
    width: 42,
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9DDFB',
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
  },
  deleteButton: {
    width: 42,
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3C6C6',
    borderRadius: 8,
    backgroundColor: colors.dangerSoft,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
