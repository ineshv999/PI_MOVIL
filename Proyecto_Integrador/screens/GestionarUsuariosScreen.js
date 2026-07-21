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
import { apiErrorMessage, endpoints } from '../services/api';
import AppShell from '../components/AppShell';
import {
  colors,
  PageHeading,
  Card,
  SearchBar,
  StatusBadge,
} from '../components/ScreenUI';

const initialUsers = [
  { id: 1, name: 'Inés Hernández', username: 'ines', role: 'Administrador', status: 'Activo' },
  { id: 2, name: 'Eduardo Barrón', username: 'eduardo', role: 'Auditor', status: 'Activo' },
  { id: 3, name: 'Ana Francisco', username: 'ana', role: 'Auditor', status: 'Inactivo' },
];

export default function GestionarUsuariosScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    try { setUsers((await endpoints.users()).map((item) => ({ ...item, name: `${item.nombres} ${item.apellidos}`,
      role: item.rol === 'administrador' ? 'Administrador' : 'Auditor', status: item.activo ? 'Activo' : 'Inactivo' }))); }
    catch (error) { Alert.alert('No fue posible cargar usuarios', apiErrorMessage(error)); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      `${user.name} ${user.username} ${user.role}`.toLowerCase().includes(q)
    );
  }, [search, users]);

  const remove = (user) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Deseas eliminar a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => { try { await endpoints.setUserActive(user.id, false); await load(); }
            catch (error) { Alert.alert('No fue posible desactivar', apiErrorMessage(error)); } },
        },
      ]
    );
  };

  return (
    <AppShell
      navigation={navigation}
      title="Gestionar usuarios"
      activeRoute="GestionarUsuarios"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeading
          eyebrow="// ADMINISTRACIÓN"
          title="Gestionar usuarios"
          subtitle="Consulta y administra las cuentas registradas en el sistema."
        />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar usuario..."
          onClear={() => setSearch('')}
        />

        {filtered.map((user) => (
          <Card key={user.id}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')}
                </Text>
              </View>

              <View style={styles.userBody}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.username}>@{user.username}</Text>
              </View>

              <StatusBadge status={user.status} />
            </View>

            <View style={styles.roleRow}>
              <Ionicons name="shield-checkmark-outline" size={17} color={colors.blue} />
              <Text style={styles.role}>{user.role}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => Alert.alert('Editar', 'Interfaz preparada para edición.')}
              >
                <Ionicons name="create-outline" size={17} color={colors.blue} />
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => remove(user)}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  userBody: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  username: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 14,
    paddingTop: 13,
  },
  role: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C9DDFB',
    borderRadius: 9,
    backgroundColor: colors.blueSoft,
  },
  deleteButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3C6C6',
    borderRadius: 9,
    backgroundColor: colors.dangerSoft,
  },
  editText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  deleteText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
});
