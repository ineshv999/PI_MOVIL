import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiErrorMessage, endpoints } from '../services/api';
import AppShell from '../components/AppShell';
import {
  colors,
  PageHeading,
  Card,
  FormField,
  PrimaryButton,
} from '../components/ScreenUI';

const roles = ['Administrador', 'Auditor'];

export default function RegistrarUsuarioScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState('Auditor');

  const save = async () => {
    if (!nombre.trim() || !correo.trim() || !usuario.trim() || !contrasena.trim()) {
      Alert.alert('Campos incompletos', 'Completa todos los campos obligatorios.');
      return;
    }

    const parts = nombre.trim().split(/\s+/);
    if (parts.length < 2 || contrasena.length < 8) {
      Alert.alert('Datos invalidos', 'Escribe nombre y apellidos, y una contrasena de al menos 8 caracteres.'); return;
    }
    try {
      await endpoints.createUser({ username: usuario.trim(), password: contrasena, nombres: parts.shift(),
        apellidos: parts.join(' '), correo: correo.trim(), telefono: null }, rol === 'Administrador' ? 'administrador' : 'usuario');
      Alert.alert('Usuario registrado', `${nombre} fue registrado con rol ${rol}.`);
      setNombre(''); setCorreo(''); setUsuario(''); setContrasena(''); setRol('Auditor');
    } catch (error) { Alert.alert('No fue posible registrar', apiErrorMessage(error)); }
  };

  return (
    <AppShell
      navigation={navigation}
      title="Registrar usuario"
      activeRoute="RegistrarUsuario"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeading
          eyebrow="// ALTA DE USUARIOS"
          title="Registrar usuario"
          subtitle="Crea una cuenta para un administrador o auditor del sistema."
        />

        <Card>
          <FormField
            label="NOMBRE COMPLETO *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre y apellidos"
            icon="person-outline"
          />
          <FormField
            label="CORREO INSTITUCIONAL *"
            value={correo}
            onChangeText={setCorreo}
            placeholder="usuario@upq.edu.mx"
            icon="mail-outline"
            keyboardType="email-address"
          />
          <FormField
            label="USUARIO *"
            value={usuario}
            onChangeText={setUsuario}
            placeholder="Nombre de usuario"
            icon="at-outline"
          />
          <FormField
            label="CONTRASEÑA *"
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Contraseña temporal"
            icon="lock-closed-outline"
            secureTextEntry
          />

          <Text style={styles.label}>ROL *</Text>
          <View style={styles.roleRow}>
            {roles.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.roleButton,
                  rol === item && styles.roleButtonActive,
                ]}
                onPress={() => setRol(item)}
              >
                <Ionicons
                  name={item === 'Administrador' ? 'shield-outline' : 'clipboard-outline'}
                  size={17}
                  color={rol === item ? colors.accentDark : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.roleText,
                    rol === item && styles.roleTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            title="Registrar usuario"
            icon="person-add-outline"
            onPress={save}
          />
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 42,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.65,
    fontWeight: '800',
    marginBottom: 7,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  roleButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  roleButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  roleTextActive: {
    color: colors.accentDark,
  },
});
