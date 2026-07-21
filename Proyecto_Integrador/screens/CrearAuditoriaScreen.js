import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AppShell from '../components/AppShell';
import { apiErrorMessage, endpoints } from '../services/api';

const colors = {
  background: '#F3F5F4',
  card: '#FFFFFF',
  border: '#E5E8E6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
  accent: '#22C55E',
  accentDark: '#16A34A',
  danger: '#EF4444',
};

const monospace = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export default function CrearAuditoriaScreen({
  navigation,
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaProgramada, setFechaProgramada] =
    useState('');
  const [responsable, setResponsable] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [users, setUsers] = useState([]);
  useEffect(() => { endpoints.users().then(setUsers).catch(() => {}); }, []);

  const limpiarFormulario = () => {
    setNombre('');
    setDescripcion('');
    setFechaProgramada('');
    setResponsable('');
    setUbicacion('');
  };

  const formularioValido = () => {
    return (
      nombre.trim() !== '' &&
      descripcion.trim() !== '' &&
      fechaProgramada.trim() !== '' &&
      responsable.trim() !== ''
    );
  };

  const handleGuardar = async () => {
    if (!formularioValido()) {
      Alert.alert(
        'Campos incompletos',
        'Completa el nombre, la descripción, la fecha y el responsable.'
      );

      return;
    }

    const query = responsable.trim().toLowerCase();
    const responsible = users.find((u) => String(u.id) === query || u.username.toLowerCase() === query || `${u.nombres} ${u.apellidos}`.toLowerCase() === query);
    if (!responsible) { Alert.alert('Responsable no encontrado', 'Escribe el ID, usuario o nombre completo de un usuario registrado.'); return; }
    try {
      const assets = await endpoints.assets();
      await endpoints.createAudit({ titulo: nombre.trim(), descripcion: `${descripcion.trim()}${ubicacion.trim() ? ` · ${ubicacion.trim()}` : ''}`,
        responsable_id: responsible.id, fecha_programada: `${fechaProgramada.trim()}T09:00:00-06:00`, activo_ids: assets.filter((a) => a.activo).map((a) => a.id) });
    } catch (error) { Alert.alert('No fue posible crear', apiErrorMessage(error)); return; }

    Alert.alert(
      'Auditoría creada',
      'La auditoría se registró correctamente.',
      [
        {
          text: 'Aceptar',
          onPress: () => {
            limpiarFormulario();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCancelar = () => {
    navigation.goBack();
  };

  return (
    <AppShell
      navigation={navigation}
      title="Crear auditoría"
      activeRoute="Auditorias"
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.card}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancelar}
          activeOpacity={0.75}
        >
          <Ionicons
            name="arrow-back"
            size={19}
            color={colors.textSecondary}
          />

          <Text style={styles.backButtonText}>
            Regresar a auditorías
          </Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>
          // NUEVA AUDITORÍA
        </Text>

        <Text style={styles.title}>
          Crear auditoría
        </Text>

        <Text style={styles.subtitle}>
          Registra la información necesaria para programar
          una nueva revisión de activos.
        </Text>

        <View style={styles.card}>
          <FormLabel text="NOMBRE DE LA AUDITORÍA *" />

          <View style={styles.inputContainer}>
            <Ionicons
              name="clipboard-outline"
              size={18}
              color={colors.textSecondary}
            />

            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Auditoría de inventario"
              placeholderTextColor={colors.placeholder}
              maxLength={100}
            />
          </View>

          <FormLabel text="DESCRIPCIÓN *" />

          <TextInput
            style={[
              styles.inputContainer,
              styles.textArea,
            ]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe el objetivo y alcance de la auditoría"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />

          <Text style={styles.characterCounter}>
            {descripcion.length}/500
          </Text>

          <FormLabel text="FECHA PROGRAMADA *" />

          <View style={styles.inputContainer}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.textSecondary}
            />

            <TextInput
              style={styles.input}
              value={fechaProgramada}
              onChangeText={setFechaProgramada}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.placeholder}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>

          <Text style={styles.helperText}>
            Ejemplo: 2026-07-20
          </Text>

          <FormLabel text="RESPONSABLE *" />

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.textSecondary}
            />

            <TextInput
              style={styles.input}
              value={responsable}
              onChangeText={setResponsable}
              placeholder="ID, usuario o nombre del responsable"
              placeholderTextColor={colors.placeholder}
              maxLength={100}
            />
          </View>

          <FormLabel text="UBICACIÓN" />

          <View style={styles.inputContainer}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.textSecondary}
            />

            <TextInput
              style={styles.input}
              value={ubicacion}
              onChangeText={setUbicacion}
              placeholder="Ej. Almacén principal"
              placeholderTextColor={colors.placeholder}
              maxLength={120}
            />
          </View>

          <View style={styles.requiredRow}>
            <Text style={styles.requiredText}>
              * Campos obligatorios
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleGuardar}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.saveButtonText}>
              Crear auditoría
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelar}
            activeOpacity={0.75}
          >
            <Ionicons
              name="close-outline"
              size={20}
              color={colors.textSecondary}
            />

            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppShell>
  );
}

function FormLabel({ text }) {
  return (
    <Text style={styles.label}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginBottom: 22,
    paddingVertical: 5,
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  eyebrow: {
    fontFamily: monospace,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.accent,
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 20,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,

    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  label: {
    fontFamily: monospace,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 13,
    minHeight: 48,
    marginBottom: 18,
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
    outlineStyle: 'none',
  },

  textArea: {
    minHeight: 125,
    paddingTop: 13,
    paddingBottom: 13,
    color: colors.textPrimary,
    fontSize: 14,
  },

  characterCounter: {
    alignSelf: 'flex-end',
    color: colors.placeholder,
    fontSize: 11,
    marginTop: -13,
    marginBottom: 18,
  },

  helperText: {
    fontSize: 11,
    color: colors.placeholder,
    marginTop: -12,
    marginBottom: 18,
  },

  requiredRow: {
    marginTop: 2,
    marginBottom: 15,
  },

  requiredText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 10,
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
