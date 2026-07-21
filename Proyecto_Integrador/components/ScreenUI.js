import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export const colors = {
  background: '#F3F5F4',
  card: '#FFFFFF',
  border: '#E5E8E6',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  label: '#8A9490',
  placeholder: '#9CA3AF',

  accent: '#22C55E',
  accentDark: '#16A34A',
  accentSoft: '#E7F8EE',

  blue: '#2563EB',
  blueSoft: '#E8F1FF',

  warning: '#D97706',
  warningSoft: '#FFF7E6',

  danger: '#DC2626',
  dangerSoft: '#FDECEC',
};

/* =========================================================
   ENCABEZADO DE PANTALLA
========================================================= */

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}) {
  return (
    <View style={styles.heading}>
      {eyebrow ? (
        <Text style={styles.eyebrow}>
          {eyebrow}
        </Text>
      ) : null}

      <Text style={styles.title}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* =========================================================
   TARJETA
========================================================= */

export function Card({
  children,
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

/* =========================================================
   FILA DE INFORMACIÓN
========================================================= */

export function InfoRow({
  label,
  value,
  last = false,
  valueStyle,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.infoRowLast,
      ]}
    >
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   ETIQUETA DE ESTADO
========================================================= */

export function StatusBadge({
  status,
}) {
  const normalized = String(status || '').toLowerCase();

  let containerStyle = styles.badgeNeutral;
  let textStyle = styles.badgeTextNeutral;

  if (normalized.includes('complet')) {
    containerStyle = styles.badgeSuccess;
    textStyle = styles.badgeTextSuccess;
  } else if (normalized.includes('progreso')) {
    containerStyle = styles.badgeBlue;
    textStyle = styles.badgeTextBlue;
  } else if (normalized.includes('cancel')) {
    containerStyle = styles.badgeDanger;
    textStyle = styles.badgeTextDanger;
  } else if (normalized.includes('pend')) {
    containerStyle = styles.badgeWarning;
    textStyle = styles.badgeTextWarning;
  } else if (normalized.includes('activo')) {
    containerStyle = styles.badgeSuccess;
    textStyle = styles.badgeTextSuccess;
  } else if (normalized.includes('inactivo')) {
    containerStyle = styles.badgeDanger;
    textStyle = styles.badgeTextDanger;
  }

  return (
    <View
      style={[
        styles.badge,
        containerStyle,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          textStyle,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

/* =========================================================
   BOTÓN PRINCIPAL
========================================================= */

export function PrimaryButton({
  title,
  icon = 'checkmark-circle-outline',
  onPress,
  disabled = false,
  style,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={19}
        color="#FFFFFF"
      />

      <Text style={styles.primaryButtonText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   BOTÓN SECUNDARIO
========================================================= */

export function SecondaryButton({
  title,
  icon = 'arrow-back-outline',
  onPress,
  danger = false,
  style,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.secondaryButton,
        danger && styles.secondaryDanger,
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          danger
            ? colors.danger
            : colors.textSecondary
        }
      />

      <Text
        style={[
          styles.secondaryButtonText,
          danger && styles.secondaryDangerText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   CAMPO DE FORMULARIO
========================================================= */

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textSecondary}
            style={
              multiline
                ? styles.multilineIcon
                : null
            }
          />
        ) : null}

        <TextInput
          style={[
            styles.input,
            multiline && styles.textArea,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          textAlignVertical={
            multiline
              ? 'top'
              : 'center'
          }
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
        />
      </View>
    </View>
  );
}

/* =========================================================
   BARRA DE BÚSQUEDA
========================================================= */

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onClear,
}) {
  return (
    <View style={styles.searchBar}>
      <Ionicons
        name="search-outline"
        size={18}
        color={colors.accent}
      />

      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
      />

      {value ? (
        <TouchableOpacity
          onPress={onClear}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.placeholder}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* =========================================================
   MODAL DE CONFIRMACIÓN
========================================================= */

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  confirmIcon = 'checkmark-circle-outline',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View
            style={[
              styles.modalIcon,
              danger
                ? styles.modalIconDanger
                : styles.modalIconSuccess,
            ]}
          >
            <Ionicons
              name={
                danger
                  ? 'warning-outline'
                  : 'checkmark-circle-outline'
              }
              size={28}
              color={
                danger
                  ? colors.danger
                  : colors.accentDark
              }
            />
          </View>

          <Text style={styles.modalTitle}>
            {title}
          </Text>

          <Text style={styles.modalMessage}>
            {message}
          </Text>

          <PrimaryButton
            title={confirmText}
            icon={confirmIcon}
            onPress={onConfirm}
            style={
              danger
                ? styles.dangerConfirm
                : null
            }
          />

          <SecondaryButton
            title="Regresar"
            icon="arrow-back-outline"
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const styles = StyleSheet.create({
  heading: {
    marginBottom: 18,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
    marginBottom: 7,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,

    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoLabel: {
    flex: 0.42,
    color: colors.label,
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: '700',
  },

  infoValue: {
    flex: 0.58,
    color: colors.textPrimary,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 18,
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  badgeNeutral: {
    backgroundColor: colors.background,
  },

  badgeSuccess: {
    backgroundColor: colors.accentSoft,
  },

  badgeBlue: {
    backgroundColor: colors.blueSoft,
  },

  badgeDanger: {
    backgroundColor: colors.dangerSoft,
  },

  badgeWarning: {
    backgroundColor: colors.warningSoft,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  badgeTextNeutral: {
    color: colors.textSecondary,
  },

  badgeTextSuccess: {
    color: colors.accentDark,
  },

  badgeTextBlue: {
    color: colors.blue,
  },

  badgeTextDanger: {
    color: colors.danger,
  },

  badgeTextWarning: {
    color: colors.warning,
  },

  primaryButton: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  disabledButton: {
    opacity: 0.45,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 9,
  },

  secondaryDanger: {
    borderColor: '#F4C7C7',
    backgroundColor: colors.dangerSoft,
  },

  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  secondaryDangerText: {
    color: colors.danger,
  },

  fieldBlock: {
    marginBottom: 15,
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.65,
    fontWeight: '800',
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },

  inputContainerMultiline: {
    minHeight: 112,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  inputContainerDisabled: {
    opacity: 0.6,
  },

  multilineIcon: {
    marginTop: 1,
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 11,
  },

  textArea: {
    minHeight: 95,
  },

  searchBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 15, 13, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },

  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },

  modalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },

  modalIconSuccess: {
    backgroundColor: colors.accentSoft,
  },

  modalIconDanger: {
    backgroundColor: colors.dangerSoft,
  },

  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  modalMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },

  dangerConfirm: {
    backgroundColor: colors.danger,
  },
});