import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---- Design tokens ----
const colors = {
  background: '#0B0F0E',
  surface: '#15181A',
  border: '#23282A',
  textPrimary: '#F2F4F3',
  textSecondary: '#8A9490',
  accent: '#22C55E',
  accentSoft: '#173321',
};

const monospace = 'monospace';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(300, SCREEN_WIDTH * 0.78);

const PRINCIPAL_ITEMS = [
  { key: 'Dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'Historial', label: 'Historial de auditorías', icon: 'time-outline' },
  { key: 'Escanear', label: 'Escanear activo', icon: 'qr-code-outline' },
];

const GESTION_ITEMS = [
  { key: 'RegistrarUsuario', label: 'Registrar usuario', icon: 'person-add-outline' },
  { key: 'RegistrarActivo', label: 'Registrar activo', icon: 'add-circle-outline' },
  { key: 'GestionarUsuarios', label: 'Gestionar usuarios', icon: 'create-outline' },
  { key: 'InventarioGeneral', label: 'Inventario general', icon: 'apps-outline' },
  { key: 'Auditorias', label: 'Auditorías', icon: 'shield-checkmark-outline' },
];

export default function Sidebar({
  visible,
  onClose,
  navigation,
  activeRoute = 'Dashboard',
  userName = 'Ines',
  userRole = 'ADMIN',
  profileSource,
  onProfile,
  onLogout,
}) {
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -PANEL_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
    Animated.timing(backdropOpacity, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleNavigate = (item) => {
    onClose?.();
    navigation?.navigate(item.key);
  };
  const isAdmin = userRole === 'ADMINISTRADOR';
  const managementItems = isAdmin
    ? GESTION_ITEMS
    : GESTION_ITEMS.filter((item) => ['InventarioGeneral', 'Auditorias'].includes(item.key));

  const renderItem = (item) => {
    const isActive = activeRoute === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.item, isActive && styles.itemActive]}
        onPress={() => handleNavigate(item)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.icon}
          size={18}
          color={isActive ? colors.accent : colors.textSecondary}
          style={styles.itemIcon}
        />
        <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          { width: PANEL_WIDTH, transform: [{ translateX }] },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="cube-outline" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.brandName}>SGAFAQ</Text>
              <Text style={styles.brandSubtitle}>ACTIVOS FIJOS · QR</Text>
            </View>
          </View>

          {/* User */}
          <TouchableOpacity style={styles.userRow} onPress={onProfile} activeOpacity={0.75}>
            <View style={styles.avatar}>
              {profileSource
                ? <Image source={profileSource} style={styles.avatarImage} />
                : <Ionicons name="person" size={18} color={colors.textSecondary} />}
            </View>
            <View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userRole}>// {userRole}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>// PRINCIPAL</Text>
          <View style={styles.section}>{PRINCIPAL_ITEMS.map(renderItem)}</View>

          <Text style={styles.sectionLabel}>// GESTIÓN</Text>
          <View style={styles.section}>{managementItems.map(renderItem)}</View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => {
              onClose?.();
              onLogout?.();
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={colors.textSecondary}
              style={styles.itemIcon}
            />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  brandSubtitle: {
    fontFamily: monospace,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.accent,
    marginTop: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  userName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  userRole: {
    fontFamily: monospace,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.accent,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: monospace,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  section: { marginBottom: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  itemActive: { backgroundColor: colors.accentSoft },
  itemIcon: { marginRight: 12, width: 18 },
  itemLabel: { fontSize: 14, color: colors.textSecondary },
  itemLabelActive: { color: colors.textPrimary, fontWeight: '600' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  logoutRow: { flexDirection: 'row', alignItems: 'center' },
  logoutText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
