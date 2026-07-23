import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiErrorMessage, endpoints } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { colors, PageHeading, Card, SearchBar, StatusBadge } from '../components/ScreenUI';

export default function GestionarUsuariosScreen({ navigation }) {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers((await endpoints.users()).map((item) => ({
        ...item,
        name: `${item.nombres} ${item.apellidos}`,
        role: ({ administrador: 'Administrador', auditor: 'Auditor', usuario: 'Usuario' })[item.rol] || item.rol,
        status: item.activo ? 'Activo' : 'Inactivo',
      })));
    } catch (error) { Alert.alert('No fue posible cargar usuarios', apiErrorMessage(error)); }
  }, []);
  useFocusEffect(useCallback(() => { if (isAdmin) load(); }, [isAdmin, load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? users.filter((item) => `${item.name} ${item.username} ${item.role}`.toLowerCase().includes(q)) : users;
  }, [search, users]);

  const remove = async (purge = false) => {
    if (!pendingDelete || !isAdmin || pendingDelete.id === currentUser?.id) return;
    try {
      setDeleting(true);
      await (purge ? endpoints.purgeUser(pendingDelete.id) : endpoints.deleteUser(pendingDelete.id));
      setPendingDelete(null);
      await load();
    } catch (error) { Alert.alert('No fue posible eliminar el acceso', apiErrorMessage(error)); }
    finally { setDeleting(false); }
  };

  return <AppShell navigation={navigation} title="Gestionar usuarios" activeRoute="GestionarUsuarios">
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeading eyebrow="// ADMINISTRACIÓN" title="Gestionar usuarios" subtitle="Consulta y administra las cuentas registradas en el sistema." />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar usuario..." onClear={() => setSearch('')} />
      {filtered.map((item) => <Card key={item.id}>
        <View style={styles.header}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}</Text></View>
          <View style={styles.userBody}><Text style={styles.userName}>{item.name}</Text><Text style={styles.username}>@{item.username}</Text></View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.roleRow}><Ionicons name="shield-checkmark-outline" size={17} color={colors.blue} /><Text style={styles.role}>{item.role}</Text></View>
        {item.id === currentUser?.id
          ? <View style={styles.currentAccount}><Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} /><Text style={styles.currentText}>Cuenta actual protegida</Text></View>
          : isAdmin && item.activo && <TouchableOpacity style={styles.deleteButton} onPress={() => setPendingDelete(item)}><Ionicons name="trash-outline" size={17} color={colors.danger} /><Text style={styles.deleteText}>Eliminar acceso</Text></TouchableOpacity>}
      </Card>)}
    </ScrollView>
    <Modal visible={!!pendingDelete} transparent animationType="fade" onRequestClose={() => !deleting && setPendingDelete(null)}>
      <View style={styles.overlay}><View style={styles.modalCard}>
        <View style={styles.warningCircle}><Ionicons name="warning-outline" size={42} color={colors.danger} /></View>
        <Text style={styles.modalTitle}>Confirmar eliminación</Text>
        <Text style={styles.modalText}>Eliminar acceso oculta la cuenta y bloquea el inicio de sesión, conservando auditorías e historial. La purga elimina toda referencia y no se puede deshacer.</Text>
        <TouchableOpacity disabled={deleting} style={styles.safeDelete} onPress={() => remove(false)}><Ionicons name="person-remove-outline" size={21} color={colors.danger} /><Text style={styles.safeDeleteText}>{deleting ? 'Procesando...' : 'Eliminar acceso y conservar historial'}</Text></TouchableOpacity>
        <TouchableOpacity disabled={deleting} style={styles.confirmDelete} onPress={() => remove(true)}><Ionicons name="warning-outline" size={21} color="#fff" /><Text style={styles.confirmText}>Borrar toda existencia</Text></TouchableOpacity>
        <TouchableOpacity disabled={deleting} style={styles.cancelButton} onPress={() => setPendingDelete(null)}><Ionicons name="arrow-back" size={21} color={colors.textSecondary} /><Text style={styles.cancelText}>Regresar</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </AppShell>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  userBody: { flex: 1 }, userName: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  username: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 13 },
  role: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  deleteButton: { minHeight: 42, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#F3C6C6', borderRadius: 9, backgroundColor: colors.dangerSoft },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  currentAccount: { marginTop: 14, minHeight: 42, borderRadius: 9, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  currentText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(8,15,13,.68)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 610, backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center' },
  warningCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { color: '#111827', fontSize: 27, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
  modalText: { color: '#667085', fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 26 },
  bold: { color: '#111827', fontWeight: '800' },
  confirmDelete: { width: '100%', minHeight: 62, borderRadius: 14, backgroundColor: colors.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  safeDelete: { width: '100%', minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: '#F3C6C6', marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, safeDeleteText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cancelButton: { width: '100%', minHeight: 58, borderWidth: 1, borderColor: '#D9DEDB', borderRadius: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cancelText: { color: '#667085', fontSize: 16, fontWeight: '800' },
});
