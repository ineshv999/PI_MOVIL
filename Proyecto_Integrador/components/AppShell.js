import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const colors = {
  headerBg: '#FFFFFF',
  border: '#E5E8E6',
  textPrimary: '#111827',
  accent: '#22C55E',
};

// Envuelve cualquier pantalla con el header (☰ + título + badge) y el Sidebar.
// Uso:
//   <AppShell navigation={navigation} title="Auditorías" activeRoute="Auditorias">
//     ...contenido de la pantalla...
//   </AppShell>
export default function AppShell({
  navigation,
  title,
  activeRoute,
  children,
}) {
  const { user, logout } = useAuth();
  const userName = user ? `${user.nombres} ${user.apellidos}` : 'Usuario';
  const userRole = user?.rol?.toUpperCase() || 'USUARIO';
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSidebarVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarBadgeText}>{initials}</Text>
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeRoute={activeRoute}
        userName={userName}
        userRole={userRole}
        onLogout={async () => { await logout(); navigation?.reset({ index: 0, routes: [{ name: 'Login' }] }); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.headerBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  avatarBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  avatarBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  content: { flex: 1 },
});
