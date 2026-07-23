import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StatusBar, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { downloadWithAuth } from '../services/api';

const defaultProfile = require('../assets/default-profile.jpg');
const blobDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

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
  const [profileSource, setProfileSource] = useState(defaultProfile);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.foto_url) { if (active) setProfileSource(defaultProfile); return; }
      try {
        const dataUrl = await blobDataUrl(await downloadWithAuth('/auth/me/foto'));
        if (active) setProfileSource({ uri: dataUrl });
      } catch {
        if (active) setProfileSource(defaultProfile);
      }
    })();
    return () => { active = false; };
  }, [user?.id, user?.foto_url]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.headerBg} translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSidebarVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('EditarPerfil')}><Image source={profileSource} style={styles.headerAvatar} onError={() => setProfileSource(defaultProfile)} /></TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>{children}</KeyboardAvoidingView>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeRoute={activeRoute}
        userName={userName}
        userRole={userRole}
        profileSource={profileSource}
        onProfile={() => { setSidebarVisible(false); navigation?.navigate('EditarPerfil'); }}
        onLogout={async () => { await logout(); navigation?.reset({ index: 0, routes: [{ name: 'Login' }] }); }}
      />
    </SafeAreaView>
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
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.accent },
  content: { flex: 1 },
});
